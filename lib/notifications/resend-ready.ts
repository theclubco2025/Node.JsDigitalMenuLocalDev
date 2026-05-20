import { prisma } from '@/lib/prisma'
import { buildReadyMessage } from '@/lib/notifications/email-copy'
import { resendConfigured, safeErr, sendResendEmail } from '@/lib/notifications/resend-client'

export type SendReadyOrderEmailResult =
  | { ok: true; status: 'sent'; messageId: string }
  | { ok: true; status: 'skipped'; reason: 'not_configured' | 'not_found' | 'not_ready' | 'no_email' | 'already_sent' | 'not_paid' }
  | { ok: false; status: 'failed'; error: string }

export async function sendReadyOrderEmail(args: {
  orderId: string
  tenantId: string
  tenantName: string
}): Promise<SendReadyOrderEmailResult> {
  if (!resendConfigured()) return { ok: true, status: 'skipped', reason: 'not_configured' }

  const orderId = String(args.orderId || '').trim()
  const tenantId = String(args.tenantId || '').trim()
  if (!orderId || !tenantId) return { ok: false, status: 'failed', error: 'missing_ids' }

  const o = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      tenantId: true,
      status: true,
      paidAt: true,
      customerEmail: true,
      tableNumber: true,
      readyEmailSentAt: true,
    },
  }).catch(() => null)

  if (!o || o.tenantId !== tenantId) return { ok: true, status: 'skipped', reason: 'not_found' }
  if (!o.paidAt) return { ok: true, status: 'skipped', reason: 'not_paid' }
  if (o.status !== 'READY') return { ok: true, status: 'skipped', reason: 'not_ready' }

  const email = String(o.customerEmail || '').trim()
  if (!email) return { ok: true, status: 'skipped', reason: 'no_email' }
  if (o.readyEmailSentAt) return { ok: true, status: 'skipped', reason: 'already_sent' }

  const claimed = await prisma.order.updateMany({
    where: {
      id: orderId,
      tenantId,
      status: 'READY',
      readyEmailSentAt: null,
      customerEmail: { not: null },
    },
    data: { readyEmailSentAt: new Date() },
  })
  if (claimed.count !== 1) return { ok: true, status: 'skipped', reason: 'already_sent' }

  const tenantName = String(args.tenantName || '').trim() || 'your order'
  const isDineIn = Boolean((o.tableNumber || '').trim())
  const body = buildReadyMessage({
    tenantName,
    orderId: o.id,
    isDineIn,
    tableNumber: o.tableNumber,
  })
  const subject = `Your order from ${tenantName} is ready`

  try {
    const { messageId } = await sendResendEmail({
      to: email,
      subject,
      text: `${body}\n\nThis is an automated message about your order.`,
    })
    await prisma.order.update({
      where: { id: orderId },
      data: { readyEmailMessageId: messageId, readyEmailLastError: null },
      select: { id: true },
    }).catch(() => {})
    return { ok: true, status: 'sent', messageId }
  } catch (e) {
    const error = safeErr(e)
    await prisma.order.update({
      where: { id: orderId },
      data: { readyEmailSentAt: null, readyEmailLastError: error },
      select: { id: true },
    }).catch(() => {})
    return { ok: false, status: 'failed', error }
  }
}

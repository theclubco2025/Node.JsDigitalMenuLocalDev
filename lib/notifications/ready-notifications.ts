import { sendReadyOrderEmail } from '@/lib/notifications/resend-ready'
import { sendTwilioReadySms, twilioConfigured } from '@/lib/notifications/twilio'
import { prisma } from '@/lib/prisma'

export type ReadySmsResult =
  | { status: 'disabled' }
  | { status: 'skipped'; reason: string }
  | { status: 'queued'; sid: string; twilioStatus: string }
  | { status: 'failed'; error: string }

export type ReadyEmailResult =
  | { status: 'disabled' }
  | { status: 'skipped'; reason: string }
  | { status: 'sent'; messageId: string }
  | { status: 'failed'; error: string }

function safeErr(e: unknown): string {
  let msg = (e instanceof Error ? e.message : String(e || '')).trim()
  msg = msg.replace(/\+?\d{10,15}/g, '[REDACTED_PHONE]')
  return msg.length > 220 ? `${msg.slice(0, 220)}…` : (msg || 'unknown_error')
}

async function maybeSendReadySms(args: { tenantId: string; tenantName: string; orderId: string }): Promise<ReadySmsResult> {
  if (!twilioConfigured()) return { status: 'disabled' }
  try {
    type SmsOrderRow = {
      id: string
      tenantId: string
      status: string
      smsOptIn: boolean
      readySmsSentAt: Date | null
      customerPhone: string | null
      tableNumber: string | null
    }
    const o = await prisma.order.findUnique({
      where: { id: args.orderId },
      select: {
        id: true,
        tenantId: true,
        status: true,
        smsOptIn: true,
        readySmsSentAt: true,
        customerPhone: true,
        tableNumber: true,
      },
    }) as SmsOrderRow | null

    if (!o || o.tenantId !== args.tenantId) return { status: 'skipped', reason: 'not_found' }
    if (o.status !== 'READY') return { status: 'skipped', reason: 'not_ready' }
    if (!o.smsOptIn) return { status: 'skipped', reason: 'not_opted_in' }
    if (!o.customerPhone) return { status: 'skipped', reason: 'missing_phone' }
    if (o.readySmsSentAt) return { status: 'skipped', reason: 'already_sent' }

    const claimed = await prisma.order.updateMany({
      where: {
        id: args.orderId,
        tenantId: args.tenantId,
        status: 'READY',
        smsOptIn: true,
        readySmsSentAt: null,
        customerPhone: { not: null },
      },
      data: { readySmsSentAt: new Date() },
    })
    if (claimed.count !== 1) return { status: 'skipped', reason: 'already_sent' }

    const isDineIn = Boolean((o.tableNumber || '').trim())
    const sent = await sendTwilioReadySms({
      tenantId: args.tenantId,
      tenantName: args.tenantName,
      orderId: o.id,
      toPhone: o.customerPhone || '',
      isDineIn,
      tableNumber: o.tableNumber,
    })
    await prisma.order.update({
      where: { id: o.id },
      data: {
        twilioReadyMessageSid: sent.sid,
        twilioReadyStatus: sent.status,
        twilioReadyTo: o.customerPhone,
      },
    }).catch(() => {})
    return { status: 'queued', sid: sent.sid, twilioStatus: sent.status }
  } catch (e) {
    const msg = safeErr(e)
    await prisma.order.update({
      where: { id: args.orderId },
      data: { readySmsSentAt: null, twilioReadyStatus: 'failed', twilioReadyErrorMessage: msg },
    }).catch(() => {})
    return { status: 'failed', error: msg }
  }
}

export async function maybeSendReadyNotifications(args: {
  tenantId: string
  tenantName: string
  orderId: string
}): Promise<{ sms: ReadySmsResult; email: ReadyEmailResult }> {
  const [sms, emailResult] = await Promise.all([
    maybeSendReadySms(args),
    sendReadyOrderEmail(args),
  ])

  let email: ReadyEmailResult
  if (emailResult.ok && emailResult.status === 'sent') {
    email = { status: 'sent', messageId: emailResult.messageId }
  } else if (emailResult.ok && emailResult.status === 'skipped') {
    email = { status: 'skipped', reason: emailResult.reason }
  } else if (!emailResult.ok) {
    email = { status: 'failed', error: emailResult.error }
  } else {
    email = { status: 'disabled' }
  }

  return { sms, email }
}

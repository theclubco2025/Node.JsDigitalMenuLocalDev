import { prisma } from '@/lib/prisma'
import {
  buildFollowupD21Email,
  buildFollowupD45Email,
  buildHolidayEmail,
  buildReviewRetentionEmail,
  retentionCopyFromSettings,
  usHolidayCampaign,
} from '@/lib/notifications/email-copy'
import { resendConfigured, safeErr, sendResendEmail } from '@/lib/notifications/resend-client'

const FOLLOW_UP_OFFSETS = [
  { key: 'review_d7', dayOffset: 7, kind: 'review' as const },
  { key: 'followup_d21', dayOffset: 21, kind: 'd21' as const },
  { key: 'followup_d45', dayOffset: 45, kind: 'd45' as const },
]

function startOfDayUtc(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function dayDiffUtc(a: Date, b: Date) {
  const ms = startOfDayUtc(a).getTime() - startOfDayUtc(b).getTime()
  return Math.floor(ms / 86_400_000)
}

type Candidate = {
  tenantId: string
  tenantName: string
  tenantSettings: unknown
  orderId: string
  paidAt: Date
  customerEmail: string
}

export async function runRetentionEmailCron(now: Date = new Date()) {
  if (!resendConfigured()) {
    return { ok: true, skipped: 'resend_not_configured', scanned: 0, queued: 0, sent: 0, failed: 0 }
  }

  const since = new Date(now.getTime() - 120 * 86_400_000)
  const rows = await prisma.order.findMany({
    where: {
      paidAt: { not: null, gte: since },
      marketingSmsOptIn: true,
      customerEmail: { not: null },
      status: { not: 'CANCELED' },
    },
    select: {
      id: true,
      paidAt: true,
      customerEmail: true,
      tenant: { select: { id: true, name: true, settings: true } },
    },
    orderBy: { paidAt: 'desc' },
    take: 2000,
  })

  const dedup = new Map<string, Candidate>()
  for (const r of rows) {
    if (!r.paidAt || !r.customerEmail || !r.tenant?.id) continue
    const email = String(r.customerEmail).trim().toLowerCase()
    if (!email) continue
    const k = `${r.tenant.id}::${email}`
    if (dedup.has(k)) continue
    dedup.set(k, {
      tenantId: r.tenant.id,
      tenantName: String(r.tenant.name || 'your business'),
      tenantSettings: r.tenant.settings,
      orderId: r.id,
      paidAt: r.paidAt,
      customerEmail: email,
    })
  }

  let queued = 0
  let sent = 0
  let failed = 0
  const holiday = usHolidayCampaign(now)

  for (const c of Array.from(dedup.values())) {
    const copy = retentionCopyFromSettings(c.tenantSettings)
    if (!copy.enabled) continue

    const diff = dayDiffUtc(now, c.paidAt)
    const campaigns: Array<{ key: string; content: { subject: string; text: string } }> = []

    for (const row of FOLLOW_UP_OFFSETS) {
      if (row.dayOffset !== diff) continue
      if (row.kind === 'review') {
        campaigns.push({
          key: row.key,
          content: buildReviewRetentionEmail({ tenantName: c.tenantName, reviewUrl: copy.reviewUrl, copy }),
        })
      } else if (row.kind === 'd21') {
        campaigns.push({ key: row.key, content: buildFollowupD21Email({ tenantName: c.tenantName, copy }) })
      } else if (row.kind === 'd45') {
        campaigns.push({ key: row.key, content: buildFollowupD45Email({ tenantName: c.tenantName, copy }) })
      }
    }

    if (holiday) {
      campaigns.push({
        key: holiday.key,
        content: buildHolidayEmail({
          tenantName: c.tenantName,
          holidayKey: holiday.key,
          defaultText: holiday.text,
          copy,
        }),
      })
    }

    if (campaigns.length === 0) continue

    for (const campaign of campaigns) {
      const body = campaign.content.text
      queued += 1
      try {
        const created = await prisma.emailRetentionMessage.create({
          data: {
            tenantId: c.tenantId,
            orderId: c.orderId,
            customerEmail: c.customerEmail,
            campaignKey: campaign.key,
            messageBody: body,
          },
          select: { id: true },
        }).catch((e: unknown) => {
          const code = (e as { code?: string } | null)?.code
          if (code === 'P2002') return null
          throw e
        })
        if (!created?.id) continue

        const { messageId } = await sendResendEmail({
          to: c.customerEmail,
          subject: campaign.content.subject,
          text: `${body}\n\nYou are receiving this because you opted in to marketing messages from ${c.tenantName}.`,
        })
        await prisma.emailRetentionMessage.update({
          where: { id: created.id },
          data: { status: 'sent', sentAt: new Date(), messageId },
          select: { id: true },
        }).catch(() => null)
        sent += 1
      } catch (e) {
        failed += 1
        const err = safeErr(e)
        await prisma.emailRetentionMessage.create({
          data: {
            tenantId: c.tenantId,
            orderId: c.orderId,
            customerEmail: c.customerEmail,
            campaignKey: `${campaign.key}_failed_${Date.now()}`,
            messageBody: body,
            status: 'failed',
            error: err,
          },
          select: { id: true },
        }).catch(() => null)
      }
    }
  }

  return { ok: true, scanned: dedup.size, queued, sent, failed }
}

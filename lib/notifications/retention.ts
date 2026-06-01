import { prisma } from '@/lib/prisma'
import { sendTwilioSms, smsNotificationsEnabled } from '@/lib/notifications/twilio'

type Campaign = {
  key: string
  dayOffset: number
  build: (args: { tenantName: string; reviewUrl?: string }) => string
}

const FOLLOW_UP_CAMPAIGNS: Campaign[] = [
  {
    key: 'review_d7',
    dayOffset: 7,
    build: ({ tenantName, reviewUrl }) =>
      reviewUrl
        ? `How was your meal from ${tenantName}? We'd love your feedback: ${reviewUrl} Reply STOP to opt out, HELP for help.`
        : `How was your meal from ${tenantName}? We'd love your feedback. Reply STOP to opt out, HELP for help.`,
  },
  {
    key: 'followup_d21',
    dayOffset: 21,
    build: ({ tenantName }) =>
      `Thanks for supporting ${tenantName}. We hope to see you again soon! Reply STOP to opt out, HELP for help.`,
  },
  {
    key: 'followup_d45',
    dayOffset: 45,
    build: ({ tenantName }) =>
      `It's been a while since your last order with ${tenantName}. Come back anytime for your favorites. Reply STOP to opt out, HELP for help.`,
  },
]

function startOfDayUtc(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function dayDiffUtc(a: Date, b: Date) {
  const ms = startOfDayUtc(a).getTime() - startOfDayUtc(b).getTime()
  return Math.floor(ms / 86_400_000)
}

function usHolidayCampaign(today: Date): { key: string; text: string } | null {
  const y = today.getUTCFullYear()
  const m = today.getUTCMonth() + 1
  const d = today.getUTCDate()
  // Keep deterministic and simple for v1: seasonal reminders near fixed holidays.
  if (m === 11 && d >= 20 && d <= 27) return { key: `holiday_thanksgiving_${y}`, text: 'Holiday reminder: place your order early this week and skip the rush. Reply STOP to opt out, HELP for help.' }
  if (m === 12 && d >= 18 && d <= 24) return { key: `holiday_winter_${y}`, text: 'Holiday reminder: pre-order now to secure your preferred pickup window. Reply STOP to opt out, HELP for help.' }
  if (m === 7 && d >= 1 && d <= 4) return { key: `holiday_summer_${y}`, text: 'Holiday reminder: order ahead to avoid wait times this week. Reply STOP to opt out, HELP for help.' }
  return null
}

function retentionFromSettings(settings: unknown): { enabled: boolean; reviewUrl?: string } {
  const s = (settings && typeof settings === 'object') ? (settings as Record<string, unknown>) : {}
  const messaging = (s.messaging && typeof s.messaging === 'object') ? (s.messaging as Record<string, unknown>) : {}
  const retention = (messaging.retention && typeof messaging.retention === 'object') ? (messaging.retention as Record<string, unknown>) : {}
  const enabled = retention.enabled !== false
  const reviewUrl = typeof retention.reviewUrl === 'string' ? retention.reviewUrl.trim() : ''
  return { enabled, reviewUrl: reviewUrl || undefined }
}

type Candidate = {
  tenantId: string
  tenantName: string
  tenantSettings: unknown
  orderId: string
  paidAt: Date
  customerPhone: string
}

export async function runRetentionSmsCron(now: Date = new Date()) {
  if (!smsNotificationsEnabled()) {
    return { ok: true, skipped: 'sms_not_enabled', scanned: 0, queued: 0, sent: 0, failed: 0 }
  }

  const since = new Date(now.getTime() - 120 * 86_400_000)
  const rows = await prisma.order.findMany({
    where: {
      paidAt: { not: null, gte: since },
      marketingSmsOptIn: true,
      customerPhone: { not: null },
      status: { not: 'CANCELED' },
    },
    select: {
      id: true,
      paidAt: true,
      customerPhone: true,
      tenant: { select: { id: true, name: true, settings: true } },
    },
    orderBy: { paidAt: 'desc' },
    take: 2000,
  })

  const dedup = new Map<string, Candidate>()
  for (const r of rows) {
    if (!r.paidAt || !r.customerPhone || !r.tenant?.id) continue
    const k = `${r.tenant.id}::${r.customerPhone}`
    if (dedup.has(k)) continue
    dedup.set(k, {
      tenantId: r.tenant.id,
      tenantName: String(r.tenant.name || 'your business'),
      tenantSettings: r.tenant.settings,
      orderId: r.id,
      paidAt: r.paidAt,
      customerPhone: r.customerPhone,
    })
  }

  let queued = 0
  let sent = 0
  let failed = 0
  const holiday = usHolidayCampaign(now)

  for (const c of Array.from(dedup.values())) {
    const cfg = retentionFromSettings(c.tenantSettings)
    if (!cfg.enabled) continue

    const diff = dayDiffUtc(now, c.paidAt)
    const campaigns = FOLLOW_UP_CAMPAIGNS.filter(x => x.dayOffset === diff)
    if (holiday) {
      campaigns.push({
        key: holiday.key,
        dayOffset: diff,
        build: ({ tenantName }) => `${tenantName}: ${holiday.text}`,
      })
    }
    if (campaigns.length === 0) continue

    for (const campaign of campaigns) {
      const body = campaign.build({ tenantName: c.tenantName, reviewUrl: cfg.reviewUrl })
      queued += 1
      try {
        const created = await prisma.smsRetentionMessage.create({
          data: {
            tenantId: c.tenantId,
            orderId: c.orderId,
            phoneRaw: c.customerPhone,
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

        const tw = await sendTwilioSms({ tenantId: c.tenantId, toPhone: c.customerPhone, body })
        await prisma.smsRetentionMessage.update({
          where: { id: created.id },
          data: { status: 'sent', sentAt: new Date(), messageSid: tw.sid },
          select: { id: true },
        }).catch(() => null)
        sent += 1
      } catch (e) {
        failed += 1
        const err = (e instanceof Error ? e.message : String(e || '')).slice(0, 300) || 'unknown_error'
        await prisma.smsRetentionMessage.create({
          data: {
            tenantId: c.tenantId,
            orderId: c.orderId,
            phoneRaw: c.customerPhone,
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

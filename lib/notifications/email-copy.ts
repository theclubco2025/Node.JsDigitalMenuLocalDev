import { computePickupCode } from '@/lib/orders/pickupCode'

export type ReadyMessageContext = {
  tenantName: string
  orderId: string
  isDineIn: boolean
  tableNumber?: string | null
}

export function buildReadyMessage(ctx: ReadyMessageContext): string {
  const tenant = (ctx.tenantName || 'this business').trim()
  if (ctx.isDineIn) {
    const table = (ctx.tableNumber || '').trim()
    const where = table ? ` for table ${table}` : ''
    return `Your order from ${tenant} is ready${where}.`
  }
  const code = computePickupCode(ctx.orderId)
  return `Your order from ${tenant} is ready for pickup. Pickup code: ${code}.`
}

export type RetentionCopySettings = {
  enabled: boolean
  reviewUrl?: string
  reviewSubject?: string
  reviewBody?: string
  followupD21Body?: string
  followupD45Body?: string
  holidayThanksgiving?: string
  holidayWinter?: string
  holidaySummer?: string
}

export function retentionCopyFromSettings(settings: unknown): RetentionCopySettings {
  const s = (settings && typeof settings === 'object') ? (settings as Record<string, unknown>) : {}
  const messaging = (s.messaging && typeof s.messaging === 'object') ? (s.messaging as Record<string, unknown>) : {}
  const retention = (messaging.retention && typeof messaging.retention === 'object') ? (messaging.retention as Record<string, unknown>) : {}
  const str = (k: string) => (typeof retention[k] === 'string' ? retention[k].trim() : '') || undefined
  return {
    enabled: retention.enabled !== false,
    reviewUrl: str('reviewUrl'),
    reviewSubject: str('reviewSubject'),
    reviewBody: str('reviewBody'),
    followupD21Body: str('followupD21Body'),
    followupD45Body: str('followupD45Body'),
    holidayThanksgiving: str('holidayThanksgiving'),
    holidayWinter: str('holidayWinter'),
    holidaySummer: str('holidaySummer'),
  }
}

function applyPlaceholders(template: string, vars: Record<string, string>): string {
  let out = template
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{${k}}`).join(v)
  }
  return out
}

export type RetentionEmailContent = { subject: string; text: string }

export function buildReviewRetentionEmail(args: {
  tenantName: string
  reviewUrl?: string
  copy: RetentionCopySettings
}): RetentionEmailContent {
  const tenantName = args.tenantName.trim() || 'your business'
  const reviewUrl = (args.copy.reviewUrl || args.reviewUrl || '').trim()
  const vars = { tenantName, reviewUrl }
  const subject = args.copy.reviewSubject
    ? applyPlaceholders(args.copy.reviewSubject, vars)
    : `How was your meal from ${tenantName}?`
  const text = args.copy.reviewBody
    ? applyPlaceholders(args.copy.reviewBody, vars)
    : reviewUrl
      ? `How was your meal from ${tenantName}? We'd love your feedback: ${reviewUrl}`
      : `How was your meal from ${tenantName}? We'd love your feedback.`
  return { subject, text }
}

export function buildFollowupD21Email(args: { tenantName: string; copy: RetentionCopySettings }): RetentionEmailContent {
  const tenantName = args.tenantName.trim() || 'your business'
  const text = args.copy.followupD21Body
    ? applyPlaceholders(args.copy.followupD21Body, { tenantName })
    : `Thanks for supporting ${tenantName}. We hope to see you again soon!`
  return { subject: `Thanks from ${tenantName}`, text }
}

export function buildFollowupD45Email(args: { tenantName: string; copy: RetentionCopySettings }): RetentionEmailContent {
  const tenantName = args.tenantName.trim() || 'your business'
  const text = args.copy.followupD45Body
    ? applyPlaceholders(args.copy.followupD45Body, { tenantName })
    : `It's been a while since your last order with ${tenantName}. Come back anytime for your favorites.`
  return { subject: `We miss you at ${tenantName}`, text }
}

export function buildHolidayEmail(args: {
  tenantName: string
  holidayKey: string
  defaultText: string
  copy: RetentionCopySettings
}): RetentionEmailContent {
  const tenantName = args.tenantName.trim() || 'your business'
  let custom: string | undefined
  if (args.holidayKey.includes('thanksgiving')) custom = args.copy.holidayThanksgiving
  else if (args.holidayKey.includes('winter')) custom = args.copy.holidayWinter
  else if (args.holidayKey.includes('summer')) custom = args.copy.holidaySummer
  const text = custom
    ? applyPlaceholders(custom, { tenantName })
    : `${tenantName}: ${args.defaultText}`
  return { subject: `A note from ${tenantName}`, text }
}

export function usHolidayCampaign(today: Date): { key: string; text: string } | null {
  const y = today.getUTCFullYear()
  const m = today.getUTCMonth() + 1
  const d = today.getUTCDate()
  if (m === 11 && d >= 20 && d <= 27) {
    return { key: `holiday_thanksgiving_${y}`, text: 'Holiday reminder: place your order early this week and skip the rush.' }
  }
  if (m === 12 && d >= 18 && d <= 24) {
    return { key: `holiday_winter_${y}`, text: 'Holiday reminder: pre-order now to secure your preferred pickup window.' }
  }
  if (m === 7 && d >= 1 && d <= 4) {
    return { key: `holiday_summer_${y}`, text: 'Holiday reminder: order ahead to avoid wait times this week.' }
  }
  return null
}

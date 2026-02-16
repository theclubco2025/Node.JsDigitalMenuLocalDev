import { computePickupCode } from '@/lib/orders/pickupCode'

function env(name: string): string {
  return String(process.env[name] || '').trim()
}

export function twilioConfigured(): boolean {
  return Boolean(
    env('TWILIO_ACCOUNT_SID')
    && env('TWILIO_API_KEY_SID')
    && env('TWILIO_API_KEY_SECRET')
    && env('TWILIO_MESSAGING_SERVICE_SID')
  )
}

function toE164(raw: string): string | null {
  const s = String(raw || '').trim()
  if (!s) return null
  if (s.startsWith('+')) {
    const digits = s.slice(1).replace(/[^\d]/g, '')
    if (!digits) return null
    return `+${digits}`
  }
  const digits = s.replace(/[^\d]/g, '')
  if (digits.length === 10) return `+1${digits}` // default US
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  if (digits.length >= 8 && digits.length <= 15) return `+${digits}` // best-effort
  return null
}

export type ReadySmsContext = {
  tenantName: string
  orderId: string
  toPhone: string
  isDineIn: boolean
  tableNumber?: string | null
}

export function buildReadySmsBody(ctx: ReadySmsContext): string {
  const tenant = (ctx.tenantName || 'the restaurant').trim()
  if (ctx.isDineIn) {
    const table = (ctx.tableNumber || '').trim()
    const where = table ? ` for table ${table}` : ''
    return `Your order from ${tenant} is ready${where}. Reply STOP to opt out.`
  }
  const code = computePickupCode(ctx.orderId)
  return `Your order from ${tenant} is ready for pickup. Pickup code: ${code}. Reply STOP to opt out.`
}

export async function sendTwilioSms(args: { toPhone: string; body: string }): Promise<{ sid: string }> {
  if (!twilioConfigured()) {
    throw new Error('Twilio is not configured (missing env vars).')
  }
  const accountSid = env('TWILIO_ACCOUNT_SID')
  const apiKeySid = env('TWILIO_API_KEY_SID')
  const apiKeySecret = env('TWILIO_API_KEY_SECRET')
  const messagingServiceSid = env('TWILIO_MESSAGING_SERVICE_SID')

  const to = toE164(args.toPhone)
  if (!to) throw new Error('Invalid phone number')

  const body = String(args.body || '').trim()
  if (!body) throw new Error('Missing SMS body')

  const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`
  const form = new URLSearchParams()
  form.set('MessagingServiceSid', messagingServiceSid)
  form.set('To', to)
  form.set('Body', body)

  const basic = Buffer.from(`${apiKeySid}:${apiKeySecret}`).toString('base64')
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: form.toString(),
    cache: 'no-store',
  })

  const text = await res.text().catch(() => '')
  if (!res.ok) {
    throw new Error(`Twilio send failed (${res.status}): ${text || res.statusText}`)
  }
  let data: unknown = null
  try { data = text ? (JSON.parse(text) as unknown) : null } catch { data = null }
  const sid = (() => {
    if (!data || typeof data !== 'object') return ''
    const rec = data as Record<string, unknown>
    return typeof rec.sid === 'string' ? rec.sid.trim() : ''
  })()
  if (!sid) throw new Error('Twilio send failed: missing message sid')
  return { sid }
}

export async function sendTwilioReadySms(ctx: ReadySmsContext): Promise<{ sid: string }> {
  return await sendTwilioSms({ toPhone: ctx.toPhone, body: buildReadySmsBody(ctx) })
}


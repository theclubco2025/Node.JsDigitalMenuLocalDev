import { Resend } from 'resend'

function env(name: string): string {
  return String(process.env[name] || '').trim()
}

export function resendConfigured(): boolean {
  return Boolean(env('RESEND_API_KEY') && env('RESEND_FROM'))
}

export function normalizedResendFrom(raw: string): string {
  const v = String(raw || '').trim()
  if (!v) return ''
  if (v.includes('@')) return v
  const domain = v.replace(/^@+/, '')
  return `orders@${domain}`
}

export function safeErr(e: unknown): string {
  const msg = (e instanceof Error ? e.message : String(e || '')).trim()
  const trimmed = msg.length > 300 ? `${msg.slice(0, 300)}…` : msg
  return trimmed || 'unknown_error'
}

export async function sendResendEmail(args: {
  to: string | string[]
  subject: string
  text: string
  html?: string
}): Promise<{ messageId: string }> {
  if (!resendConfigured()) throw new Error('Resend is not configured')
  const resend = new Resend(env('RESEND_API_KEY'))
  const from = normalizedResendFrom(env('RESEND_FROM'))
  const replyTo = env('RESEND_REPLY_TO')
  const to = Array.isArray(args.to) ? args.to : [args.to]

  const sent = await resend.emails.send({
    from,
    to,
    ...(replyTo ? { replyTo } : {}),
    subject: args.subject.slice(0, 200),
    text: args.text,
    ...(args.html ? { html: args.html } : {}),
  })

  const messageId = String((sent as unknown as { id?: unknown })?.id || '').trim()
  if (!messageId) throw new Error('Resend returned no message id')
  return { messageId }
}

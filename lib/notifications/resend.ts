import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'

function env(name: string): string {
  return String(process.env[name] || '').trim()
}

export function resendConfigured(): boolean {
  return Boolean(env('RESEND_API_KEY') && env('RESEND_FROM'))
}

function normalizedResendFrom(raw: string): string {
  const v = String(raw || '').trim()
  if (!v) return ''
  if (v.includes('@')) return v
  // Accept domain-only env input and convert to a valid sender.
  const domain = v.replace(/^@+/, '')
  return `orders@${domain}`
}

function splitEmails(raw: string): string[] {
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

function newOrderEmailsFromSettings(settings: unknown): string[] {
  const s = (settings && typeof settings === 'object') ? (settings as Record<string, unknown>) : {}
  const notifications = (s.notifications && typeof s.notifications === 'object') ? (s.notifications as Record<string, unknown>) : {}
  const raw = notifications.newOrderEmails
  if (Array.isArray(raw)) {
    return raw.map(v => String(v || '').trim()).filter(Boolean)
  }
  if (typeof raw === 'string') return splitEmails(raw)
  return []
}

function formatMoney(cents: number, currency: string) {
  const cur = (currency || 'usd').toUpperCase()
  const dollars = (Number(cents) || 0) / 100
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(dollars)
  } catch {
    return `${cur} ${dollars.toFixed(2)}`
  }
}

function safeErr(e: unknown): string {
  const msg = (e instanceof Error ? e.message : String(e || '')).trim()
  const trimmed = msg.length > 300 ? `${msg.slice(0, 300)}…` : msg
  return trimmed || 'unknown_error'
}

type AddOn = { name?: unknown; priceDeltaCents?: unknown }
function renderAddOns(addOns: unknown): string {
  if (!Array.isArray(addOns) || addOns.length === 0) return ''
  const parts: string[] = []
  for (const a of addOns as AddOn[]) {
    const name = String(a?.name || '').trim()
    if (!name) continue
    const centsRaw = typeof a?.priceDeltaCents === 'number' ? a.priceDeltaCents : Number(a?.priceDeltaCents)
    const cents = Number.isFinite(centsRaw) ? Math.max(0, Math.floor(centsRaw)) : 0
    parts.push(cents > 0 ? `${name} (+${(cents / 100).toFixed(2)})` : name)
  }
  return parts.length ? `Add-ons: ${parts.join(', ')}` : ''
}

export type SendNewOrderEmailResult =
  | { ok: true; status: 'sent'; to: string[]; messageId: string }
  | { ok: true; status: 'skipped'; reason: 'not_configured' | 'no_recipients' | 'already_sent' | 'recent_attempt' | 'not_paid' | 'tenant_mismatch' }
  | { ok: false; status: 'failed'; error: string }

export async function sendNewOrderEmail(args: {
  orderId: string
  baseUrl: string
}): Promise<SendNewOrderEmailResult> {
  if (!resendConfigured()) return { ok: true, status: 'skipped', reason: 'not_configured' }

  const orderId = String(args.orderId || '').trim()
  if (!orderId) return { ok: false, status: 'failed', error: 'missing_orderId' }

  const baseUrl = String(args.baseUrl || '').trim().replace(/\/$/, '')

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      currency: true,
      subtotalCents: true,
      tipCents: true,
      totalCents: true,
      scheduledFor: true,
      timezone: true,
      paidAt: true,
      createdAt: true,
      tableNumber: true,
      note: true,
      customerEmail: true,
      customerName: true,
      customerPhone: true,
      smsOptIn: true,
      newOrderEmailSentAt: true,
      newOrderEmailLastAttemptAt: true,
      items: {
        select: {
          id: true,
          name: true,
          quantity: true,
          unitPriceCents: true,
          note: true,
          addOns: true,
        },
      },
      tenant: {
        select: { id: true, slug: true, name: true, settings: true },
      },
    },
  })

  if (!order) return { ok: false, status: 'failed', error: 'order_not_found' }
  if (!order.tenant?.id) return { ok: false, status: 'failed', error: 'tenant_not_found' }
  if (!order.paidAt) return { ok: true, status: 'skipped', reason: 'not_paid' }

  // Idempotency: if already sent, do nothing.
  if (order.newOrderEmailSentAt) return { ok: true, status: 'skipped', reason: 'already_sent' }

  const to = newOrderEmailsFromSettings(order.tenant.settings)
  if (to.length === 0) return { ok: true, status: 'skipped', reason: 'no_recipients' }

  // Avoid spamming on rapid webhook retries: only attempt once every 2 minutes until it succeeds.
  const lastAttemptAt = order.newOrderEmailLastAttemptAt ? new Date(order.newOrderEmailLastAttemptAt).getTime() : 0
  if (lastAttemptAt && Date.now() - lastAttemptAt < 2 * 60_000) {
    return { ok: true, status: 'skipped', reason: 'recent_attempt' }
  }

  // Mark attempt before sending (best-effort). This is intentionally not a hard gate; it just reduces duplicates.
  await prisma.order.update({
    where: { id: orderId },
    data: {
      newOrderEmailLastAttemptAt: new Date(),
      newOrderEmailAttemptCount: { increment: 1 },
      newOrderEmailLastError: null,
    },
    select: { id: true },
  }).catch(() => {})

  const tenantName = String(order.tenant.name || order.tenant.slug || '').trim() || 'New order'
  const when =
    order.scheduledFor
      ? `Scheduled: ${new Date(order.scheduledFor).toLocaleString('en-US', { timeZone: order.timezone || undefined })} (${order.timezone})`
      : 'Scheduled: ASAP'
  const dineIn = (order.tableNumber || '').trim()
  const fulfillment = dineIn ? `Dine-in (Table ${dineIn})` : 'Pickup'

  const lines: string[] = []
  lines.push(`New order for ${tenantName}`)
  lines.push('')
  lines.push(`Order ID: ${order.id}`)
  lines.push(`Status: ${order.status}`)
  lines.push(`Paid: ${order.paidAt ? new Date(order.paidAt).toISOString() : '—'}`)
  lines.push(`Created: ${new Date(order.createdAt).toISOString()}`)
  lines.push(`Fulfillment: ${fulfillment}`)
  lines.push(when)
  lines.push('')
  lines.push('Customer')
  lines.push(`- Name: ${order.customerName || '—'}`)
  lines.push(`- Email: ${order.customerEmail || '—'}`)
  lines.push(`- Phone: ${order.customerPhone || '—'}`)
  lines.push(`- SMS Opt-in: ${order.smsOptIn ? 'Yes' : 'No'}`)
  if (order.note) {
    lines.push('')
    lines.push('Special instructions')
    lines.push(order.note)
  }
  lines.push('')
  lines.push('Items')
  for (const it of order.items || []) {
    const qty = Number(it.quantity) || 0
    const unit = Number(it.unitPriceCents) || 0
    lines.push(`- ${qty}× ${it.name} — ${formatMoney(unit * qty, order.currency)}`)
    const addOns = renderAddOns(it.addOns)
    if (addOns) lines.push(`  ${addOns}`)
    if (it.note) lines.push(`  Note: ${it.note}`)
  }
  lines.push('')
  lines.push(`Subtotal: ${formatMoney(order.subtotalCents, order.currency)}`)
  lines.push(`Tip: ${formatMoney(order.tipCents || 0, order.currency)}`)
  lines.push(`Total: ${formatMoney(order.totalCents, order.currency)}`)

  if (baseUrl) {
    lines.push('')
    lines.push('Links')
    lines.push(`- Admin orders: ${baseUrl}/admin/orders?tenant=${encodeURIComponent(order.tenant.slug)}`)
    lines.push(`- Kitchen login: ${baseUrl}/kds`)
  }

  const subjectBits = [
    'New order',
    tenantName,
    formatMoney(order.totalCents, order.currency),
    order.scheduledFor ? 'Scheduled' : 'ASAP',
  ].filter(Boolean)
  const subject = subjectBits.join(' — ').slice(0, 200)

  try {
    const resend = new Resend(env('RESEND_API_KEY'))
    const from = normalizedResendFrom(env('RESEND_FROM'))
    const replyTo = env('RESEND_REPLY_TO')

    const sent = await resend.emails.send({
      from,
      to,
      ...(replyTo ? { replyTo } : {}),
      subject,
      text: lines.join('\n'),
    })

    const messageId = String((sent as unknown as { id?: unknown })?.id || '').trim()
    if (!messageId) throw new Error('Resend returned no message id')

    await prisma.order.update({
      where: { id: orderId },
      data: {
        newOrderEmailSentAt: new Date(),
        newOrderEmailLastError: null,
      },
      select: { id: true },
    }).catch(() => {})

    return { ok: true, status: 'sent', to, messageId }
  } catch (e) {
    const error = safeErr(e)
    await prisma.order.update({
      where: { id: orderId },
      data: { newOrderEmailLastError: error },
      select: { id: true },
    }).catch(() => {})
    return { ok: false, status: 'failed', error }
  }
}


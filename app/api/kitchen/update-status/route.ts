import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { sendTwilioReadySms, twilioConfigured } from '@/lib/notifications/twilio'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const StatusSchema = z.enum(['NEW', 'PREPARING', 'READY', 'COMPLETED', 'CANCELED'])

function kitchenPinFromSettings(settings: unknown): string {
  if (!settings || typeof settings !== 'object') return ''
  const v = (settings as Record<string, unknown>).kitchenPin
  return typeof v === 'string' ? v.trim() : ''
}

function resolveKitchenTenantSlug(raw: string): string {
  const t = (raw || '').trim().toLowerCase()
  if (t === 'independent-kitchen-draft') return 'independent-draft'
  return t
}

function expectedKitchenPin(tenantSlug: string, settings: unknown): string {
  const fromSettings = kitchenPinFromSettings(settings)
  if (fromSettings) return fromSettings
  // Preview-only default for Independent draft POC (still behind Vercel protection).
  if (process.env.VERCEL_ENV === 'preview' && (tenantSlug === 'independent-draft' || tenantSlug === 'independent-kitchen-draft')) return '1234'
  return ''
}

function isAuthorized(req: NextRequest, tenantSlug: string, settings: unknown): boolean {
  const pin = expectedKitchenPin(tenantSlug, settings)
  if (!pin) return false
  const provided = (req.headers.get('x-kitchen-pin') || '').trim()
  return provided === pin
}

type SmsResult =
  | { status: 'disabled' }
  | { status: 'skipped'; reason: 'not_opted_in' | 'missing_phone' | 'already_sent' | 'not_ready' | 'not_found' }
  | { status: 'sent'; sid: string }
  | { status: 'failed'; error: string }

function safeErr(e: unknown): string {
  const msg = (e instanceof Error ? e.message : String(e || '')).trim()
  return msg.length > 220 ? `${msg.slice(0, 220)}…` : (msg || 'unknown_error')
}

async function maybeSendReadySms(args: { tenantId: string; tenantName: string; orderId: string }): Promise<SmsResult> {
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
    let o: SmsOrderRow | null = null

    try {
      o = await prisma.order.findUnique({
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
      }) as unknown as SmsOrderRow | null
    } catch (e) {
      const code = (e as { code?: string } | null)?.code
      const msg = safeErr(e)
      if (code === 'P2022' || msg.toLowerCase().includes('does not exist')) {
        console.error('[sms] DB schema missing SMS columns', { orderId: args.orderId, tenantId: args.tenantId, msg })
        return { status: 'failed', error: 'SMS database migration not applied yet' }
      }
      console.error('[sms] Failed to load order for SMS', { orderId: args.orderId, tenantId: args.tenantId, msg })
      return { status: 'failed', error: msg }
    }

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
    try {
      const sent = await sendTwilioReadySms({
        tenantName: args.tenantName,
        orderId: o.id,
        toPhone: o.customerPhone || '',
        isDineIn,
        tableNumber: o.tableNumber,
      })
      await prisma.order.update({ where: { id: o.id }, data: { twilioReadyMessageSid: sent.sid } })
      return { status: 'sent', sid: sent.sid }
    } catch (e) {
      const msg = safeErr(e)
      console.error('[sms] Twilio send failed', { orderId: o.id, tenantId: args.tenantId, msg })
      await prisma.order.update({ where: { id: o.id }, data: { readySmsSentAt: null, twilioReadyMessageSid: null } }).catch(() => {})
      return { status: 'failed', error: msg }
    }
  } catch (e) {
    const msg = safeErr(e)
    console.error('[sms] Unexpected SMS error', { orderId: args.orderId, tenantId: args.tenantId, msg })
    return { status: 'failed', error: msg }
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, error: 'DATABASE_URL required' }, { status: 501 })
    }
    const { searchParams } = new URL(req.url)
    const tenant = resolveKitchenTenantSlug(searchParams.get('tenant') || '')
    const orderId = (searchParams.get('orderId') || '').trim()
    const statusRaw = (searchParams.get('status') || '').trim()
    const statusParsed = StatusSchema.safeParse(statusRaw)

    if (!tenant) return NextResponse.json({ ok: false, error: 'Missing tenant' }, { status: 400 })
    if (!orderId) return NextResponse.json({ ok: false, error: 'Missing orderId' }, { status: 400 })
    if (!statusParsed.success) return NextResponse.json({ ok: false, error: 'Invalid status' }, { status: 400 })

    const t = await prisma.tenant.findUnique({ where: { slug: tenant }, select: { id: true, name: true, settings: true } })
    if (!t) return NextResponse.json({ ok: false, error: 'Tenant not found' }, { status: 404 })
    if (!isAuthorized(req, tenant, t.settings)) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true, tenantId: true } })
    if (!order) return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 })
    if (order.tenantId !== t.id) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: statusParsed.data },
      select: { id: true, status: true },
    })

    if (updated.status === 'READY') {
      const sms = await maybeSendReadySms({ tenantId: t.id, tenantName: t.name || tenant, orderId: updated.id })
      return NextResponse.json({ ok: true, order: updated, sms }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
    }
    return NextResponse.json({ ok: true, order: updated }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error)?.message || 'Kitchen update error' }, { status: 500 })
  }
}


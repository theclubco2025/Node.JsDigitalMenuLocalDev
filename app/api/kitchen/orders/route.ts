import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import type { OrderStatus } from '@prisma/client'
import { ensureOrdersSchemaPreview } from '@/lib/server/preview-orders-schema'
import { computePickupCode } from '@/lib/orders/pickupCode'
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
  if (process.env.VERCEL_ENV === 'preview' && (tenantSlug === 'independent-draft' || tenantSlug === 'independent-kitchen-draft' || tenantSlug === 'demo')) return '1234'
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
  | { status: 'queued'; sid: string; twilioStatus: string }
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

    // Best-effort: record attempt metadata before claiming.
    await prisma.order.update({
      where: { id: o.id },
      data: {
        twilioReadyAttemptCount: { increment: 1 },
        twilioReadyLastAttemptAt: new Date(),
        twilioReadyTo: o.customerPhone,
        twilioReadyStatus: null,
        twilioReadyErrorCode: null,
        twilioReadyErrorMessage: null,
      },
    }).catch(() => {})

    // Claim the send (idempotent). If another request already claimed it, we skip.
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
      await prisma.order.update({
        where: { id: o.id },
        data: { twilioReadyMessageSid: sent.sid, twilioReadyStatus: sent.status, twilioReadyTo: o.customerPhone },
      })
      return { status: 'queued', sid: sent.sid, twilioStatus: sent.status }
    } catch (e) {
      const msg = safeErr(e)
      console.error('[sms] Twilio send failed', { orderId: o.id, tenantId: args.tenantId, msg })
      // If send fails, clear claim so a retry is possible from KDS.
      await prisma.order.update({
        where: { id: o.id },
        data: {
          readySmsSentAt: null,
          twilioReadyMessageSid: null,
          twilioReadyStatus: 'failed',
          twilioReadyErrorMessage: msg,
        },
      }).catch(() => {})
      return { status: 'failed', error: msg }
    }
  } catch (e) {
    const msg = safeErr(e)
    console.error('[sms] Unexpected SMS error', { orderId: args.orderId, tenantId: args.tenantId, msg })
    // Never break the kitchen workflow due to notification issues.
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
    if (!tenant) return NextResponse.json({ ok: false, error: 'Missing tenant' }, { status: 400 })

    const t = await prisma.tenant.findUnique({ where: { slug: tenant }, select: { id: true, slug: true, name: true, settings: true } })
    if (!t) return NextResponse.json({ ok: false, error: 'Tenant not found' }, { status: 404 })
    if (!isAuthorized(req, tenant, t.settings)) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

    const view = (searchParams.get('view') || 'active').trim().toLowerCase()
    const historyHoursRaw = (searchParams.get('historyHours') || '').trim()
    const historyHours = historyHoursRaw ? Number(historyHoursRaw) : 24
    const allHistory = ['1', 'true', 'yes', 'all'].includes((searchParams.get('all') || '').trim().toLowerCase())

    const inStatus = (values: OrderStatus[]) => ({ in: values })
    const baseWhere = { tenantId: t.id, paidAt: { not: null } }
    const where =
      view === 'all'
        ? baseWhere
        : view === 'history'
          ? {
              ...baseWhere,
              status: inStatus(['COMPLETED', 'CANCELED']),
              ...(allHistory || !Number.isFinite(historyHours) || historyHours <= 0
                ? {}
                : { createdAt: { gte: new Date(Date.now() - historyHours * 60 * 60 * 1000) } }),
            }
          : { ...baseWhere, status: inStatus(['NEW', 'PREPARING', 'READY']) }

    const fetchOrders = async (withExtras: boolean) => {
      return await prisma.order.findMany({
        where,
        orderBy: view === 'active' ? { createdAt: 'asc' } : { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          status: true,
          totalCents: true,
          scheduledFor: true,
          timezone: true,
          paidAt: true,
          createdAt: true,
          ...(withExtras ? { tableNumber: true } : {}),
          ...(withExtras ? { note: true } : {}),
          ...(withExtras ? {
            smsOptIn: true,
            twilioReadyStatus: true,
            twilioReadyErrorCode: true,
            twilioReadyErrorMessage: true,
            twilioReadyAttemptCount: true,
          } : {}),
          items: {
            select: {
              id: true,
              name: true,
              quantity: true,
              unitPriceCents: true,
              ...(withExtras ? { note: true, addOns: true } : {}),
            },
          },
        },
      })
    }

    let orders
    try {
      // Prefer the richer payload (notes + add-ons) when the DB supports it.
      orders = await fetchOrders(true)
    } catch (e) {
      const msg = (e as Error)?.message || ''
      const code = (e as { code?: string } | null)?.code
      // Preview-only: auto-create missing schema then retry once (kitchen-only deploy may not have run checkout yet).
      if (msg.includes('The table `public.orders` does not exist')) {
        await ensureOrdersSchemaPreview({ host: req.headers.get('host') || '' })
        orders = await fetchOrders(true)
      } else if (code === 'P2022' || msg.includes('does not exist')) {
        // Production safety: if migrations haven't applied yet, fall back to a minimal select.
        orders = await fetchOrders(false)
      } else {
        throw e
      }
    }

    return NextResponse.json({
      ok: true,
      tenant: { slug: t.slug, name: t.name },
      view,
      orders: orders.map(o => ({
        id: o.id,
        status: o.status,
        totalCents: o.totalCents,
        scheduledFor: o.scheduledFor,
        timezone: o.timezone,
        paidAt: o.paidAt,
        createdAt: o.createdAt,
        pickupCode: computePickupCode(o.id),
        tableNumber: (o as unknown as { tableNumber?: string | null }).tableNumber ?? null,
        note: (o as unknown as { note?: string | null }).note || null,
        sms: {
          optedIn: (o as unknown as { smsOptIn?: boolean }).smsOptIn === true,
          status: (o as unknown as { twilioReadyStatus?: string | null }).twilioReadyStatus ?? null,
          errorCode: (o as unknown as { twilioReadyErrorCode?: number | null }).twilioReadyErrorCode ?? null,
          errorMessage: (o as unknown as { twilioReadyErrorMessage?: string | null }).twilioReadyErrorMessage ?? null,
          attempts: (o as unknown as { twilioReadyAttemptCount?: number | null }).twilioReadyAttemptCount ?? null,
        },
        items: o.items.map(it => ({
          id: it.id,
          name: it.name,
          quantity: it.quantity,
          unitPriceCents: it.unitPriceCents,
          note: (it as unknown as { note?: string | null }).note || null,
          addOns: (it as unknown as { addOns?: unknown }).addOns ?? null,
        })),
      })),
    }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error)?.message || 'Kitchen orders error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, error: 'DATABASE_URL required' }, { status: 501 })
    }
    const { searchParams } = new URL(req.url)
    const tenant = resolveKitchenTenantSlug(searchParams.get('tenant') || '')
    if (!tenant) return NextResponse.json({ ok: false, error: 'Missing tenant' }, { status: 400 })
    
    const Body = z.object({
      orderId: z.string().min(1),
      status: StatusSchema,
    })
    const raw = await req.json().catch(() => ({}))
    const parsed = Body.safeParse(raw)
    if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })

    const t = await prisma.tenant.findUnique({ where: { slug: tenant }, select: { id: true, name: true, settings: true } })
    if (!t) return NextResponse.json({ ok: false, error: 'Tenant not found' }, { status: 404 })
    if (!isAuthorized(req, tenant, t.settings)) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

    const order = await prisma.order.findUnique({ where: { id: parsed.data.orderId }, select: { id: true, tenantId: true } })
    if (!order) return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 })
    if (order.tenantId !== t.id) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })

    const updated = await prisma.order.update({
      where: { id: parsed.data.orderId },
      data: { status: parsed.data.status },
      select: { id: true, status: true },
    })

    if (updated.status === 'READY') {
      const sms = await maybeSendReadySms({ tenantId: t.id, tenantName: t.name || tenant, orderId: updated.id })
      return NextResponse.json({ ok: true, order: updated, sms }, { status: 200 })
    }
    return NextResponse.json({ ok: true, order: updated }, { status: 200 })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error)?.message || 'Kitchen update error' }, { status: 500 })
  }
}


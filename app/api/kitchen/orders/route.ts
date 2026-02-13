import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import type { OrderStatus } from '@prisma/client'
import { ensureOrdersSchemaPreview } from '@/lib/server/preview-orders-schema'
import { computePickupCode } from '@/lib/orders/pickupCode'

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
          ...(withExtras ? { note: true } : {}),
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
        note: (o as unknown as { note?: string | null }).note || null,
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

    const t = await prisma.tenant.findUnique({ where: { slug: tenant }, select: { id: true, settings: true } })
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
    return NextResponse.json({ ok: true, order: updated }, { status: 200 })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error)?.message || 'Kitchen update error' }, { status: 500 })
  }
}


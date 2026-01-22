import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import type { OrderStatus } from '@prisma/client'
import { ensureOrdersSchemaPreview } from '@/lib/server/preview-orders-schema'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const StatusSchema = z.enum(['PENDING_PAYMENT', 'NEW', 'PREPARING', 'READY', 'COMPLETED', 'CANCELED'])

function computePickupCode(orderId: string): string {
  // Deterministic 6-digit code derived from orderId (no extra DB column needed).
  let h = 2166136261
  for (let i = 0; i < orderId.length; i++) {
    h ^= orderId.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const n = Math.abs(h) % 1_000_000
  return String(n).padStart(6, '0')
}

function expectedKitchenPin(tenantSlug: string): string {
  const fromEnv = (process.env.KITCHEN_PIN || '').trim()
  if (fromEnv) return fromEnv
  // Preview-only default for Independent draft POC (still behind Vercel protection).
  if (process.env.VERCEL_ENV === 'preview' && (tenantSlug === 'independent-draft' || tenantSlug === 'independent-kitchen-draft')) return '1234'
  return ''
}

function resolveKitchenTenantSlug(raw: string): string {
  const t = (raw || '').trim().toLowerCase()
  if (t === 'independent-kitchen-draft') return 'independent-draft'
  return t
}

function isAuthorized(req: NextRequest, tenantSlug: string): boolean {
  const pin = expectedKitchenPin(tenantSlug)
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
    if (!isAuthorized(req, tenant)) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

    const t = await prisma.tenant.findUnique({ where: { slug: tenant }, select: { id: true, slug: true, name: true } })
    if (!t) return NextResponse.json({ ok: false, error: 'Tenant not found' }, { status: 404 })

    const view = (searchParams.get('view') || 'active').trim().toLowerCase()
    const inStatus = (values: OrderStatus[]) => ({ in: values })
    const where =
      view === 'all'
        ? { tenantId: t.id }
        : view === 'history'
          ? { tenantId: t.id, status: inStatus(['COMPLETED', 'CANCELED']) }
          : view === 'unpaid'
            ? { tenantId: t.id, status: 'PENDING_PAYMENT' as OrderStatus }
            : { tenantId: t.id, status: inStatus(['NEW', 'PREPARING', 'READY']) }

    let orders
    try {
      orders = await prisma.order.findMany({
        where,
        orderBy: view === 'active' ? { createdAt: 'asc' } : { createdAt: 'desc' },
        take: 50,
        include: { items: true },
      })
    } catch (e) {
      const msg = (e as Error)?.message || ''
      // Preview-only: auto-create missing schema then retry once (kitchen-only deploy may not have run checkout yet).
      if (msg.includes('The table `public.orders` does not exist')) {
        await ensureOrdersSchemaPreview({ host: req.headers.get('host') || '' })
        orders = await prisma.order.findMany({
          where,
          orderBy: view === 'active' ? { createdAt: 'asc' } : { createdAt: 'desc' },
          take: 50,
          include: { items: true },
        })
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
        items: o.items.map(it => ({
          id: it.id,
          name: it.name,
          quantity: it.quantity,
          unitPriceCents: it.unitPriceCents,
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
    if (!isAuthorized(req, tenant)) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

    const Body = z.object({
      orderId: z.string().min(1),
      status: StatusSchema,
    })
    const raw = await req.json().catch(() => ({}))
    const parsed = Body.safeParse(raw)
    if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })

    const t = await prisma.tenant.findUnique({ where: { slug: tenant }, select: { id: true } })
    if (!t) return NextResponse.json({ ok: false, error: 'Tenant not found' }, { status: 404 })

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

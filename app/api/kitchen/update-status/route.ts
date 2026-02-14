import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

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
    const orderId = (searchParams.get('orderId') || '').trim()
    const statusRaw = (searchParams.get('status') || '').trim()
    const statusParsed = StatusSchema.safeParse(statusRaw)

    if (!tenant) return NextResponse.json({ ok: false, error: 'Missing tenant' }, { status: 400 })
    if (!orderId) return NextResponse.json({ ok: false, error: 'Missing orderId' }, { status: 400 })
    if (!statusParsed.success) return NextResponse.json({ ok: false, error: 'Invalid status' }, { status: 400 })

    const t = await prisma.tenant.findUnique({ where: { slug: tenant }, select: { id: true, settings: true } })
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

    return NextResponse.json({ ok: true, order: updated }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error)?.message || 'Kitchen update error' }, { status: 500 })
  }
}


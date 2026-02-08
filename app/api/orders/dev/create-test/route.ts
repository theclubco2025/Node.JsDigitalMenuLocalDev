import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { readMenu } from '@/lib/data/menu'
import { ensureOrdersSchemaPreview } from '@/lib/server/preview-orders-schema'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  tenant: z.string().min(1),
})

function isPreviewRequest(req: NextRequest) {
  if (process.env.VERCEL_ENV === 'preview') return true
  const host = (req.headers.get('host') || '').trim().toLowerCase().split(':')[0] || ''
  return host.includes('-git-') && host.endsWith('.vercel.app')
}

function expectedKitchenPin(tenantSlug: string): string {
  const fromEnv = (process.env.KITCHEN_PIN || '').trim()
  if (fromEnv) return fromEnv
  if (process.env.VERCEL_ENV === 'preview' && (tenantSlug === 'independent-draft' || tenantSlug === 'independent-kitchen-draft')) return '1234'
  return ''
}

function isAuthorized(req: NextRequest, tenantSlug: string): boolean {
  const pin = expectedKitchenPin(tenantSlug)
  if (!pin) return false
  const provided = (req.headers.get('x-kitchen-pin') || '').trim()
  return provided === pin
}

function normalizeTenantSlug(raw: string) {
  const t = raw.trim().toLowerCase()
  if (t === 'independent-kitchen-draft') return 'independent-draft'
  return t
}

function roundMoneyToCents(amount: number): number {
  return Math.round(amount * 100)
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, error: 'DATABASE_URL required' }, { status: 501 })
    }
    if (!isPreviewRequest(req)) {
      return NextResponse.json({ ok: false, error: 'disabled' }, { status: 404 })
    }

    const raw = await req.json().catch(() => ({}))
    const parsed = BodySchema.safeParse(raw)
    if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })

    const tenant = normalizeTenantSlug(parsed.data.tenant)
    if (!isAuthorized(req, tenant)) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

    await ensureOrdersSchemaPreview({ host: req.headers.get('host') || '' })

    // Ensure tenant exists
    const ensuredTenant = await prisma.tenant.upsert({
      where: { slug: tenant },
      update: {},
      create: { slug: tenant, name: tenant },
      select: { id: true },
    })

    // Pick a stable first menu item to create a realistic ticket
    const menu = await readMenu(tenant)
    const first = menu?.categories?.[0]?.items?.[0]
    if (!first?.id || typeof first.price !== 'number') {
      return NextResponse.json({ ok: false, error: 'No menu items available' }, { status: 400 })
    }

    const unitPriceCents = roundMoneyToCents(first.price)
    const order = await prisma.order.create({
      data: {
        tenantId: ensuredTenant.id,
        status: 'NEW',
        fulfillment: 'PICKUP',
        currency: 'usd',
        subtotalCents: unitPriceCents,
        totalCents: unitPriceCents,
        timezone: 'America/Los_Angeles',
        paidAt: new Date(),
        items: {
          create: [{ menuItemId: first.id, name: first.name || first.id, unitPriceCents, quantity: 1 }],
        },
      },
      select: { id: true },
    })

    return NextResponse.json({ ok: true, orderId: order.id }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error)?.message || 'Dev create-test error' }, { status: 500 })
  }
}


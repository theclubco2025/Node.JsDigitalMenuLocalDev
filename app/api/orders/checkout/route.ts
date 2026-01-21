import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { readMenu } from '@/lib/data/menu'
import { getStripe } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  tenant: z.string().min(1),
  items: z.array(z.object({
    id: z.string().min(1),
    quantity: z.number().int().min(1).max(99),
  })).min(1),
  scheduledFor: z.string().datetime().optional().nullable(),
})

function baseUrlFromRequest(req: NextRequest) {
  // Prefer request-derived origin so Vercel Preview redirects work without extra env config.
  const proto = (req.headers.get('x-forwarded-proto') || 'https').split(',')[0]?.trim() || 'https'
  const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '').split(',')[0]?.trim()
  if (host) return `${proto}://${host}`.replace(/\/$/, '')
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3002').replace(/\/$/, '')
}

function getOrderingSettings(settings: unknown) {
  const s = (settings && typeof settings === 'object') ? (settings as Record<string, unknown>) : {}
  const ordering = (s.ordering && typeof s.ordering === 'object') ? (s.ordering as Record<string, unknown>) : {}
  const scheduling = (ordering.scheduling && typeof ordering.scheduling === 'object')
    ? (ordering.scheduling as Record<string, unknown>)
    : {}

  const enabled = ordering.enabled === true
  const timezone = typeof ordering.timezone === 'string' && ordering.timezone.trim()
    ? ordering.timezone.trim()
    : 'America/Los_Angeles'
  const slotMinutes = typeof scheduling.slotMinutes === 'number' && Number.isFinite(scheduling.slotMinutes)
    ? scheduling.slotMinutes
    : 15
  const leadTimeMinutes = typeof scheduling.leadTimeMinutes === 'number' && Number.isFinite(scheduling.leadTimeMinutes)
    ? scheduling.leadTimeMinutes
    : 30

  return { enabled, timezone, slotMinutes, leadTimeMinutes }
}

function roundMoneyToCents(amount: number): number {
  // Avoid float drift by rounding to nearest cent.
  return Math.round(amount * 100)
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, error: 'DATABASE_URL required for ordering' }, { status: 501 })
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ ok: false, error: 'Missing STRIPE_SECRET_KEY' }, { status: 501 })
    }

    const raw = await req.json().catch(() => ({}))
    const parsed = BodySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })
    }

    const tenant = parsed.data.tenant.trim().toLowerCase()
    const items = parsed.data.items
    const scheduledForRaw = parsed.data.scheduledFor ?? null

    // Load tenant settings and gate ordering
    const tenantRow = await prisma.tenant.findUnique({
      where: { slug: tenant },
      select: { id: true, settings: true },
    })
    const ordering = getOrderingSettings(tenantRow?.settings)
    const isPreview = process.env.VERCEL_ENV === 'preview'
    // Preview-only POC: allow independent-draft ordering without DB settings.
    // This does NOT affect production and does NOT affect the live independentbarandgrille tenant.
    if (!ordering.enabled && !(isPreview && tenant === 'independent-draft')) {
      return NextResponse.json({ ok: false, error: 'ordering_disabled' }, { status: 403 })
    }

    // Ensure tenant exists (so we can relate orders even if menu is file-based)
    const ensuredTenant = tenantRow?.id
      ? { id: tenantRow.id }
      : await prisma.tenant.create({ data: { slug: tenant, name: tenant } })

    // Compute totals server-side from the canonical menu
    const menu = await readMenu(tenant)
    const priceById = new Map<string, number>()
    for (const cat of menu.categories || []) {
      for (const it of cat.items || []) {
        if (typeof it?.id === 'string' && typeof it?.price === 'number') {
          priceById.set(it.id, it.price)
        }
      }
    }

    let subtotalCents = 0
    const orderItems: Array<{ menuItemId: string; name: string; unitPriceCents: number; quantity: number }> = []
    for (const line of items) {
      const price = priceById.get(line.id)
      if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
        return NextResponse.json({ ok: false, error: `invalid_item:${line.id}` }, { status: 400 })
      }
      // Find name (display snapshot)
      let name = line.id
      for (const cat of menu.categories || []) {
        const found = (cat.items || []).find(i => i.id === line.id)
        if (found) { name = found.name; break }
      }
      const unitPriceCents = roundMoneyToCents(price)
      subtotalCents += unitPriceCents * line.quantity
      orderItems.push({ menuItemId: line.id, name, unitPriceCents, quantity: line.quantity })
    }
    const totalCents = subtotalCents

    // Scheduling validation (24/7 testing if hours unset)
    let scheduledFor: Date | null = null
    if (scheduledForRaw) {
      const d = new Date(scheduledForRaw)
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ ok: false, error: 'invalid_scheduledFor' }, { status: 400 })
      }
      const now = Date.now()
      const minTime = now + Math.max(0, ordering.leadTimeMinutes) * 60_000
      if (d.getTime() < minTime) {
        return NextResponse.json({ ok: false, error: 'scheduled_too_soon' }, { status: 400 })
      }
      // Require slot alignment relative to epoch (matches client slot generation)
      const mins = Math.floor(d.getTime() / 60_000)
      const slot = Math.max(1, Math.floor(ordering.slotMinutes))
      if (mins % slot !== 0) {
        return NextResponse.json({ ok: false, error: 'scheduled_not_on_slot' }, { status: 400 })
      }
      scheduledFor = d
    }

    const order = await prisma.order.create({
      data: {
        tenantId: ensuredTenant.id,
        status: 'PENDING_PAYMENT',
        fulfillment: 'PICKUP',
        currency: 'usd',
        subtotalCents,
        totalCents,
        scheduledFor: scheduledFor || undefined,
        timezone: ordering.timezone,
        items: { create: orderItems },
      },
      select: { id: true },
    })

    const stripe = getStripe()
    const baseUrl = baseUrlFromRequest(req)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: `${tenant} order` },
            unit_amount: totalCents,
          },
          quantity: 1,
        }
      ],
      success_url: `${baseUrl}/order/success?order=${encodeURIComponent(order.id)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/menu?tenant=${encodeURIComponent(tenant)}`,
      metadata: {
        tenant,
        orderId: order.id,
        kind: 'food_order',
      },
    })

    // Store session id for idempotent webhook handling
    if (session.id) {
      await prisma.order.update({
        where: { id: order.id },
        data: { stripeCheckoutSessionId: session.id, customerEmail: session.customer_details?.email || undefined },
      })
    }

    return NextResponse.json({ ok: true, orderId: order.id, url: session.url }, { status: 200 })
  } catch (e) {
    const msg = (e as Error)?.message || 'Order checkout error'
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}


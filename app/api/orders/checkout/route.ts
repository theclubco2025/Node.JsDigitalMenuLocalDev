import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { readMenu } from '@/lib/data/menu'
import { getStripeOrders } from '@/lib/stripe'
import { ensureOrdersSchemaPreview } from '@/lib/server/preview-orders-schema'
import type { Prisma } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  tenant: z.string().min(1),
  items: z.array(z.object({
    id: z.string().min(1),
    quantity: z.number().int().min(1).max(99),
    // Optional add-ons/modifiers (priced) derived from menu item tags.
    addOns: z.array(z.object({
      name: z.string().min(1).max(120),
      priceDeltaCents: z.number().int().min(0).max(25_000),
    })).optional().default([]),
    // Optional note for kitchen (per-item)
    note: z.string().max(500).optional().nullable(),
  })).min(1),
  scheduledFor: z.string().datetime().optional().nullable(),
  customerEmail: z.string().email().optional().nullable(),
  customerName: z.string().max(100).optional().nullable(),
  customerPhone: z.string().max(40).optional().nullable(),
  // Optional order-level note for kitchen
  orderNote: z.string().max(800).optional().nullable(),
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
  const paused = ordering.paused === true
  const pauseMessage = typeof ordering.pauseMessage === 'string' ? ordering.pauseMessage : ''
  const timezone = typeof ordering.timezone === 'string' && ordering.timezone.trim()
    ? ordering.timezone.trim()
    : 'America/Los_Angeles'
  const slotMinutes = typeof scheduling.slotMinutes === 'number' && Number.isFinite(scheduling.slotMinutes)
    ? scheduling.slotMinutes
    : 15
  const leadTimeMinutes = typeof scheduling.leadTimeMinutes === 'number' && Number.isFinite(scheduling.leadTimeMinutes)
    ? scheduling.leadTimeMinutes
    : 30

  return { enabled, paused, pauseMessage, timezone, slotMinutes, leadTimeMinutes }
}

function pocOrderingTenants(): string[] {
  const raw = (process.env.ORDERING_POC_TENANTS || '').trim()
  if (!raw) return []
  return raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
}

function isOrderingPocEnabledForTenant(tenant: string): boolean {
  return pocOrderingTenants().includes((tenant || '').toLowerCase())
}

function roundMoneyToCents(amount: number): number {
  // Avoid float drift by rounding to nearest cent.
  return Math.round(amount * 100)
}

type AddOnDef = { name: string; priceDeltaCents: number }
function parseAddOnDefs(tags: string[]): AddOnDef[] {
  const out: AddOnDef[] = []
  for (const raw of tags || []) {
    const t = String(raw || '').trim()
    if (!t) continue
    const lower = t.toLowerCase()
    if (!(lower.startsWith('addon:') || lower.startsWith('add-on:'))) continue
    const rest = t.split(':').slice(1).join(':').trim()
    if (!rest) continue

    // Supported:
    // - addon:Extra cheese=$1.00
    // - addon:Extra cheese|1.00
    // - addon:Extra cheese|100 (interpreted as cents if integer >= 50 and no decimal)
    let name = rest
    let pricePart = ''
    if (rest.includes('|')) {
      const [n, p] = rest.split('|')
      name = (n || '').trim()
      pricePart = (p || '').trim()
    } else if (rest.includes('=')) {
      const [n, p] = rest.split('=')
      name = (n || '').trim()
      pricePart = (p || '').trim()
    }
    if (!name) continue

    const priceRaw = pricePart.replace(/^\$/, '').trim()
    let priceDeltaCents = 0
    if (priceRaw) {
      const asNum = Number(priceRaw)
      if (Number.isFinite(asNum)) {
        // Heuristic: if integer and >= 50, treat as cents; else treat as dollars.
        if (Number.isInteger(asNum) && asNum >= 50) priceDeltaCents = Math.max(0, Math.floor(asNum))
        else priceDeltaCents = Math.max(0, roundMoneyToCents(asNum))
      }
    }

    out.push({ name, priceDeltaCents })
  }
  // Sort stable for deterministic matching
  out.sort((a, b) => a.name.localeCompare(b.name) || a.priceDeltaCents - b.priceDeltaCents)
  return out
}

function dateKeyInTz(ms: number, tz: string) {
  const d = new Date(ms)
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d)
  const y = parts.find(p => p.type === 'year')?.value || '0000'
  const m = parts.find(p => p.type === 'month')?.value || '00'
  const day = parts.find(p => p.type === 'day')?.value || '00'
  return `${y}-${m}-${day}`
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, error: 'DATABASE_URL required for ordering' }, { status: 501 })
    }
    // Sales-ready constraint: in production, Stripe webhook confirmation must be configured.
    if (process.env.VERCEL_ENV === 'production') {
      // Allow using *_TEST in production for test-mode POC on a live domain.
      const ordersWebhook =
        (process.env.STRIPE_ORDERS_WEBHOOK_SECRET || '').trim()
        || (process.env.STRIPE_ORDERS_WEBHOOK_SECRET_TEST || '').trim()
      if (!ordersWebhook) {
        return NextResponse.json({
          ok: false,
          error: 'Ordering is not configured: Stripe orders webhook secret is missing (set STRIPE_ORDERS_WEBHOOK_SECRET or STRIPE_ORDERS_WEBHOOK_SECRET_TEST). See /api/orders/health.',
        }, { status: 501 })
      }
    }
    // Stripe key is resolved inside getStripe() (supports STRIPE_TEST_KEY in preview).

    const raw = await req.json().catch(() => ({}))
    const parsed = BodySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })
    }

    const tenant = parsed.data.tenant.trim().toLowerCase()
    const items = parsed.data.items
    const scheduledForRaw = parsed.data.scheduledFor ?? null
    const customerEmail = (parsed.data.customerEmail || '').trim() || null
    const customerName = (parsed.data.customerName || '').trim() || null
    const customerPhone = (parsed.data.customerPhone || '').trim() || null
    const orderNote = (parsed.data.orderNote || '').trim() || null

    // Load tenant settings and gate ordering
    const tenantRow = await prisma.tenant.findUnique({
      where: { slug: tenant },
      select: { id: true, settings: true },
    })
    const ordering = getOrderingSettings(tenantRow?.settings)
    const isPreview = process.env.VERCEL_ENV === 'preview'
    // Preview-only POC: allow independent-draft ordering without DB settings.
    // This does NOT affect production and does NOT affect the live independentbarandgrille tenant.
    const pocEnabled = isOrderingPocEnabledForTenant(tenant)
    if (!ordering.enabled && !(isPreview && tenant === 'independent-draft') && !pocEnabled) {
      return NextResponse.json({ ok: false, error: 'ordering_disabled' }, { status: 403 })
    }
    if (ordering.paused) {
      return NextResponse.json({
        ok: false,
        error: 'ordering_paused',
        message: ordering.pauseMessage || 'Ordering is temporarily paused. Please try again later.',
      }, { status: 403 })
    }
    // Sales-ready: always collect customer email so Stripe can send receipts and staff can contact if needed.
    if (!customerEmail) {
      return NextResponse.json({ ok: false, error: 'customer_email_required' }, { status: 400 })
    }

    // Ensure tenant exists (so we can relate orders even if menu is file-based)
    const ensuredTenant = tenantRow?.id
      ? { id: tenantRow.id }
      : await prisma.tenant.create({ data: { slug: tenant, name: tenant } })

    // Compute totals server-side from the canonical menu
    const menu = await readMenu(tenant)
    const itemById = new Map<string, { price: number; name: string; tags: string[] }>()
    for (const cat of menu.categories || []) {
      for (const it of cat.items || []) {
        if (typeof it?.id === 'string' && typeof it?.price === 'number') {
          itemById.set(it.id, { price: it.price, name: it.name, tags: (it.tags || []).map(String) })
        }
      }
    }

    let subtotalCents = 0
    const orderItems: Prisma.OrderItemCreateWithoutOrderInput[] = []
    const orderItemsMinimal: Array<{ menuItemId: string; name: string; unitPriceCents: number; quantity: number }> = []
    for (const line of items) {
      const row = itemById.get(line.id)
      const price = row?.price
      if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
        return NextResponse.json({ ok: false, error: `invalid_item:${line.id}` }, { status: 400 })
      }
      const name = row?.name || line.id
      const baseUnitPriceCents = roundMoneyToCents(price)

      const defs = parseAddOnDefs(row?.tags || [])
      const selected = (line.addOns || []).map(a => ({ name: String(a.name || '').trim(), priceDeltaCents: Number(a.priceDeltaCents) }))
        .filter(a => a.name && Number.isFinite(a.priceDeltaCents) && a.priceDeltaCents >= 0)

      // Validate selected add-ons against defs (exact name + price match)
      const normalizedSelected: AddOnDef[] = []
      for (const s of selected) {
        const match = defs.find(d => d.name === s.name && d.priceDeltaCents === Math.floor(s.priceDeltaCents))
        if (!match) {
          return NextResponse.json({ ok: false, error: `invalid_addon:${line.id}:${s.name}` }, { status: 400 })
        }
        normalizedSelected.push(match)
      }

      const addOnsCents = normalizedSelected.reduce((sum, a) => sum + a.priceDeltaCents, 0)
      const unitPriceCents = baseUnitPriceCents + addOnsCents
      subtotalCents += unitPriceCents * line.quantity

      const note = (line.note || '').trim()
      orderItems.push({
        menuItemId: line.id,
        name,
        unitPriceCents,
        quantity: line.quantity,
        ...(note ? { note } : {}),
        ...(normalizedSelected.length ? { addOns: (normalizedSelected as unknown as Prisma.InputJsonValue) } : {}),
      })
      orderItemsMinimal.push({
        menuItemId: line.id,
        name,
        unitPriceCents,
        quantity: line.quantity,
      })
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
      // Same-day only in tenant timezone (PT by default).
      const todayKey = dateKeyInTz(now, ordering.timezone)
      const scheduledKey = dateKeyInTz(d.getTime(), ordering.timezone)
      if (scheduledKey !== todayKey) {
        return NextResponse.json({ ok: false, error: 'scheduled_must_be_same_day' }, { status: 400 })
      }
      // Require slot alignment relative to epoch (matches client slot generation)
      const mins = Math.floor(d.getTime() / 60_000)
      const slot = Math.max(1, Math.floor(ordering.slotMinutes))
      if (mins % slot !== 0) {
        return NextResponse.json({ ok: false, error: 'scheduled_not_on_slot' }, { status: 400 })
      }
      scheduledFor = d
    }

    // Preview-only POC: some preview deployments point at a DB without migrations applied.
    // Ensure the schema exists before creating the first order.
    if (process.env.VERCEL_ENV === 'preview' && tenant === 'independent-draft') {
      await ensureOrdersSchemaPreview({ host: req.headers.get('host') || '' })
    }

    let order: { id: string }
    try {
      order = await prisma.order.create({
        data: {
          tenantId: ensuredTenant.id,
          status: 'PENDING_PAYMENT',
          fulfillment: 'PICKUP',
          currency: 'usd',
          subtotalCents,
          totalCents,
          scheduledFor: scheduledFor || undefined,
          timezone: ordering.timezone,
          customerEmail,
          customerName: customerName || undefined,
          customerPhone: customerPhone || undefined,
          note: orderNote || undefined,
          items: { create: orderItems },
        },
        select: { id: true },
      })
    } catch (e) {
      // Preview-only: auto-create missing schema then retry once.
      const msg = (e as Error)?.message || ''
      if (
        process.env.VERCEL_ENV === 'preview'
        && msg.includes('public.orders')
        && msg.includes('does not exist')
      ) {
        await ensureOrdersSchemaPreview()
        order = await prisma.order.create({
          data: {
            tenantId: ensuredTenant.id,
            status: 'PENDING_PAYMENT',
            fulfillment: 'PICKUP',
            currency: 'usd',
            subtotalCents,
            totalCents,
            scheduledFor: scheduledFor || undefined,
            timezone: ordering.timezone,
            customerEmail,
            customerName: customerName || undefined,
            customerPhone: customerPhone || undefined,
            note: orderNote || undefined,
            items: { create: orderItems },
          },
          select: { id: true },
        })
      } else if ((e as { code?: string } | null)?.code === 'P2022' || msg.includes('does not exist')) {
        // Production safety: if migrations haven't applied yet, retry without newer columns.
        order = await prisma.order.create({
          data: {
            tenantId: ensuredTenant.id,
            status: 'PENDING_PAYMENT',
            fulfillment: 'PICKUP',
            currency: 'usd',
            subtotalCents,
            totalCents,
            scheduledFor: scheduledFor || undefined,
            timezone: ordering.timezone,
            customerEmail,
            items: { create: orderItemsMinimal },
          },
          select: { id: true },
        })
      } else {
        throw e
      }
    }

    const baseUrl = baseUrlFromRequest(req)
    try {
      const stripe = getStripeOrders()
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: customerEmail,
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
          customerEmail,
          customerName: customerName || '',
          customerPhone: customerPhone || '',
        },
      })

      // Store session id for idempotent webhook handling
      if (session.id) {
        // Best-effort: even if this update fails, success_url includes session_id for confirm fallback.
        try {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              stripeCheckoutSessionId: session.id,
              customerEmail,
              customerName: customerName || undefined,
              customerPhone: customerPhone || undefined,
            },
          })
        } catch {
          // ignore
        }
      }

      return NextResponse.json({ ok: true, orderId: order.id, url: session.url }, { status: 200 })
    } catch (e) {
      // Cleanup: if Stripe session creation failed, don't leave a stuck unpaid order behind.
      try { await prisma.order.delete({ where: { id: order.id } }) } catch {}
      throw e
    }
  } catch (e) {
    const msg = (e as Error)?.message || 'Order checkout error'
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}


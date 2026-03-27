import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { readMenu } from '@/lib/data/menu'
import { getStripeOrders } from '@/lib/stripe'
import type { Prisma } from '@prisma/client'
import { checkRateLimit, clientIp } from '@/lib/server/rateLimit'
import { sendCateringOrderNotification } from '@/lib/email'

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
  tableNumber: z.string().max(20).optional().nullable(),
  customerEmail: z.string().email().optional().nullable(),
  customerName: z.string().max(100).optional().nullable(),
  customerPhone: z.string().max(40).optional().nullable(),
  smsOptIn: z.boolean().optional().default(false),
  tipCents: z.number().int().min(0).max(25_000).optional().default(0),
  // Optional order-level note for kitchen
  orderNote: z.string().max(800).optional().nullable(),
  // Catering-specific fields
  eventDate: z.string().optional().nullable(),
  eventTime: z.string().max(50).optional().nullable(),
  guestCount: z.number().int().min(1).max(10000).optional().nullable(),
  eventType: z.string().max(50).optional().nullable(),
  deliveryAddress: z.string().max(500).optional().nullable(),
  deliveryNotes: z.string().max(500).optional().nullable(),
  dietaryNotes: z.string().max(500).optional().nullable(),
  companyName: z.string().max(100).optional().nullable(),
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
  const dineIn = (ordering.dineIn && typeof ordering.dineIn === 'object')
    ? (ordering.dineIn as Record<string, unknown>)
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

  const dineInEnabled = dineIn.enabled === true
  return { enabled, paused, pauseMessage, timezone, slotMinutes, leadTimeMinutes, dineInEnabled }
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

    const raw = await req.json().catch(() => ({}))
    const parsed = BodySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })
    }

    const tenant = parsed.data.tenant.trim().toLowerCase()
    const isPocTenant = tenant === 'demo' || tenant === 'independentbarandgrille'
    const items = parsed.data.items
    const scheduledForRaw = parsed.data.scheduledFor ?? null
    const tableNumberRaw = (parsed.data.tableNumber || '').trim() || null
    const customerEmail = (parsed.data.customerEmail || '').trim() || null
    const customerName = (parsed.data.customerName || '').trim() || null
    const customerPhone = (parsed.data.customerPhone || '').trim() || null
    const smsOptIn = parsed.data.smsOptIn === true
    const orderNote = (parsed.data.orderNote || '').trim() || null
    const tipCentsRaw = Math.max(0, Math.floor(parsed.data.tipCents || 0))

    // Catering-specific fields
    const eventDateRaw = (parsed.data.eventDate || '').trim() || null
    const eventTime = (parsed.data.eventTime || '').trim() || null
    const guestCount = parsed.data.guestCount ?? null
    const eventType = (parsed.data.eventType || '').trim() || null
    const deliveryAddress = (parsed.data.deliveryAddress || '').trim() || null
    const deliveryNotes = (parsed.data.deliveryNotes || '').trim() || null
    const dietaryNotes = (parsed.data.dietaryNotes || '').trim() || null
    const companyName = (parsed.data.companyName || '').trim() || null
    const isCatering = Boolean(eventDateRaw && guestCount) // Require BOTH for catering mode

    const ip = clientIp(req)
    const limIp = await checkRateLimit({ rule: 'orders_checkout_ip_1m', key: `ip:${ip}`, limit: 20, window: '1 m' })
    if (!limIp.ok) {
      return NextResponse.json(
        { ok: false, error: 'rate_limited' },
        { status: 429, headers: { 'Retry-After': String(limIp.retryAfterSeconds) } }
      )
    }
    const limTenant = await checkRateLimit({ rule: 'orders_checkout_tenant_1m', key: `tenant:${tenant}`, limit: 120, window: '1 m' })
    if (!limTenant.ok) {
      return NextResponse.json(
        { ok: false, error: 'rate_limited' },
        { status: 429, headers: { 'Retry-After': String(limTenant.retryAfterSeconds) } }
      )
    }

    // Sales-ready constraint: in production, Stripe webhook confirmation must be configured.
    // POC exception: allow platform test checkout to work as a public POC, relying on /api/orders/confirm fallback.
    if (process.env.VERCEL_ENV === 'production' && !isPocTenant) {
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

    // Load tenant settings and gate ordering
    const tenantRow = await prisma.tenant.findUnique({
      where: { slug: tenant },
      select: { id: true, settings: true, stripeConnectAccountId: true },
    })
    if (!tenantRow?.id) {
      return NextResponse.json({ ok: false, error: 'tenant_not_found' }, { status: 404 })
    }
    const ordering = getOrderingSettings(tenantRow?.settings)
    const tableNumber = ordering.dineInEnabled ? tableNumberRaw : null
    if (!ordering.enabled && !isPocTenant) {
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
    // If user opted into SMS updates, a phone number is required.
    if (smsOptIn && !customerPhone) {
      return NextResponse.json({ ok: false, error: 'customer_phone_required_for_sms' }, { status: 400 })
    }

    // Sales-ready: ordering payments require a connected Stripe account for this tenant.
    // POC exception: allow platform test checkout without Stripe Connect.
    const stripeAccountId = (tenantRow.stripeConnectAccountId || '').trim()
    const usePlatformStripe = isPocTenant && !stripeAccountId
    if (!stripeAccountId && !usePlatformStripe) {
      return NextResponse.json({
        ok: false,
        error: 'stripe_connect_required',
        message: 'Ordering is not configured: this restaurant must connect Stripe in Admin before taking online orders.',
      }, { status: 501 })
    }

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
    const stripeLineItems: Array<{
      price_data: { currency: string; product_data: { name: string }; unit_amount: number }
      quantity: number
    }> = []
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

      const addOnNames = normalizedSelected.map(a => a.name).filter(Boolean)
      const suffix = addOnNames.length ? ` (Add: ${addOnNames.join(', ')})` : ''
      stripeLineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: `${name}${suffix}`.slice(0, 250) },
          unit_amount: unitPriceCents,
        },
        quantity: line.quantity,
      })

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
    // Tip validation is performed after subtotal is computed.
    const tipCents = Math.min(25_000, tipCentsRaw)
    if (tipCents > Math.floor(subtotalCents * 0.5)) {
      return NextResponse.json({ ok: false, error: 'tip_too_large' }, { status: 400 })
    }
    const totalCents = subtotalCents + tipCents

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

    // Parse event date for catering
    let eventDate: Date | null = null
    if (eventDateRaw) {
      const d = new Date(eventDateRaw)
      if (!Number.isNaN(d.getTime())) {
        eventDate = d
      }
    }

    // Generate quote number for catering orders
    const quoteNumber = isCatering ? `QT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}` : undefined
    
    // Default deposit settings for catering
    const depositPercent = isCatering ? 50 : undefined // 50% deposit by default

    let order: { id: string }
    try {
      order = await prisma.order.create({
        data: {
          tenantId: tenantRow.id,
          status: isCatering ? 'INQUIRY' : 'PENDING_PAYMENT',
          fulfillment: isCatering ? 'CATERING' : 'PICKUP',
          orderType: isCatering ? 'CATERING' : 'PICKUP',
          currency: 'usd',
          subtotalCents,
          tipCents: isCatering ? 0 : tipCents,
          totalCents: isCatering ? subtotalCents : totalCents,
          scheduledFor: scheduledFor || undefined,
          timezone: ordering.timezone,
          customerEmail,
          customerName: customerName || undefined,
          customerPhone: customerPhone || undefined,
          tableNumber: tableNumber || undefined,
          smsOptIn,
          smsOptInAt: smsOptIn ? new Date() : undefined,
          note: orderNote || undefined,
          stripeAccountId: usePlatformStripe ? undefined : stripeAccountId,
          // Catering-specific fields
          eventDate: eventDate || undefined,
          eventTime: eventTime || undefined,
          guestCount: guestCount || undefined,
          eventType: eventType || undefined,
          deliveryAddress: deliveryAddress || undefined,
          deliveryNotes: deliveryNotes || undefined,
          dietaryNotes: dietaryNotes || undefined,
          companyName: companyName || undefined,
          // Quote system fields
          quoteNumber: quoteNumber || undefined,
          quoteStatus: isCatering ? 'DRAFT' : undefined,
          depositPercent: depositPercent || undefined,
          paymentTerms: isCatering ? '50% deposit due upon acceptance, balance due 48 hours before event' : undefined,
          cancellationPolicy: isCatering ? 'Full refund if canceled 7+ days before event' : undefined,
          items: { create: orderItems },
        },
        select: { id: true },
      })
    } catch (e) {
      const msg = (e as Error)?.message || ''
      if ((e as { code?: string } | null)?.code === 'P2022' || msg.includes('does not exist')) {
        // Production safety: if migrations haven't applied yet, retry without newer columns.
        order = await prisma.order.create({
          data: {
            tenantId: tenantRow.id,
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

    // For catering inquiries, skip Stripe checkout and redirect directly to success page
    if (isCatering) {
      // Send email notification to the business
      const tenantSettings = (tenantRow.settings && typeof tenantRow.settings === 'object') 
        ? (tenantRow.settings as Record<string, unknown>) 
        : {}
      const contactEmail = (tenantSettings.contactEmail as string) || (tenantSettings.email as string) || null
      
      if (contactEmail && customerName && customerPhone && eventDateRaw && guestCount) {
        // Get tenant name for email
        const tenantInfo = await prisma.tenant.findUnique({
          where: { slug: tenant },
          select: { name: true },
        })
        
        // Send email notification (fire-and-forget, don't block the response)
        void sendCateringOrderNotification({
          to: contactEmail,
          customerName,
          customerEmail: customerEmail || '',
          customerPhone,
          companyName: companyName || undefined,
          eventDate: eventDateRaw,
          eventTime: eventTime || undefined,
          guestCount,
          eventType: eventType || undefined,
          deliveryAddress: deliveryAddress || undefined,
          deliveryNotes: deliveryNotes || undefined,
          dietaryNotes: dietaryNotes || undefined,
          items: orderItems.map(it => ({
            name: it.name,
            quantity: it.quantity,
            unitPriceCents: it.unitPriceCents,
          })),
          subtotalCents,
          orderNote: orderNote || undefined,
          orderId: order.id,
          tenantName: tenantInfo?.name || tenant,
        }).catch((e) => {
          console.error('[checkout] Failed to send catering email:', (e as Error)?.message || e)
        })
      }
      
      const successUrl = `${baseUrl}/order/success?order=${encodeURIComponent(order.id)}&catering=1&tenant=${encodeURIComponent(tenant)}`
      return NextResponse.json({ ok: true, orderId: order.id, url: successUrl, catering: true }, { status: 200 })
    }

    try {
      const stripe = getStripeOrders()

      const lineItems = [...stripeLineItems]
      if (tipCents > 0) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: { name: 'Tip' },
            unit_amount: tipCents,
          },
          quantity: 1,
        })
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: customerEmail,
        line_items: lineItems,
        success_url: `${baseUrl}/order/success?order=${encodeURIComponent(order.id)}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/menu?tenant=${encodeURIComponent(tenant)}`,
        metadata: {
          tenant,
          orderId: order.id,
          kind: 'food_order',
          customerEmail,
          customerName: customerName || '',
          customerPhone: customerPhone || '',
          tipCents: String(tipCents),
        },
      }, usePlatformStripe ? undefined : { stripeAccount: stripeAccountId })

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
              smsOptIn,
              smsOptInAt: smsOptIn ? new Date() : undefined,
              tipCents,
              stripeAccountId: usePlatformStripe ? undefined : stripeAccountId,
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


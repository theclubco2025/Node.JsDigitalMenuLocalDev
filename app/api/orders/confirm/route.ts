import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { getStripeOrders } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  orderId: z.string().min(1),
  // Accept either session_id (preferred, matches Stripe redirect query param)
  // or sessionId (older client payloads).
  session_id: z.string().min(1).optional(),
  sessionId: z.string().min(1).optional(),
})

function isPreviewRequest(req: NextRequest) {
  if (process.env.VERCEL_ENV === 'preview') return true
  const host = (req.headers.get('host') || '').trim().toLowerCase().split(':')[0] || ''
  return host.includes('-git-') && host.endsWith('.vercel.app')
}

function pocOrderingTenants(): string[] {
  const raw = (process.env.ORDERING_POC_TENANTS || '').trim()
  if (!raw) return []
  return raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
}

function isOrderingPocEnabledForTenant(tenant: string): boolean {
  return pocOrderingTenants().includes((tenant || '').toLowerCase())
}

function expectedKitchenPin(tenantSlug: string): string {
  const fromEnv = (process.env.KITCHEN_PIN || '').trim()
  if (fromEnv) return fromEnv
  if (process.env.VERCEL_ENV === 'preview' && (tenantSlug === 'independent-draft' || tenantSlug === 'independent-kitchen-draft')) return '1234'
  return ''
}

function hasKitchenPin(req: NextRequest, tenantSlug: string): boolean {
  const expected = expectedKitchenPin(tenantSlug)
  if (!expected) return false
  const provided = (req.headers.get('x-kitchen-pin') || '').trim()
  return provided === expected
}

async function markPaidFromSession(orderId: string, session: Stripe.Checkout.Session) {
  const paid = session.payment_status === 'paid' || session.payment_status === 'no_payment_required'
  if (!paid) return { ok: false, error: `Session not paid (payment_status=${session.payment_status})` } as const

  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null

  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true, paidAt: true, status: true } })
  if (!order) return { ok: false, error: 'Order not found' } as const
  if (order.paidAt || order.status !== 'PENDING_PAYMENT') return { ok: true, already: true } as const

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'NEW',
      paidAt: new Date(),
      stripeCheckoutSessionId: session.id || undefined,
      stripePaymentIntentId: paymentIntentId || undefined,
      customerEmail: session.customer_details?.email || undefined,
    },
  })

  return { ok: true } as const
}

export async function POST(req: NextRequest) {
  try {
    // Stripe key is resolved inside getStripe() (supports STRIPE_TEST_KEY in preview).
    if (!process.env.DATABASE_URL) return NextResponse.json({ ok: false, error: 'Missing DATABASE_URL' }, { status: 501 })

    const raw = await req.json().catch(() => ({}))
    const parsed = BodySchema.safeParse(raw)
    if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })

    const orderId = parsed.data.orderId.trim()
    const sessionId =
      String(parsed.data.session_id || parsed.data.sessionId || '').trim()

    const row = await prisma.order.findUnique({
      where: { id: orderId },
      select: { stripeCheckoutSessionId: true, tenant: { select: { slug: true } } },
    })
    const tenantSlug = row?.tenant?.slug || ''
    if (!tenantSlug) {
      return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 })
    }

    // If caller didn't provide session_id, try the one we stored when creating checkout.
    // This is especially useful for the KDS "Confirm payment" action.
    const effectiveSessionId = sessionId
      ? sessionId
      : String(row?.stripeCheckoutSessionId || '').trim()

    if (!effectiveSessionId) {
      // Manual confirm fallback (PIN-gated): allow restaurant to move an unpaid POC order into the KDS flow
      // when Stripe isn't configured yet (in-restaurant first iteration).
      if (!hasKitchenPin(req, tenantSlug)) {
        return NextResponse.json({ ok: false, error: 'Missing session_id' }, { status: 400 })
      }
      const isPoc = isOrderingPocEnabledForTenant(tenantSlug)
      const isPreview = isPreviewRequest(req)
      if (!isPoc && !isPreview) {
        return NextResponse.json({ ok: false, error: 'Missing session_id' }, { status: 400 })
      }

      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'NEW' },
      })
      return NextResponse.json({ ok: true, manual: true }, { status: 200 })
    }

    const stripe = getStripeOrders()
    const session = await stripe.checkout.sessions.retrieve(effectiveSessionId)

    // Make sure the session is for this order (prevents confirming someone else’s session_id)
    const sessionOrderId = String(session.metadata?.orderId || '').trim()
    if (!sessionOrderId || sessionOrderId !== orderId) {
      return NextResponse.json({ ok: false, error: 'Session order mismatch' }, { status: 403 })
    }

    const updated = await markPaidFromSession(orderId, session)
    return NextResponse.json(updated, { status: updated.ok ? 200 : 400 })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error)?.message || 'Confirm error' }, { status: 500 })
  }
}


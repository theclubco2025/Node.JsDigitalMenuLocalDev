import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { getStripeOrders } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function webhookSecret() {
  const isPreview = process.env.VERCEL_ENV === 'preview'
  // Preview: allow a dedicated *_TEST secret without renaming env vars.
  // Production: allow *_TEST as fallback to support test-mode POC on a live domain.
  return (
    (process.env.STRIPE_ORDERS_WEBHOOK_SECRET || '').trim()
    || ((isPreview || process.env.VERCEL_ENV === 'production') ? (process.env.STRIPE_ORDERS_WEBHOOK_SECRET_TEST || '').trim() : '')
  )
}

async function markPaidFromSession(session: Stripe.Checkout.Session, eventAccountId: string | null) {
  const orderId = String(session.metadata?.orderId || '').trim()
  if (!orderId) return

  // Basic paid check
  const paid = session.payment_status === 'paid' || session.payment_status === 'no_payment_required'
  if (!paid) return

  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null
  const emailFromSession = (session.customer_details?.email || session.customer_email || '').trim() || null

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      paidAt: true,
      status: true,
      stripeAccountId: true,
      tenant: { select: { slug: true, stripeConnectAccountId: true } },
    },
  })
  if (!order) return
  if (order.paidAt || order.status !== 'PENDING_PAYMENT') {
    // Idempotent: already handled
    return
  }

  const tenantSlug = (order.tenant?.slug || '').trim().toLowerCase()
  const isPocTenant = tenantSlug === 'demo' || tenantSlug === 'independentbarandgrille'

  // For POC tenants, rely on the per-order stripeAccountId only.
  // This avoids blocking platform test charges when the tenant has a connect id set.
  const expectedAccountId =
    isPocTenant
      ? (order.stripeAccountId || '').trim()
      : ((order.stripeAccountId || '').trim()
        || (order.tenant?.stripeConnectAccountId || '').trim()
        || '')

  // Safety: only mark paid if we can match the webhook event to the expected connected account.
  if (expectedAccountId) {
    if (!eventAccountId) {
      console.warn('[orders:stripe-webhook] missing event.account for connect charge', { orderId })
      return
    }
    if (eventAccountId !== expectedAccountId) {
      console.warn('[orders:stripe-webhook] connect account mismatch', { orderId, eventAccountId, expectedAccountId })
      return
    }
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'NEW',
      paidAt: new Date(),
      stripeCheckoutSessionId: session.id || undefined,
      stripePaymentIntentId: paymentIntentId || undefined,
      customerEmail: emailFromSession || undefined,
      stripeAccountId: expectedAccountId || (eventAccountId || undefined),
    },
  })
}

export async function POST(req: NextRequest) {
  const secret = webhookSecret()
  if (!secret) {
    // Webhook disabled until configured; acknowledge to avoid retries during setup.
    return NextResponse.json({ ok: true, disabled: true }, { status: 200 })
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: false, error: 'DATABASE_URL required' }, { status: 501 })
  }

  const sig = req.headers.get('stripe-signature') || ''
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = getStripeOrders().webhooks.constructEvent(body, sig, secret)
  } catch (err) {
    console.warn('[orders:stripe-webhook] invalid signature', err)
    return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await markPaidFromSession(session, typeof event.account === 'string' ? event.account : null)
        break
      }
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session
        await markPaidFromSession(session, typeof event.account === 'string' ? event.account : null)
        break
      }
      default:
        break
    }
  } catch (e) {
    console.error('[orders:stripe-webhook] handler error', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}


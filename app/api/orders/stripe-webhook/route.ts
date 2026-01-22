import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function webhookSecret() {
  const isPreview = process.env.VERCEL_ENV === 'preview'
  // Preview: allow a dedicated *_TEST secret without renaming env vars.
  return (
    (isPreview ? (process.env.STRIPE_ORDERS_WEBHOOK_SECRET_TEST || '').trim() : '')
    || (process.env.STRIPE_ORDERS_WEBHOOK_SECRET || '').trim()
  )
}

async function markPaidFromSession(session: Stripe.Checkout.Session) {
  const orderId = String(session.metadata?.orderId || '').trim()
  if (!orderId) return

  // Basic paid check
  const paid = session.payment_status === 'paid' || session.payment_status === 'no_payment_required'
  if (!paid) return

  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null

  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true, paidAt: true, status: true } })
  if (!order) return
  if (order.paidAt || order.status !== 'PENDING_PAYMENT') {
    // Idempotent: already handled
    return
  }

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
    event = getStripe().webhooks.constructEvent(body, sig, secret)
  } catch (err) {
    console.warn('[orders:stripe-webhook] invalid signature', err)
    return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await markPaidFromSession(session)
        break
      }
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session
        await markPaidFromSession(session)
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


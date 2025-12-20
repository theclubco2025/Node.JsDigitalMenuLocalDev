import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function webhookSecret() {
  return (process.env.STRIPE_WEBHOOK_SECRET || '').trim()
}

async function updateTenantFromSession(session: Stripe.Checkout.Session) {
  const tenantSlug = String(session.metadata?.tenant || '').trim()
  const plan = String(session.metadata?.plan || '').trim().toUpperCase()
  if (!tenantSlug) return

  const customerId = typeof session.customer === 'string' ? session.customer : null
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null

  await prisma.tenant.updateMany({
    where: { slug: tenantSlug },
    data: {
      stripeCustomerId: customerId || undefined,
      stripeSubscriptionId: subscriptionId || undefined,
      status: 'ACTIVE',
      plan: (plan === 'PREMIUM' || plan === 'ENTERPRISE') ? (plan as 'PREMIUM' | 'ENTERPRISE') : 'BASIC',
    },
  })
}

async function markTenantCanceledBySubscription(subscription: Stripe.Subscription) {
  const subscriptionId = subscription.id
  await prisma.tenant.updateMany({
    where: { stripeSubscriptionId: subscriptionId },
    data: { status: 'CANCELED', cancelAtPeriodEnd: false },
  })
}

export async function POST(req: NextRequest) {
  const secret = webhookSecret()
  if (!secret) {
    // Webhook disabled until configured; acknowledge to avoid retries during setup.
    return NextResponse.json({ ok: true, disabled: true }, { status: 200 })
  }

  const sig = req.headers.get('stripe-signature') || ''
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, secret)
  } catch (err) {
    console.warn('[stripe:webhook] invalid signature', err)
    return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await updateTenantFromSession(session)
        break
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await markTenantCanceledBySubscription(subscription)
        break
      }
      default:
        break
    }
  } catch (e) {
    console.error('[stripe:webhook] handler error', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 200 })
}



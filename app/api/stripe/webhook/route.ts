import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function webhookSecret() {
  const isPreview = process.env.VERCEL_ENV === 'preview'
  // Vercel env vars can be scoped per-environment under the same name, but some setups
  // use a dedicated preview-only var. Support both.
  const previewSecret =
    (process.env.STRIPE_WEBHOOK_SECRET_PREVIEW || process.env.stripe_webhook_secret_preview || '').trim()
  const prodSecret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim()
  return isPreview ? (previewSecret || prodSecret) : prodSecret
}

async function updateTenantFromSession(session: Stripe.Checkout.Session) {
  const tenantSlug = String(session.metadata?.tenant || '').trim()
  if (!tenantSlug) return

  const stripe = getStripe()
  const customerId = typeof session.customer === 'string' ? session.customer : null
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null

  // Try to fetch subscription details for period end / cancel flags.
  let currentPeriodEnd: Date | undefined
  let cancelAtPeriodEnd: boolean | undefined
  if (subscriptionId) {
    try {
      const sub = await stripe.subscriptions.retrieve(subscriptionId)
      currentPeriodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : undefined
      cancelAtPeriodEnd = !!sub.cancel_at_period_end
    } catch {
      // ignore
    }
  }

  await prisma.tenant.upsert({
    where: { slug: tenantSlug },
    update: {
      stripeCustomerId: customerId || undefined,
      stripeSubscriptionId: subscriptionId || undefined,
      status: 'ACTIVE',
      currentPeriodEnd,
      ...(typeof cancelAtPeriodEnd === 'boolean' ? { cancelAtPeriodEnd } : {}),
    },
    create: {
      slug: tenantSlug,
      name: tenantSlug,
      stripeCustomerId: customerId || undefined,
      stripeSubscriptionId: subscriptionId || undefined,
      status: 'ACTIVE',
      currentPeriodEnd,
      ...(typeof cancelAtPeriodEnd === 'boolean' ? { cancelAtPeriodEnd } : {}),
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

async function markTenantSuspendedBySubscriptionId(subscriptionId: string) {
  await prisma.tenant.updateMany({
    where: { stripeSubscriptionId: subscriptionId },
    data: { status: 'SUSPENDED' },
  })
}

async function markTenantActiveBySubscriptionId(subscriptionId: string) {
  const stripe = getStripe()
  try {
    const sub = await stripe.subscriptions.retrieve(subscriptionId)
    await prisma.tenant.updateMany({
      where: { stripeSubscriptionId: subscriptionId },
      data: {
        status: 'ACTIVE',
        currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000) : undefined,
        cancelAtPeriodEnd: !!sub.cancel_at_period_end,
      },
    })
  } catch {
    // fallback: still flip active
    await prisma.tenant.updateMany({
      where: { stripeSubscriptionId: subscriptionId },
      data: { status: 'ACTIVE' },
    })
  }
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
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : null
        if (subscriptionId) await markTenantActiveBySubscriptionId(subscriptionId)
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : null
        if (subscriptionId) await markTenantSuspendedBySubscriptionId(subscriptionId)
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



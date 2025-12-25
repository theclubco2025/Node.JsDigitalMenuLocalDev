import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  tenant: z.string().min(1),
  session_id: z.string().min(1),
})

async function activateFromSession(session: Stripe.Checkout.Session) {
  const tenantSlug = String(session.metadata?.tenant || '').trim()
  if (!tenantSlug) return { ok: false, error: 'Missing tenant metadata on session' } as const

  // Basic paid check
  const paid = session.payment_status === 'paid' || session.payment_status === 'no_payment_required'
  if (!paid) return { ok: false, error: `Session not paid (payment_status=${session.payment_status})` } as const

  const customerId = typeof session.customer === 'string' ? session.customer : null
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null

  // Try to fetch subscription details for period end / cancel flags.
  const stripe = getStripe()
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

  return { ok: true, tenant: tenantSlug } as const
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ ok: false, error: 'Missing STRIPE_SECRET_KEY' }, { status: 501 })
    }
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, error: 'Missing DATABASE_URL' }, { status: 501 })
    }

    const raw = await req.json().catch(() => ({}))
    const parsed = BodySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })
    }

    const tenant = parsed.data.tenant.trim()
    const sessionId = parsed.data.session_id.trim()

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    // Make sure the session is for this tenant (prevents confirming someone else’s session_id)
    const sessionTenant = String(session.metadata?.tenant || '').trim()
    if (!sessionTenant || sessionTenant !== tenant) {
      return NextResponse.json({ ok: false, error: 'Session tenant mismatch' }, { status: 403 })
    }

    const activated = await activateFromSession(session)
    return NextResponse.json(activated, { status: activated.ok ? 200 : 400 })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error)?.message || 'Confirm error' }, { status: 500 })
  }
}



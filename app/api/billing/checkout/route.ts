import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getStripe, getOnboardingPriceId, getMonthlyPriceId } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  tenant: z.string().min(1),
})

function baseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3002').replace(/\/$/, '')
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json().catch(() => ({}))
    const parsed = BodySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })
    }

    const tenant = parsed.data.tenant.trim()

    const stripe = getStripe()
    const monthlyPriceId = getMonthlyPriceId()
    const onboardingPriceId = getOnboardingPriceId()

    // Include Checkout session id so we can confirm/activate even if webhook signing secret isn't configured yet.
    const successUrl = `${baseUrl()}/billing/success?tenant=${encodeURIComponent(tenant)}&session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl()}/billing?tenant=${encodeURIComponent(tenant)}&canceled=1`

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      // One-time onboarding fee + monthly subscription in one Checkout session.
      line_items: [
        { price: onboardingPriceId, quantity: 1 },
        { price: monthlyPriceId, quantity: 1 },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      client_reference_id: tenant,
      subscription_data: {
        metadata: { tenant },
      },
      metadata: {
        tenant,
        offer: 'onboarding_plus_monthly',
      },
    })

    return NextResponse.json({ ok: true, url: session.url }, { status: 200 })
  } catch (e) {
    const msg = (e as Error)?.message || 'Billing error'
    // Safe, user-friendly error; don’t leak secrets.
    return NextResponse.json({ ok: false, error: msg }, { status: 200 })
  }
}



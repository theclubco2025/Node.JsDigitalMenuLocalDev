import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getStripe } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PLANS = {
  starter: {
    name: 'Starter',
    setupPriceEnv: 'STRIPE_STARTER_SETUP_PRICE_ID',
    monthlyPriceEnv: 'STRIPE_STARTER_MONTHLY_PRICE_ID',
    fallbackSetup: 'STRIPE_ONBOARDING_PRICE_ID',
    fallbackMonthly: 'STRIPE_MONTHLY_PRICE_ID',
  },
  professional: {
    name: 'Professional',
    setupPriceEnv: 'STRIPE_PROFESSIONAL_SETUP_PRICE_ID',
    monthlyPriceEnv: 'STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID',
    fallbackSetup: 'STRIPE_ONBOARDING_PRICE_ID',
    fallbackMonthly: 'STRIPE_MONTHLY_PRICE_ID',
  },
  enterprise: {
    name: 'Enterprise',
    setupPriceEnv: 'STRIPE_ENTERPRISE_SETUP_PRICE_ID',
    monthlyPriceEnv: 'STRIPE_ENTERPRISE_MONTHLY_PRICE_ID',
    fallbackSetup: 'STRIPE_ONBOARDING_PRICE_ID',
    fallbackMonthly: 'STRIPE_MONTHLY_PRICE_ID',
  },
} as const

type PlanKey = keyof typeof PLANS

function getPriceId(envVar: string, fallbackEnv?: string): string {
  const priceId = (process.env[envVar] || '').trim()
  if (priceId) return priceId
  if (fallbackEnv) {
    const fallback = (process.env[fallbackEnv] || '').trim()
    if (fallback) return fallback
  }
  throw new Error(`Missing price ID: ${envVar}`)
}

const BodySchema = z.object({
  tenant: z.string().min(1),
  email: z.string().email().optional(),
  plan: z.enum(['starter', 'professional', 'enterprise']).optional(),
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
    const email = parsed.data.email?.trim()
    const planKey: PlanKey = parsed.data.plan || 'professional'
    const plan = PLANS[planKey]

    const stripe = getStripe()
    
    // Get plan-specific price IDs with fallbacks to legacy env vars
    const setupPriceId = getPriceId(plan.setupPriceEnv, plan.fallbackSetup)
    const monthlyPriceId = getPriceId(plan.monthlyPriceEnv, plan.fallbackMonthly)

    const successUrl = `${baseUrl()}/billing/success?tenant=${encodeURIComponent(tenant)}&session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl()}/billing?tenant=${encodeURIComponent(tenant)}&canceled=1`

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        { price: setupPriceId, quantity: 1 },
        { price: monthlyPriceId, quantity: 1 },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      client_reference_id: tenant,
      ...(email ? { customer_email: email } : {}),
      subscription_data: {
        metadata: { tenant, plan: planKey },
      },
      metadata: {
        tenant,
        plan: planKey,
        offer: `${planKey}_onboarding_plus_monthly`,
      },
    })

    return NextResponse.json({ ok: true, url: session.url }, { status: 200 })
  } catch (e) {
    const msg = (e as Error)?.message || 'Billing error'
    return NextResponse.json({ ok: false, error: msg }, { status: 200 })
  }
}

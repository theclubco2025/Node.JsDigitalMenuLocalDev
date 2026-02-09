import Stripe from 'stripe'

let cached: Stripe | null = null
let cachedOrders: Stripe | null = null

function isStripeSecretKey(k: string) {
  // Stripe secret keys can be full (sk_*) or restricted (rk_*).
  return k.startsWith('sk_') || k.startsWith('rk_')
}

function isStripePublishableKey(k: string) {
  return k.startsWith('pk_')
}

function keyPrefix(k: string) {
  const s = (k || '').trim()
  if (!s) return 'missing'
  return (s.split('_')[0] || '').slice(0, 12) || 'unknown'
}

export function getStripe(): Stripe {
  if (cached) return cached
  const isPreview = process.env.VERCEL_ENV === 'preview'
  // Preview safety: prefer explicit test key if provided so we never accidentally charge live cards.
  const testKey = (process.env.STRIPE_TEST_KEY || '').trim()
  const secretKey = (process.env.STRIPE_SECRET_KEY || '').trim()
  const key = (() => {
    if (isPreview) {
      // In Preview, we MUST use a test secret key. Never fall back to a live secret key.
      if (isStripeSecretKey(testKey)) return testKey
      if (isStripeSecretKey(secretKey) && secretKey.includes('_test_')) return secretKey
      throw new Error('Preview requires a Stripe test secret key (set STRIPE_TEST_KEY=sk_test_...)')
    }
    // Non-preview: use the normal secret key.
    if (isStripeSecretKey(secretKey)) return secretKey
    throw new Error('Missing Stripe secret key (set STRIPE_SECRET_KEY=sk_...)')
  })()
  if (!key) {
    throw new Error('Missing Stripe secret key (use sk_...; STRIPE_SECRET_KEY or STRIPE_TEST_KEY in preview)')
  }
  cached = new Stripe(key, { apiVersion: '2023-10-16' })
  return cached
}

// Stripe client used specifically for customer food orders.
// This is intentionally separated from SaaS billing so you can run POC with a test key on a live domain.
export function getStripeOrders(): Stripe {
  if (cachedOrders) return cachedOrders

  const fromOrders = (process.env.STRIPE_ORDERS_SECRET_KEY || '').trim()
  const fromTest = (process.env.STRIPE_TEST_KEY || '').trim()
  const fromSecret = (process.env.STRIPE_SECRET_KEY || '').trim()
  const ordersKey = fromOrders || fromTest || fromSecret

  if (!isStripeSecretKey(ordersKey)) {
    const picked =
      fromOrders ? 'STRIPE_ORDERS_SECRET_KEY'
        : fromTest ? 'STRIPE_TEST_KEY'
          : fromSecret ? 'STRIPE_SECRET_KEY'
            : 'none'

    // Most common misconfig: publishable key used on the server.
    if (isStripePublishableKey(ordersKey)) {
      throw new Error(
        `Stripe ordering is misconfigured: ${picked} is a publishable key (prefix=pk). Use a secret key (sk_test_... for POC).`
      )
    }

    throw new Error(
      `Stripe ordering is misconfigured: expected a secret key (sk_*/rk_*), but ${picked} has prefix=${keyPrefix(ordersKey)}. Set STRIPE_ORDERS_SECRET_KEY=sk_test_...`
    )
  }

  cachedOrders = new Stripe(ordersKey, { apiVersion: '2023-10-16' })
  return cachedOrders
}

export type StripePlanKey = 'basic' | 'premium' | 'enterprise'

export function planToPriceId(plan: StripePlanKey): string {
  const map: Record<StripePlanKey, string | undefined> = {
    basic: process.env.STRIPE_BASIC_PRICE_ID,
    premium: process.env.STRIPE_PREMIUM_PRICE_ID,
    enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID,
  }
  const priceId = (map[plan] || '').trim()
  if (!priceId) throw new Error(`Missing Stripe price id for plan=${plan}`)
  return priceId
}

// Fixed billing (onboarding + monthly) used for tenant activation / QR unlock
export function getOnboardingPriceId(): string {
  const priceId = (process.env.STRIPE_ONBOARDING_PRICE_ID || '').trim()
  if (!priceId) throw new Error('Missing STRIPE_ONBOARDING_PRICE_ID')
  return priceId
}

export function getMonthlyPriceId(): string {
  // Prefer the dedicated env var; fall back to BASIC for backward compatibility.
  const direct = (process.env.STRIPE_MONTHLY_PRICE_ID || '').trim()
  if (direct) return direct
  return planToPriceId('basic')
}



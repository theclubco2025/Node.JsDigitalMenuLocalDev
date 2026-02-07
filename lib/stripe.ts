import Stripe from 'stripe'

let cached: Stripe | null = null
let cachedOrders: Stripe | null = null

export function getStripe(): Stripe {
  if (cached) return cached
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  if (!key) {
    throw new Error('Missing STRIPE_SECRET_KEY')
  }
  cached = new Stripe(key, { apiVersion: '2023-10-16' })
  return cached
}

// Stripe client used specifically for customer food orders.
// This is intentionally separated from SaaS billing so you can run POC with a test key on a live domain.
export function getStripeOrders(): Stripe {
  if (cachedOrders) return cachedOrders

  const ordersKey =
    (process.env.STRIPE_ORDERS_SECRET_KEY || '').trim()
    || (process.env.STRIPE_TEST_KEY || '').trim()
    || (process.env.STRIPE_SECRET_KEY || '').trim()

  if (!isStripeSecretKey(ordersKey)) {
    throw new Error('Missing Stripe orders secret key (set STRIPE_ORDERS_SECRET_KEY=sk_test_... for POC)')
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



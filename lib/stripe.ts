import Stripe from 'stripe'

let cached: Stripe | null = null

export function getStripe(): Stripe {
  if (cached) return cached
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  if (!key) {
    throw new Error('Missing STRIPE_SECRET_KEY')
  }
  cached = new Stripe(key, { apiVersion: '2023-10-16' })
  return cached
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



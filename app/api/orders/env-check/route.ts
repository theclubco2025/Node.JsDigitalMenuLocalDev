import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function classifyKey(key: string) {
  const k = (key || '').trim()
  if (!k) return { present: false as const, kind: 'missing' as const }
  if (k.startsWith('whsec_')) return { present: true as const, kind: 'whsec' as const }
  if (k.startsWith('sk_test_')) return { present: true as const, kind: 'sk_test' as const }
  if (k.startsWith('sk_live_')) return { present: true as const, kind: 'sk_live' as const }
  if (k.startsWith('rk_test_')) return { present: true as const, kind: 'rk_test' as const }
  if (k.startsWith('rk_live_')) return { present: true as const, kind: 'rk_live' as const }
  if (k.startsWith('pk_test_')) return { present: true as const, kind: 'pk_test' as const }
  if (k.startsWith('pk_live_')) return { present: true as const, kind: 'pk_live' as const }
  return { present: true as const, kind: 'unknown' as const }
}

export async function GET() {
  const vercelEnv = (process.env.VERCEL_ENV || '').trim() || null

  const stripeTestKey = classifyKey(process.env.STRIPE_TEST_KEY || '')
  const stripeSecretKey = classifyKey(process.env.STRIPE_SECRET_KEY || '')
  const stripeOrdersSecretKey = classifyKey(process.env.STRIPE_ORDERS_SECRET_KEY || '')
  const ordersWebhookTest = classifyKey(process.env.STRIPE_ORDERS_WEBHOOK_SECRET_TEST || '')
  const ordersWebhook = classifyKey(process.env.STRIPE_ORDERS_WEBHOOK_SECRET || '')
  const orderingPocTenants = ((process.env.ORDERING_POC_TENANTS || '').trim() || null)
  const kitchenPinPresent = !!((process.env.KITCHEN_PIN || '').trim())

  // This endpoint intentionally does NOT return actual key values.
  return NextResponse.json({
    ok: true,
    vercelEnv,
    stripe: {
      STRIPE_TEST_KEY: stripeTestKey,
      STRIPE_SECRET_KEY: stripeSecretKey,
    },
    orders: {
      STRIPE_ORDERS_SECRET_KEY: stripeOrdersSecretKey,
    },
    ordersWebhook: {
      STRIPE_ORDERS_WEBHOOK_SECRET_TEST: ordersWebhookTest,
      STRIPE_ORDERS_WEBHOOK_SECRET: ordersWebhook,
    },
    poc: {
      ORDERING_POC_TENANTS: orderingPocTenants,
    },
    kitchen: {
      KITCHEN_PIN_present: kitchenPinPresent,
    },
  }, { headers: { 'Cache-Control': 'no-store' } })
}


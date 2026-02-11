import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function bool(v: unknown) {
  return typeof v === 'string' ? v.trim().length > 0 : Boolean(v)
}

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin
  const webhookUrl = `${origin}/api/orders/stripe-webhook`
  const vercelEnv = (process.env.VERCEL_ENV || '').trim() || 'unknown'

  const ordersWebhookRequired = vercelEnv === 'production'
  const ordersWebhookConfigured = bool(process.env.STRIPE_ORDERS_WEBHOOK_SECRET)
  const ordersSecretKeyConfigured = bool(process.env.STRIPE_ORDERS_SECRET_KEY || process.env.STRIPE_TEST_KEY || process.env.STRIPE_SECRET_KEY)

  return NextResponse.json({
    ok: true,
    env: {
      VERCEL_ENV: vercelEnv,
      DATABASE_URL: bool(process.env.DATABASE_URL),
      STRIPE_ORDERS_SECRET_KEY_configured: ordersSecretKeyConfigured,
      STRIPE_ORDERS_WEBHOOK_SECRET_configured: ordersWebhookConfigured,
      ordersWebhookRequired,
      ordersWebhookOk: ordersWebhookRequired ? ordersWebhookConfigured : true,
    },
    requiredOrdersWebhookEndpointUrl: webhookUrl,
    requiredOrdersWebhookEvents: [
      'checkout.session.completed',
      'checkout.session.async_payment_succeeded',
    ],
    notes: [
      'Food-order payments are confirmed via Stripe webhooks and then shown in KDS (paid-only).',
      'In production, STRIPE_ORDERS_WEBHOOK_SECRET is required to place orders.',
    ],
  }, { headers: { 'Cache-Control': 'no-store' } })
}


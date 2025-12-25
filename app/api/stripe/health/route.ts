import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function bool(v: unknown) {
  return typeof v === 'string' ? v.trim().length > 0 : Boolean(v)
}

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin
  const webhookUrl = `${origin}/api/stripe/webhook`

  return NextResponse.json({
    ok: true,
    env: {
      VERCEL_ENV: process.env.VERCEL_ENV || 'unknown',
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || '',
      DATABASE_URL: bool(process.env.DATABASE_URL),
      STRIPE_SECRET_KEY: bool(process.env.STRIPE_SECRET_KEY),
      STRIPE_WEBHOOK_SECRET: bool(process.env.STRIPE_WEBHOOK_SECRET),
      STRIPE_ONBOARDING_PRICE_ID: bool(process.env.STRIPE_ONBOARDING_PRICE_ID),
      STRIPE_MONTHLY_PRICE_ID: bool(process.env.STRIPE_MONTHLY_PRICE_ID || process.env.STRIPE_BASIC_PRICE_ID),
    },
    requiredWebhookEndpointUrl: webhookUrl,
    requiredWebhookEvents: [
      'checkout.session.completed',
      'invoice.payment_succeeded',
      'invoice.payment_failed',
      'customer.subscription.deleted',
    ],
    notes: [
      'STRIPE_WEBHOOK_SECRET is the Stripe webhook signing secret (starts with whsec_...).',
      'If STRIPE_WEBHOOK_SECRET is missing, initial activation can still happen via /billing/success using session_id confirmation, but ongoing subscription events won’t auto-update.',
    ],
  })
}



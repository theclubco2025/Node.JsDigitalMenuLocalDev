import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getStripeOrders } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function baseUrlFromRequest(req: NextRequest) {
  const proto = (req.headers.get('x-forwarded-proto') || 'https').split(',')[0]?.trim() || 'https'
  const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '').split(',')[0]?.trim()
  if (host) return `${proto}://${host}`.replace(/\/$/, '')
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '')
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    
    if (!orderId || orderId.length < 5) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 })
    }

    // Demo mode - show a simulated response
    if (orderId.startsWith('demo-')) {
      return NextResponse.json({
        success: true,
        demo: true,
        message: 'This is a demo. In production, customers would be redirected to Stripe to pay their deposit.',
        checkoutUrl: null,
      })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            stripeConnectAccountId: true,
          },
        },
        items: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Check if quote can be accepted
    if (order.quoteStatus === 'ACCEPTED' || order.depositPaidAt) {
      return NextResponse.json({ error: 'Quote has already been accepted' }, { status: 400 })
    }

    if (order.quoteStatus === 'DECLINED') {
      return NextResponse.json({ error: 'Quote has been declined' }, { status: 400 })
    }

    if (order.quoteStatus === 'EXPIRED' || (order.quoteExpiresAt && new Date(order.quoteExpiresAt) < new Date())) {
      return NextResponse.json({ error: 'Quote has expired' }, { status: 400 })
    }

    // Calculate deposit amount
    const depositPercent = order.depositPercent || 50 // Default 50% deposit
    const depositCents = order.depositCents || Math.round(order.totalCents * depositPercent / 100)
    const balanceCents = order.totalCents - depositCents

    // Determine Stripe account
    const stripeAccountId = order.tenant.stripeConnectAccountId
    const isPocTenant = order.tenant.slug === 'demo' || order.tenant.slug === 'independentbarandgrille' || order.tenant.slug === 'platehaven-demo'
    const usePlatformStripe = isPocTenant && !stripeAccountId

    if (!stripeAccountId && !usePlatformStripe) {
      return NextResponse.json({ error: 'Payment not configured for this business' }, { status: 501 })
    }

    const baseUrl = baseUrlFromRequest(req)
    const stripe = getStripeOrders()

    // Build line items for deposit
    const lineItems = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Deposit for ${order.eventType || 'Catering'} - ${order.tenant.name}`,
            description: `Quote #${order.quoteNumber || order.id.slice(-8).toUpperCase()} - ${depositPercent}% deposit`,
          },
          unit_amount: depositCents,
        },
        quantity: 1,
      },
    ]

    // Create Stripe Checkout session
    // For connected accounts, the session is created on their account (Stripe Connect Standard)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: order.customerEmail || undefined,
      line_items: lineItems,
      success_url: `${baseUrl}/quote/${orderId}?deposit=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/quote/${orderId}?deposit=canceled`,
      metadata: {
        tenant: order.tenant.slug,
        orderId: order.id,
        kind: 'catering_deposit',
        depositCents: String(depositCents),
        balanceCents: String(balanceCents),
        customerEmail: order.customerEmail || '',
        customerName: order.customerName || '',
      },
    }, usePlatformStripe ? undefined : { stripeAccount: stripeAccountId || undefined })

    // Update order with quote acceptance and deposit checkout session
    await prisma.order.update({
      where: { id: orderId },
      data: {
        quoteStatus: 'ACCEPTED',
        quoteAcceptedAt: new Date(),
        status: 'DEPOSIT_PAID', // Will be confirmed by webhook, but set optimistically
        depositPercent,
        depositCents,
        balanceCents,
        depositCheckoutSessionId: session.id,
      },
    })

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    })
  } catch (e) {
    console.error('[quote/accept] Error:', e)
    return NextResponse.json({ error: 'Failed to accept quote' }, { status: 500 })
  }
}

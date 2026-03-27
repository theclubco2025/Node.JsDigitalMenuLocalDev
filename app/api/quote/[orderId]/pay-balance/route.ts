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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    
    if (!orderId || orderId.length < 10) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 })
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
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if deposit has been paid
    if (!order.depositPaidAt) {
      return NextResponse.json({ error: 'Deposit must be paid first' }, { status: 400 })
    }

    // Check if balance is already paid
    if (order.balancePaidAt) {
      return NextResponse.redirect(`${baseUrlFromRequest(req)}/quote/${orderId}?balance=already_paid`)
    }

    // Calculate balance amount
    const balanceCents = order.balanceCents || (order.totalCents - (order.depositCents || 0))
    
    if (balanceCents <= 0) {
      return NextResponse.redirect(`${baseUrlFromRequest(req)}/quote/${orderId}?balance=no_balance`)
    }

    // Determine Stripe account
    const stripeAccountId = order.tenant.stripeConnectAccountId
    const isPocTenant = order.tenant.slug === 'demo' || order.tenant.slug === 'independentbarandgrille' || order.tenant.slug === 'platehaven-demo'
    const usePlatformStripe = isPocTenant && !stripeAccountId

    if (!stripeAccountId && !usePlatformStripe) {
      return NextResponse.json({ error: 'Payment not configured for this business' }, { status: 501 })
    }

    const baseUrl = baseUrlFromRequest(req)
    const stripe = getStripeOrders()

    // Build line items for balance
    const lineItems = [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Balance for ${order.eventType || 'Catering'} - ${order.tenant.name}`,
            description: `Quote #${order.quoteNumber || order.id.slice(-8).toUpperCase()} - Remaining balance`,
          },
          unit_amount: balanceCents,
        },
        quantity: 1,
      },
    ]

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: order.customerEmail || undefined,
      line_items: lineItems,
      success_url: `${baseUrl}/quote/${orderId}?balance=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/quote/${orderId}?balance=canceled`,
      metadata: {
        tenant: order.tenant.slug,
        orderId: order.id,
        kind: 'catering_balance',
        balanceCents: String(balanceCents),
        customerEmail: order.customerEmail || '',
        customerName: order.customerName || '',
      },
    }, usePlatformStripe ? undefined : { stripeAccount: stripeAccountId || undefined })

    // Update order with balance checkout session
    await prisma.order.update({
      where: { id: orderId },
      data: {
        balanceCheckoutSessionId: session.id,
      },
    })

    // Redirect to Stripe Checkout
    return NextResponse.redirect(session.url || `${baseUrl}/quote/${orderId}`)
  } catch (e) {
    console.error('[quote/pay-balance] Error:', e)
    return NextResponse.json({ error: 'Failed to create payment session' }, { status: 500 })
  }
}

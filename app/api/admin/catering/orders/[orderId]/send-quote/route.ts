import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendQuoteEmail } from '@/lib/email'

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

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    // Demo mode - return success without actually sending email
    if (orderId.startsWith('demo-')) {
      const baseUrl = baseUrlFromRequest(req)
      return NextResponse.json({
        success: true,
        demo: true,
        message: 'Demo Mode: Quote would be emailed to the customer.',
        quoteUrl: `${baseUrl}/quote/${orderId}`,
      })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        tenant: {
          select: {
            name: true,
            slug: true,
            settings: true,
          },
        },
        items: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (!order.customerEmail) {
      return NextResponse.json({ error: 'Customer email required' }, { status: 400 })
    }

    // Calculate deposit amount
    const depositPercent = order.depositPercent || 50
    const depositCents = order.depositCents || Math.round(order.totalCents * depositPercent / 100)
    const balanceCents = order.totalCents - depositCents

    // Set quote expiration (7 days from now)
    const quoteExpiresAt = new Date()
    quoteExpiresAt.setDate(quoteExpiresAt.getDate() + 7)

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'QUOTED',
        quoteStatus: 'SENT',
        quoteSentAt: new Date(),
        quoteExpiresAt,
        depositPercent,
        depositCents,
        balanceCents,
      },
    })

    // Generate quote URL
    const baseUrl = baseUrlFromRequest(req)
    const quoteUrl = `${baseUrl}/quote/${orderId}`

    // Send email
    await sendQuoteEmail({
      to: order.customerEmail,
      customerName: order.customerName || 'Customer',
      tenantName: order.tenant.name,
      quoteNumber: order.quoteNumber || `QT-${orderId.slice(-8).toUpperCase()}`,
      quoteUrl,
      eventDate: order.eventDate?.toISOString() || undefined,
      eventType: order.eventType || undefined,
      guestCount: order.guestCount || undefined,
      totalCents: order.totalCents,
      depositCents,
      expiresAt: quoteExpiresAt.toISOString(),
    })

    return NextResponse.json({ success: true, quoteUrl })
  } catch (e) {
    console.error('[send-quote] Error:', e)
    return NextResponse.json({ error: 'Failed to send quote' }, { status: 500 })
  }
}

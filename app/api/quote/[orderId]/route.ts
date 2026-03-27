import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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
            name: true,
            slug: true,
            settings: true,
          },
        },
        items: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Only allow viewing quotes that are in catering flow
    const validStatuses = ['INQUIRY', 'QUOTED', 'DEPOSIT_PAID', 'BALANCE_DUE', 'PAID_IN_FULL', 'NEW']
    if (!validStatuses.includes(order.status)) {
      return NextResponse.json({ error: 'Quote not available' }, { status: 404 })
    }

    // Extract contact info from tenant settings
    const settings = (order.tenant.settings && typeof order.tenant.settings === 'object')
      ? (order.tenant.settings as Record<string, unknown>)
      : {}
    const contactPhone = (settings.contactPhone as string) || (settings.phone as string) || null
    const contactEmail = (settings.contactEmail as string) || (settings.email as string) || null

    // Format response
    const response = {
      id: order.id,
      quoteNumber: order.quoteNumber || `QT-${order.id.slice(-8).toUpperCase()}`,
      status: order.status,
      quoteStatus: order.quoteStatus,
      quoteExpiresAt: order.quoteExpiresAt,
      quoteSentAt: order.quoteSentAt,
      quoteAcceptedAt: order.quoteAcceptedAt,
      quoteNotes: order.quoteNotes,
      
      // Event details
      eventDate: order.eventDate,
      eventTime: order.eventTime,
      guestCount: order.guestCount,
      eventType: order.eventType,
      deliveryAddress: order.deliveryAddress,
      venueName: order.venueName,
      dietaryNotes: order.dietaryNotes,
      
      // Customer
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      companyName: order.companyName,
      
      // Items
      items: order.items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        totalCents: item.unitPriceCents * item.quantity,
        note: item.note,
        addOns: item.addOns,
      })),
      
      // Pricing
      subtotalCents: order.subtotalCents,
      deliveryFeeCents: order.deliveryFeeCents || 0,
      serviceFeeCents: order.serviceFeeCents || 0,
      totalCents: order.totalCents,
      
      // Deposit/Payment
      depositPercent: order.depositPercent,
      depositCents: order.depositCents,
      depositPaidAt: order.depositPaidAt,
      balanceCents: order.balanceCents,
      balancePaidAt: order.balancePaidAt,
      paymentTerms: order.paymentTerms,
      cancellationPolicy: order.cancellationPolicy,
      
      // Business info
      tenant: {
        name: order.tenant.name,
        slug: order.tenant.slug,
        contactPhone,
        contactEmail,
      },
      
      createdAt: order.createdAt,
    }

    return NextResponse.json(response)
  } catch (e) {
    console.error('[quote/GET] Error:', e)
    return NextResponse.json({ error: 'Failed to load quote' }, { status: 500 })
  }
}

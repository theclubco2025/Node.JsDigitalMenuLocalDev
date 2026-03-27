import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tenant = searchParams.get('tenant')

    if (!tenant) {
      return NextResponse.json({ error: 'tenant required' }, { status: 400 })
    }

    // Find tenant
    const tenantRow = await prisma.tenant.findUnique({
      where: { slug: tenant },
      select: { id: true },
    })

    if (!tenantRow) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Fetch catering orders - orders with eventDate set
    // Note: orderType might not exist on older orders, so we primarily filter by eventDate
    let orders
    try {
      orders = await prisma.order.findMany({
        where: {
          tenantId: tenantRow.id,
          eventDate: { not: null },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          items: true,
        },
      })
    } catch {
      // Fallback: fetch all orders if the query fails (e.g., schema mismatch)
      orders = []
    }

    const formattedOrders = orders.map((order) => ({
      id: order.id,
      quoteNumber: order.quoteNumber || `QT-${order.id.slice(-8).toUpperCase()}`,
      status: order.status,
      quoteStatus: order.quoteStatus,
      customerName: order.customerName || 'Unknown',
      customerEmail: order.customerEmail || '',
      customerPhone: order.customerPhone || '',
      companyName: order.companyName,
      eventDate: order.eventDate?.toISOString() || null,
      eventTime: order.eventTime,
      eventType: order.eventType,
      guestCount: order.guestCount,
      deliveryAddress: order.deliveryAddress,
      totalCents: order.totalCents,
      depositCents: order.depositCents,
      depositPaidAt: order.depositPaidAt?.toISOString() || null,
      balanceCents: order.balanceCents,
      balancePaidAt: order.balancePaidAt?.toISOString() || null,
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
      })),
    }))

    return NextResponse.json({ orders: formattedOrders })
  } catch (e) {
    console.error('[admin/catering/orders] Error:', e)
    return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 })
  }
}

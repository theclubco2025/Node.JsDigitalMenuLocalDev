import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface DemoQuoteItem {
  id: string
  name: string
  quantity: number
  unitPriceCents: number
  totalCents: number
  note: string | null
  addOns: null
}

interface DemoQuote {
  id: string
  quoteNumber: string
  status: string
  quoteStatus: string
  quoteExpiresAt: string | null
  quoteSentAt: string | null
  quoteAcceptedAt: string | null
  quoteNotes: string | null
  eventDate: string
  eventTime: string
  guestCount: number
  eventType: string
  deliveryAddress: string
  venueName: string | null
  dietaryNotes: string | null
  customerName: string
  customerEmail: string
  customerPhone: string
  companyName: string | null
  items: DemoQuoteItem[]
  subtotalCents: number
  deliveryFeeCents: number
  serviceFeeCents: number
  totalCents: number
  depositPercent: number
  depositCents: number
  depositPaidAt: string | null
  balanceCents: number
  balancePaidAt: string | null
  paymentTerms: string
  cancellationPolicy: string
  tenant: {
    name: string
    slug: string
    contactPhone: string | null
    contactEmail: string | null
  }
  createdAt: string
}

// Demo quote data for showcasing the quote page
function getDemoQuote(orderId: string): DemoQuote | null {
  const demoQuotes: Record<string, DemoQuote> = {
    'demo-1': {
      id: 'demo-1',
      quoteNumber: 'QT-2026-0042',
      status: 'INQUIRY',
      quoteStatus: 'DRAFT',
      quoteExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      quoteSentAt: null,
      quoteAcceptedAt: null,
      quoteNotes: null,
      eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      eventTime: '6:00 PM',
      guestCount: 50,
      eventType: 'Corporate Event',
      deliveryAddress: '500 Business Park Dr, Suite 100',
      venueName: 'TechCorp HQ',
      dietaryNotes: '5 vegetarian options needed',
      customerName: 'Sarah Johnson',
      customerEmail: 'sarah@techcorp.com',
      customerPhone: '(555) 123-4567',
      companyName: 'TechCorp Inc.',
      items: [
        { id: 'item-1', name: 'Grilled Chicken Platter', quantity: 2, unitPriceCents: 12000, totalCents: 24000, note: null, addOns: null },
        { id: 'item-2', name: 'Premium BBQ Ribs Tray', quantity: 3, unitPriceCents: 15000, totalCents: 45000, note: null, addOns: null },
        { id: 'item-3', name: 'Garden Salad (Large)', quantity: 4, unitPriceCents: 4500, totalCents: 18000, note: null, addOns: null },
        { id: 'item-4', name: 'Vegetarian Pasta', quantity: 2, unitPriceCents: 8500, totalCents: 17000, note: 'For vegetarian guests', addOns: null },
        { id: 'item-5', name: 'Assorted Dessert Platter', quantity: 2, unitPriceCents: 6500, totalCents: 13000, note: null, addOns: null },
      ],
      subtotalCents: 117000,
      deliveryFeeCents: 5000,
      serviceFeeCents: 0,
      totalCents: 122000,
      depositPercent: 50,
      depositCents: 61000,
      depositPaidAt: null,
      balanceCents: 61000,
      balancePaidAt: null,
      paymentTerms: '50% deposit due upon acceptance, balance due 48 hours before event',
      cancellationPolicy: 'Full refund if canceled 7+ days before event',
      tenant: {
        name: 'TCC Menus Demo',
        slug: 'demo',
        contactPhone: null,
        contactEmail: null,
      },
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    'demo-2': {
      id: 'demo-2',
      quoteNumber: 'QT-2026-0041',
      status: 'QUOTED',
      quoteStatus: 'SENT',
      quoteExpiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      quoteSentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      quoteAcceptedAt: null,
      quoteNotes: 'Looking forward to making your birthday celebration special! We will arrive 30 minutes early for setup.',
      eventDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      eventTime: '4:00 PM',
      guestCount: 75,
      eventType: 'Birthday Party',
      deliveryAddress: '234 Celebration Lane',
      venueName: null,
      dietaryNotes: '3 guests have nut allergies',
      customerName: 'Michael Chen',
      customerEmail: 'mchen@email.com',
      customerPhone: '(555) 234-5678',
      companyName: null,
      items: [
        { id: 'item-1', name: 'Party Platter Supreme', quantity: 4, unitPriceCents: 18500, totalCents: 74000, note: null, addOns: null },
        { id: 'item-2', name: 'Kids Finger Food Tray', quantity: 2, unitPriceCents: 8000, totalCents: 16000, note: null, addOns: null },
        { id: 'item-3', name: 'Birthday Cake (Custom)', quantity: 1, unitPriceCents: 12000, totalCents: 12000, note: 'Happy 10th Birthday Tyler!', addOns: null },
        { id: 'item-4', name: 'Beverage Package', quantity: 1, unitPriceCents: 25000, totalCents: 25000, note: null, addOns: null },
      ],
      subtotalCents: 127000,
      deliveryFeeCents: 0,
      serviceFeeCents: 0,
      totalCents: 127000,
      depositPercent: 50,
      depositCents: 63500,
      depositPaidAt: null,
      balanceCents: 63500,
      balancePaidAt: null,
      paymentTerms: '50% deposit due upon acceptance, balance due 48 hours before event',
      cancellationPolicy: 'Full refund if canceled 7+ days before event',
      tenant: {
        name: 'TCC Menus Demo',
        slug: 'demo',
        contactPhone: null,
        contactEmail: null,
      },
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    'demo-3': {
      id: 'demo-3',
      quoteNumber: 'QT-2026-0039',
      status: 'DEPOSIT_PAID',
      quoteStatus: 'ACCEPTED',
      quoteExpiresAt: null,
      quoteSentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      quoteAcceptedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      quoteNotes: null,
      eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      eventTime: '12:00 PM',
      guestCount: 30,
      eventType: 'Business Lunch',
      deliveryAddress: '789 Commerce Ave, Floor 3',
      venueName: 'StartupHub',
      dietaryNotes: null,
      customerName: 'Amanda Torres',
      customerEmail: 'atorres@startups.io',
      customerPhone: '(555) 345-6789',
      companyName: 'StartupHub',
      items: [
        { id: 'item-1', name: 'Executive Lunch Box', quantity: 30, unitPriceCents: 2500, totalCents: 75000, note: null, addOns: null },
        { id: 'item-2', name: 'Bottled Water & Soda', quantity: 30, unitPriceCents: 300, totalCents: 9000, note: null, addOns: null },
      ],
      subtotalCents: 84000,
      deliveryFeeCents: 0,
      serviceFeeCents: 0,
      totalCents: 84000,
      depositPercent: 50,
      depositCents: 42000,
      depositPaidAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      balanceCents: 42000,
      balancePaidAt: null,
      paymentTerms: '50% deposit due upon acceptance, balance due 48 hours before event',
      cancellationPolicy: 'Full refund if canceled 7+ days before event',
      tenant: {
        name: 'TCC Menus Demo',
        slug: 'demo',
        contactPhone: null,
        contactEmail: null,
      },
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    'demo-4': {
      id: 'demo-4',
      quoteNumber: 'QT-2026-0032',
      status: 'COMPLETED',
      quoteStatus: 'ACCEPTED',
      quoteExpiresAt: null,
      quoteSentAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      quoteAcceptedAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(),
      quoteNotes: null,
      eventDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      eventTime: '5:30 PM',
      guestCount: 120,
      eventType: 'Graduation Party',
      deliveryAddress: '100 Community Center Blvd',
      venueName: 'Riverside Community Center',
      dietaryNotes: null,
      customerName: 'Robert Williams',
      customerEmail: 'rwilliams@email.com',
      customerPhone: '(555) 456-7890',
      companyName: null,
      items: [
        { id: 'item-1', name: 'Grand Buffet Package', quantity: 1, unitPriceCents: 250000, totalCents: 250000, note: null, addOns: null },
        { id: 'item-2', name: 'Graduation Cake', quantity: 1, unitPriceCents: 15000, totalCents: 15000, note: 'Congrats Class of 2026!', addOns: null },
        { id: 'item-3', name: 'Full Beverage Service', quantity: 1, unitPriceCents: 47000, totalCents: 47000, note: null, addOns: null },
      ],
      subtotalCents: 312000,
      deliveryFeeCents: 0,
      serviceFeeCents: 0,
      totalCents: 312000,
      depositPercent: 50,
      depositCents: 156000,
      depositPaidAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      balanceCents: 156000,
      balancePaidAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      paymentTerms: '50% deposit due upon acceptance, balance due 48 hours before event',
      cancellationPolicy: 'Full refund if canceled 7+ days before event',
      tenant: {
        name: 'TCC Menus Demo',
        slug: 'demo',
        contactPhone: null,
        contactEmail: null,
      },
      createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    },
  }
  
  return demoQuotes[orderId] || null
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    
    if (!orderId || orderId.length < 5) {
      return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 })
    }

    // Handle demo orders
    if (orderId.startsWith('demo-')) {
      const demoQuote = getDemoQuote(orderId)
      if (demoQuote) {
        return NextResponse.json(demoQuote)
      }
      return NextResponse.json({ error: 'Demo quote not found' }, { status: 404 })
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

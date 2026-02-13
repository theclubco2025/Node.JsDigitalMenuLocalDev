import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { computePickupCode } from '@/lib/orders/pickupCode'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, error: 'DATABASE_URL required' }, { status: 501 })
    }
    const { searchParams } = new URL(req.url)
    const id = (searchParams.get('order') || '').trim()
    if (!id) return NextResponse.json({ ok: false, error: 'Missing order' }, { status: 400 })

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        totalCents: true,
        scheduledFor: true,
        timezone: true,
        paidAt: true,
        createdAt: true,
        tenant: { select: { slug: true, name: true } },
        items: { select: { id: true, name: true, quantity: true, unitPriceCents: true } },
      }
    })
    if (!order) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })

    return NextResponse.json({ ok: true, order: { ...order, pickupCode: computePickupCode(order.id) } }, { status: 200 })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error)?.message || 'Status error' }, { status: 500 })
  }
}

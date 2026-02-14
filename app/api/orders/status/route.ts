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

    const fetchOrder = async (withExtras: boolean) => {
      return await prisma.order.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          totalCents: true,
          scheduledFor: true,
          timezone: true,
          paidAt: true,
          createdAt: true,
          ...(withExtras ? { tableNumber: true } : {}),
          tenant: { select: { slug: true, name: true } },
          items: { select: { id: true, name: true, quantity: true, unitPriceCents: true } },
        }
      })
    }

    let order
    try {
      order = await fetchOrder(true)
    } catch (e) {
      const msg = (e as Error)?.message || ''
      const code = (e as { code?: string } | null)?.code
      if (code === 'P2022' || msg.includes('does not exist')) {
        order = await fetchOrder(false)
      } else {
        throw e
      }
    }
    if (!order) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })

    return NextResponse.json({
      ok: true,
      order: {
        ...order,
        pickupCode: computePickupCode(order.id),
        tableNumber: (order as unknown as { tableNumber?: string | null }).tableNumber ?? null,
      }
    }, { status: 200 })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error)?.message || 'Status error' }, { status: 500 })
  }
}

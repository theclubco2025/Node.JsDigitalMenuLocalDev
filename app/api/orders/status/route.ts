import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { computePickupCode } from '@/lib/orders/pickupCode'
import { checkRateLimit, clientIp } from '@/lib/server/rateLimit'

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
    const minimal = (searchParams.get('minimal') || '').trim() === '1'

    const ip = clientIp(req)
    const limIp = await checkRateLimit({ rule: 'orders_status_ip_1m', key: `ip:${ip}`, limit: 120, window: '1 m' })
    if (!limIp.ok) {
      return NextResponse.json(
        { ok: false, error: 'rate_limited' },
        { status: 429, headers: { 'Retry-After': String(limIp.retryAfterSeconds) } }
      )
    }
    const limOrder = await checkRateLimit({ rule: 'orders_status_order_1m', key: `order:${id}`, limit: 300, window: '1 m' })
    if (!limOrder.ok) {
      return NextResponse.json(
        { ok: false, error: 'rate_limited' },
        { status: 429, headers: { 'Retry-After': String(limOrder.retryAfterSeconds) } }
      )
    }

    const fetchOrder = async (withExtras: boolean) => {
      return await prisma.order.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          paidAt: true,
          ...(minimal ? {} : {
            totalCents: true,
            scheduledFor: true,
            timezone: true,
            createdAt: true,
            tenant: { select: { slug: true, name: true } },
            items: { select: { id: true, name: true, quantity: true, unitPriceCents: true } },
          }),
          ...(minimal ? {} : (withExtras ? { tableNumber: true } : {})),
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
        ...(minimal ? {} : { tableNumber: (order as unknown as { tableNumber?: string | null }).tableNumber ?? null }),
      }
    }, { status: 200 })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error)?.message || 'Status error' }, { status: 500 })
  }
}

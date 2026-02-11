import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma'
import { getStripeOrders } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const Body = z.object({
  orderId: z.string().min(1),
  amountCents: z.number().int().min(1).optional().nullable(),
  reason: z.string().max(200).optional().nullable(),
})

export async function POST(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, error: 'DATABASE_URL required' }, { status: 501 })
    }

    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

    const role = (session as unknown as { role?: string }).role || ''
    const tenantId = (session as unknown as { tenantId?: string | null }).tenantId || null
    if (role !== 'SUPER_ADMIN' && !tenantId) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    const raw = await req.json().catch(() => ({}))
    const parsed = Body.safeParse(raw)
    if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })

    const orderId = parsed.data.orderId.trim()
    const amountCents = parsed.data.amountCents ?? null
    const reason = (parsed.data.reason || '').trim() || null

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        tenantId: true,
        status: true,
        currency: true,
        totalCents: true,
        paidAt: true,
        refundedAt: true,
        stripePaymentIntentId: true,
      },
    })
    if (!order) return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 })

    if (role !== 'SUPER_ADMIN') {
      if (!tenantId || order.tenantId !== tenantId) {
        return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
      }
    }

    if (!order.paidAt) return NextResponse.json({ ok: false, error: 'Order is not paid' }, { status: 400 })
    if (order.refundedAt) return NextResponse.json({ ok: false, error: 'Order already refunded' }, { status: 400 })

    const pi = (order.stripePaymentIntentId || '').trim()
    if (!pi) return NextResponse.json({ ok: false, error: 'Missing Stripe payment intent id' }, { status: 400 })

    const amt = amountCents !== null ? Math.floor(amountCents) : order.totalCents
    if (!Number.isFinite(amt) || amt <= 0) return NextResponse.json({ ok: false, error: 'Invalid amount' }, { status: 400 })
    if (amt > order.totalCents) return NextResponse.json({ ok: false, error: 'Refund exceeds order total' }, { status: 400 })

    const stripe = getStripeOrders()
    const refund = await stripe.refunds.create({
      payment_intent: pi,
      amount: amt === order.totalCents ? undefined : amt,
      reason: 'requested_by_customer',
      metadata: {
        orderId: order.id,
      },
    })

    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'CANCELED',
        refundedAt: new Date(),
        refundAmountCents: amt,
        stripeRefundId: refund.id || undefined,
        stripeRefundStatus: refund.status || undefined,
        refundReason: reason || undefined,
      },
      select: { id: true },
    })

    return NextResponse.json({ ok: true, refundId: refund.id }, { status: 200 })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error)?.message || 'Refund error' }, { status: 500 })
  }
}


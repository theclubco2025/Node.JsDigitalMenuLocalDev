import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  orderId: z.string().min(1),
  session_id: z.string().min(1),
})

async function markPaidFromSession(orderId: string, session: Stripe.Checkout.Session) {
  const paid = session.payment_status === 'paid' || session.payment_status === 'no_payment_required'
  if (!paid) return { ok: false, error: `Session not paid (payment_status=${session.payment_status})` } as const

  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null

  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true, paidAt: true, status: true } })
  if (!order) return { ok: false, error: 'Order not found' } as const
  if (order.paidAt || order.status !== 'PENDING_PAYMENT') return { ok: true, already: true } as const

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'NEW',
      paidAt: new Date(),
      stripeCheckoutSessionId: session.id || undefined,
      stripePaymentIntentId: paymentIntentId || undefined,
      customerEmail: session.customer_details?.email || undefined,
    },
  })

  return { ok: true } as const
}

export async function POST(req: NextRequest) {
  try {
    // Stripe key is resolved inside getStripe() (supports STRIPE_TEST_KEY in preview).
    if (!process.env.DATABASE_URL) return NextResponse.json({ ok: false, error: 'Missing DATABASE_URL' }, { status: 501 })

    const raw = await req.json().catch(() => ({}))
    const parsed = BodySchema.safeParse(raw)
    if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })

    const orderId = parsed.data.orderId.trim()
    const sessionId = parsed.data.session_id.trim()

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    // Make sure the session is for this order (prevents confirming someone else’s session_id)
    const sessionOrderId = String(session.metadata?.orderId || '').trim()
    if (!sessionOrderId || sessionOrderId !== orderId) {
      return NextResponse.json({ ok: false, error: 'Session order mismatch' }, { status: 403 })
    }

    const updated = await markPaidFromSession(orderId, session)
    return NextResponse.json(updated, { status: updated.ok ? 200 : 400 })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error)?.message || 'Confirm error' }, { status: 500 })
  }
}


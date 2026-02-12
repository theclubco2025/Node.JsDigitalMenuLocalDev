import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  tenant: z.string().optional(),
  q: z.string().optional(),
  status: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
})

export async function GET(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, error: 'DATABASE_URL required' }, { status: 501 })
    }

    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

    const role = (session as unknown as { role?: string }).role || ''
    const tenantId = (session as unknown as { tenantId?: string | null }).tenantId || null

    const parsed = QuerySchema.safeParse({
      tenant: req.nextUrl.searchParams.get('tenant') || undefined,
      q: req.nextUrl.searchParams.get('q') || undefined,
      status: req.nextUrl.searchParams.get('status') || undefined,
      limit: req.nextUrl.searchParams.get('limit') || undefined,
    })
    if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid query' }, { status: 400 })

    let tenantSlug: string | null = (parsed.data.tenant || '').trim().toLowerCase() || null
    if (role !== 'SUPER_ADMIN') {
      if (!tenantId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
      const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
      tenantSlug = t?.slug || null
    }
    if (!tenantSlug) return NextResponse.json({ ok: false, error: 'Tenant not found' }, { status: 404 })

    const q = (parsed.data.q || '').trim()
    const status = (parsed.data.status || '').trim().toUpperCase()
    const limit = parsed.data.limit ?? 50

    const fetchOrders = async (withExtras: boolean) => {
      const where: Record<string, unknown> = { tenant: { slug: tenantSlug } }
      if (status) where.status = status
      if (q) {
        where.OR = [
          { id: { contains: q, mode: 'insensitive' } },
          { customerEmail: { contains: q, mode: 'insensitive' } },
          ...(withExtras ? [{ customerName: { contains: q, mode: 'insensitive' } }] : []),
        ]
      }
      return await prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          status: true,
          currency: true,
          subtotalCents: true,
          totalCents: true,
          scheduledFor: true,
          timezone: true,
          paidAt: true,
          refundedAt: true,
          refundAmountCents: true,
          stripeRefundId: true,
          stripeRefundStatus: true,
          ...(withExtras ? { note: true, customerName: true, customerPhone: true } : {}),
          customerEmail: true,
          createdAt: true,
          items: {
            select: {
              id: true,
              name: true,
              quantity: true,
              unitPriceCents: true,
              ...(withExtras ? { note: true, addOns: true } : {}),
            },
            orderBy: { id: 'asc' },
          },
        },
      })
    }

    let orders
    try {
      orders = await fetchOrders(true)
    } catch (e) {
      const msg = (e as Error)?.message || ''
      const code = (e as { code?: string } | null)?.code
      if (code === 'P2022' || msg.includes('does not exist')) {
        orders = await fetchOrders(false)
      } else {
        throw e
      }
    }

    return NextResponse.json({ ok: true, tenant: tenantSlug, orders }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error)?.message || 'Orders list error' }, { status: 500 })
  }
}


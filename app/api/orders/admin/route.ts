import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const StatusSchema = z.enum(['PENDING_PAYMENT', 'NEW', 'PREPARING', 'READY', 'COMPLETED', 'CANCELED'])

const UpdateSchema = z.object({
  orderId: z.string().min(1),
  status: StatusSchema,
})

export async function GET(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, error: 'DATABASE_URL required' }, { status: 501 })
    }
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

    const role = (session as unknown as { role?: string }).role || session.user?.role
    const sessionTenantId = (session as unknown as { tenantId?: string | null }).tenantId ?? null

    const { searchParams } = new URL(req.url)
    const tenantSlug = (searchParams.get('tenant') || '').trim().toLowerCase()

    let tenantId: string | null = null
    if (role === 'SUPER_ADMIN') {
      if (tenantSlug) {
        const t = await prisma.tenant.findUnique({ where: { slug: tenantSlug }, select: { id: true } })
        tenantId = t?.id || null
      }
    } else {
      tenantId = sessionTenantId
    }

    if (!tenantId) {
      return NextResponse.json({ ok: false, error: 'Missing tenant context' }, { status: 400 })
    }

    const orders = await prisma.order.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        items: true,
        tenant: { select: { slug: true, name: true } },
      }
    })

    return NextResponse.json({ ok: true, orders }, { status: 200 })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error)?.message || 'Orders admin error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, error: 'DATABASE_URL required' }, { status: 501 })
    }
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

    const role = (session as unknown as { role?: string }).role || session.user?.role
    const sessionTenantId = (session as unknown as { tenantId?: string | null }).tenantId ?? null

    const raw = await req.json().catch(() => ({}))
    const parsed = UpdateSchema.safeParse(raw)
    if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })

    const { orderId, status } = parsed.data
    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true, tenantId: true } })
    if (!order) return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 })

    if (role !== 'SUPER_ADMIN') {
      if (!sessionTenantId || order.tenantId !== sessionTenantId) {
        return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
      }
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      select: { id: true, status: true },
    })

    return NextResponse.json({ ok: true, order: updated }, { status: 200 })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error)?.message || 'Update error' }, { status: 500 })
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const Body = z.object({
  pin: z.string().min(1).max(64),
})

function kitchenPinWhere(pin: string) {
  // Prisma JSON path query (Postgres)
  return { settings: { path: ['kitchenPin'], equals: pin } } as const
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, error: 'DATABASE_URL required' }, { status: 501 })
    }

    const raw = await req.json().catch(() => ({}))
    const parsed = Body.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })
    }

    const pin = parsed.data.pin.trim()
    if (!pin) return NextResponse.json({ ok: false, error: 'Missing pin' }, { status: 400 })

    const matches = await prisma.tenant.findMany({
      where: kitchenPinWhere(pin),
      select: { slug: true, name: true, status: true },
      take: 5,
    })

    if (matches.length === 0) {
      return NextResponse.json({ ok: false, error: 'PIN not found' }, { status: 404 })
    }

    // Prefer ACTIVE tenants if multiple match (should be unique in practice).
    const active = matches.filter((t) => t.status === 'ACTIVE')
    const chosen = (active[0] || matches[0])!

    // If more than one ACTIVE tenant matches, reject to avoid misrouting.
    if (active.length > 1) {
      return NextResponse.json({ ok: false, error: 'PIN is not unique' }, { status: 409 })
    }

    return NextResponse.json({ ok: true, tenant: { slug: chosen.slug, name: chosen.name } }, { status: 200 })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error)?.message || 'Resolve error' }, { status: 500 })
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const Body = z.object({
  tenant: z.string().min(1),
  kitchenPin: z.string().min(4).max(64),
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

    const raw = await req.json().catch(() => ({}))
    const parsed = Body.safeParse(raw)
    if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })

    const requestedTenant = parsed.data.tenant.trim().toLowerCase()
    const kitchenPin = parsed.data.kitchenPin.trim()

    // Owners can only set their own tenant's pin. Super admins can set any.
    if (role !== 'SUPER_ADMIN') {
      if (!tenantId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
      const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
      if (!t || t.slug !== requestedTenant) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const tenant = await prisma.tenant.findUnique({ where: { slug: requestedTenant }, select: { id: true, settings: true } })
    if (!tenant) return NextResponse.json({ ok: false, error: 'Tenant not found' }, { status: 404 })

    const currentSettings = (tenant.settings && typeof tenant.settings === 'object') ? (tenant.settings as Record<string, unknown>) : {}
    const nextSettings = { ...currentSettings, kitchenPin }

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { settings: nextSettings },
      select: { id: true },
    })

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error)?.message || 'Kitchen pin error' }, { status: 500 })
  }
}


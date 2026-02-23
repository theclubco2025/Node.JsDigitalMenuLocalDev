import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, error: 'DATABASE_URL required' }, { status: 501 })
    }
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

    const role = (session as unknown as { role?: string }).role || ''
    const tenantId = (session as unknown as { tenantId?: string | null }).tenantId || null

    const requestedTenant = (req.nextUrl.searchParams.get('tenant') || '').trim().toLowerCase()
    if (!requestedTenant) return NextResponse.json({ ok: false, error: 'Missing tenant' }, { status: 400 })

    if (role !== 'SUPER_ADMIN') {
      if (!tenantId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
      const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
      if (!t || t.slug !== requestedTenant) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const row = await prisma.tenant.findUnique({
      where: { slug: requestedTenant },
      select: { stripeConnectAccountId: true, stripeConnectOnboardedAt: true },
    })
    if (!row) return NextResponse.json({ ok: false, error: 'Tenant not found' }, { status: 404 })

    return NextResponse.json({
      ok: true,
      tenant: requestedTenant,
      connected: Boolean(row.stripeConnectAccountId),
      accountId: row.stripeConnectAccountId || null,
      onboardedAt: row.stripeConnectOnboardedAt || null,
    }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error)?.message || 'Stripe connect status error' }, { status: 500 })
  }
}


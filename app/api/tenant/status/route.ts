import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tenant = (searchParams.get('tenant') || '').trim()
  if (!tenant) return NextResponse.json({ ok: false, error: 'Missing tenant' }, { status: 400 })

  // If DB isn't configured (local/demo), don't claim payment state.
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: true, tenant, status: 'UNKNOWN', active: false })
  }

  const row = await prisma.tenant.findUnique({
    where: { slug: tenant },
    select: { status: true },
  })
  const status = row?.status ?? 'UNKNOWN'
  const active = status === 'ACTIVE'
  return NextResponse.json({ ok: true, tenant, status, active })
}



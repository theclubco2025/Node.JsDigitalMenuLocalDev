import { NextRequest, NextResponse } from 'next/server'
import { setMemoryMenu, writeMenu } from '@/lib/data/menu'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { tenant, menu } = await request.json()
    if (!tenant || typeof tenant !== 'string') {
      return NextResponse.json({ error: 'Missing tenant' }, { status: 400 })
    }
    if (!menu || typeof menu !== 'object') {
      return NextResponse.json({ error: 'Missing menu' }, { status: 400 })
    }

    // Production gate: allow either ADMIN_TOKEN or authenticated tenant owner via NextAuth
    if (process.env.NODE_ENV === 'production') {
      const adminToken = process.env.ADMIN_TOKEN || ''
      const headerToken = request.headers.get('x-admin-token') || request.headers.get('X-Admin-Token')
      const hasAdmin = adminToken && headerToken === adminToken
      if (!hasAdmin) {
        const session = await getServerSession(authOptions)
        if (!session) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
        // Resolve the tenant slug from session tenantId
        let sessionTenantSlug: string | null = null
        try {
          const tid = (session as unknown as { tenantId?: string | null }).tenantId
          if (tid) {
            const t = await prisma.tenant.findUnique({ where: { id: tid }, select: { slug: true } })
            sessionTenantSlug = t?.slug || null
          }
        } catch {}
        const target = tenant.endsWith('-draft') ? tenant.replace(/-draft$/, '') : tenant
        if (!sessionTenantSlug || sessionTenantSlug !== target) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      }
    }

    // Persist menu. In production with a DB, do NOT silently fall back to memory
    // (that would look like "saved" but won't reflect on other lambdas/page refresh).
    try {
      await writeMenu(tenant, menu)
    } catch (e) {
      const hasDb = !!(process.env.DATABASE_URL || '').trim()
      if (process.env.NODE_ENV === 'production' && hasDb) {
        return NextResponse.json({ error: (e as Error)?.message || 'Save failed' }, { status: 500 })
      }
      setMemoryMenu(tenant, menu)
    }

    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Invalid JSON'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}



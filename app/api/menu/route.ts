import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { resolveTenant } from '@/lib/tenant'
import { readMenu } from '@/lib/data/menu'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenant = resolveTenant(request.url)
    // Safety: never serve draft tenants on production (prevents leaking unapproved menus)
    const isPreview = process.env.VERCEL_ENV === 'preview'
    if (!isPreview && tenant.endsWith('-draft')) {
      return NextResponse.json({ error: 'Not found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } })
    }

    // Paid-gate (production only): do not serve live menus for unpaid tenants.
    // Preview must remain viewable for client review.
    // TEMP testing bypass: allow ONLY buttercuppantry to load menu data without activation.
    // This is intentionally tenant-scoped so it won't affect any other live menus.
    if (!isPreview && tenant === 'buttercuppantry') {
      // skip paywall
    } else if (!isPreview && tenant !== 'demo' && !tenant.endsWith('-draft') && process.env.DATABASE_URL) {
      const row = await prisma.tenant.findUnique({ where: { slug: tenant }, select: { status: true } })
      if (row?.status !== 'ACTIVE') {
        const billingUrl = `/billing?tenant=${encodeURIComponent(tenant)}`
        return NextResponse.json(
          { error: 'payment_required', billingUrl },
          { status: 402, headers: { 'Cache-Control': 'no-store' } }
        )
      }
    }
    const q = searchParams.get('q') || undefined
    const menu = await readMenu(tenant)

    // simple filter on q
    const filtered = q?.trim()
      ? {
          categories: menu.categories
            .map(c => ({
              ...c,
              items: c.items.filter(i =>
                i.name.toLowerCase().includes(q.toLowerCase()) ||
                (i.description?.toLowerCase().includes(q.toLowerCase()) ?? false) ||
                (i.tags?.some(t => t.toLowerCase().includes(q.toLowerCase())) ?? false)
              )
            }))
            .filter(c => c.items.length > 0)
        }
      : menu

    if (!filtered || !Array.isArray(filtered.categories)) {
      return NextResponse.json(
        { error: 'Menu not found for the specified tenant' },
        { status: 404 }
      )
    }

    return NextResponse.json(filtered, { headers: { 'Cache-Control': 'no-store' } })

  } catch (error) {
    console.error('Menu API error:', error)
    const detail = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: 'Internal server error', detail },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}

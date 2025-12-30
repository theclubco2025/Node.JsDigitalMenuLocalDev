import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { resolveTenant } from '@/lib/tenant'
import type { MenuResponse } from '@/types/api'
import { readMenu, writeMenu } from '@/lib/data/menu'
import { prisma } from '@/lib/prisma'
import { promises as fs } from 'fs'
import path from 'path'

function hasAnyMenuItems(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const cats = (value as Record<string, unknown>).categories
  if (!Array.isArray(cats)) return false
  return cats.some((c) => {
    if (!c || typeof c !== 'object') return false
    const items = (c as Record<string, unknown>).items
    return Array.isArray(items) && items.length > 0
  })
}

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

    // TEMP testing: for buttercuppantry, prefer the filesystem menu (exact draft copy),
    // but fall back to DB when needed. Also guard against DB returning an empty menu.
    let menuSource: 'fs' | 'db' = 'db'
    let menu = await readMenu(tenant)
    if (tenant === 'buttercuppantry') {
      try {
        const fsMenu: unknown = JSON.parse(
          await fs.readFile(path.join(process.cwd(), 'data', 'tenants', tenant, 'menu.json'), 'utf8')
        )
        if (hasAnyMenuItems(fsMenu)) {
          // If DB is empty for this tenant, seed it once from the filesystem copy.
          if (!menu.categories || menu.categories.length === 0) {
            await writeMenu(tenant, fsMenu as unknown as MenuResponse)
            menu = await readMenu(tenant)
          }
          // Fallback: still return filesystem copy if DB write/read fails for any reason.
          if (!menu.categories || menu.categories.length === 0) {
            menu = fsMenu as unknown as MenuResponse
            menuSource = 'fs'
          }
        }
      } catch {
        // keep DB
      }
    }

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

    const headers: Record<string, string> = { 'Cache-Control': 'no-store' }
    if (tenant === 'buttercuppantry' && menuSource === 'fs') headers['X-Menu-Source'] = 'filesystem'
    return NextResponse.json(filtered, { headers })

  } catch (error) {
    console.error('Menu API error:', error)
    const detail = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: 'Internal server error', detail },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}

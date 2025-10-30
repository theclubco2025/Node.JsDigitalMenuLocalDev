import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { resolveTenant } from '@/lib/tenant'
import { readMenu } from '@/lib/data/menu'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenant = resolveTenant(request.url)
    const q = searchParams.get('q') || undefined

    const menu = await readMenu(tenant)
    const includeUnavailable = (searchParams.get('includeUnavailable') || '').trim() === '1'

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

    const sanitized = includeUnavailable
      ? filtered
      : {
          categories: filtered.categories
            .map(category => ({
              ...category,
              items: category.items.filter(item => item.available !== false),
            }))
            .filter(category => category.items.length > 0),
        }

    if (!sanitized || !Array.isArray(sanitized.categories)) {
      return NextResponse.json(
        { error: 'Menu not found for the specified tenant' },
        { status: 404 }
      )
    }

    return NextResponse.json(sanitized, { headers: { 'Cache-Control': 'no-store' } })

  } catch (error) {
    console.error('Menu API error:', error)
    const detail = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: 'Internal server error', detail },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import type { PrismaClient, Prisma } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      const adminToken = process.env.ADMIN_TOKEN
      const headerToken = request.headers.get('x-admin-token') || request.headers.get('X-Admin-Token')
      if (!adminToken || !headerToken || headerToken !== adminToken) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL required' }, { status: 501 })
    }

    const body = await request.json().catch(() => ({})) as { from?: string; to?: string }
    const params = request.nextUrl.searchParams
    const from = ((body.from ?? params.get('from') ?? '') as string).trim()
    const to = ((body.to ?? params.get('to') ?? '') as string).trim()
    if (!from || !to) return NextResponse.json({ error: 'Missing from/to' }, { status: 400 })

    const { prisma } = await import('@/lib/prisma').catch(() => ({ prisma: undefined as PrismaClient | undefined }))
    if (!prisma) return NextResponse.json({ error: 'Prisma unavailable' }, { status: 500 })

    // Load source tenant and latest menu
    const srcTenant = await prisma.tenant.findUnique({ where: { slug: from } })
    if (!srcTenant) return NextResponse.json({ error: 'Source tenant not found' }, { status: 404 })

    const srcMenus = await prisma.menu.findMany({
      where: { tenantId: srcTenant.id },
      orderBy: { createdAt: 'desc' },
      take: 1,
      include: { categories: { include: { items: { include: { tags: true } } } } }
    })
    const srcMenu = srcMenus[0] || null

    // Upsert target tenant and copy settings
    const target = await prisma.tenant.upsert({
      where: { slug: to },
      update: { name: srcTenant.name, settings: (srcTenant.settings as Prisma.InputJsonValue) },
      create: { slug: to, name: srcTenant.name, settings: (srcTenant.settings as Prisma.InputJsonValue) }
    })

    if (srcMenu) {
      // Create a fresh menu for the target and copy categories/items/tags
      const newMenu = await prisma.menu.create({ data: { tenantId: target.id, name: `${to} menu ${new Date().toISOString()}` } })
      for (const c of srcMenu.categories) {
        const newCat = await prisma.menuCategory.create({ data: { menuId: newMenu.id, name: c.name, description: c.description ?? null } })
        for (const it of c.items) {
          const newItem = await prisma.menuItem.create({
            data: {
              categoryId: newCat.id,
              name: it.name,
              description: it.description,
              price: it.price,
              imageUrl: it.imageUrl,
              calories: it.calories,
              available: it.available
            }
          })
          for (const t of it.tags) {
            await prisma.menuItemTag.create({ data: { itemId: newItem.id, tag: t.tag } })
          }
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'promote_error', detail }, { status: 500 })
  }
}



import { NextRequest, NextResponse } from 'next/server'
import type { PrismaClient, Prisma } from '@prisma/client'
import { promises as fs } from 'fs'
import path from 'path'
import { readMenu, writeMenu } from '@/lib/data/menu'
import type { MenuResponse } from '@/types/api'

type PromoteBundle = {
  settings?: Record<string, unknown>
  menu?: MenuResponse
}

const titleizeSlug = (slug: string) => slug.replace(/-draft$/, '').split('-').filter(Boolean).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ') || slug

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

    const body = await request.json().catch(() => ({})) as { from?: string; to?: string; skipForward?: boolean; bundle?: PromoteBundle }
    const params = request.nextUrl.searchParams
    const from = ((body.from ?? params.get('from') ?? '') as string).trim()
    const to = ((body.to ?? params.get('to') ?? '') as string).trim()
    if (!from || !to) return NextResponse.json({ error: 'Missing from/to' }, { status: 400 })
    const skipForward = body.skipForward === true
    const rawBundle = body.bundle && typeof body.bundle === 'object' ? body.bundle : undefined
    const bundle: PromoteBundle | undefined = rawBundle

    const { prisma } = await import('@/lib/prisma').catch(() => ({ prisma: undefined as PrismaClient | undefined }))
    if (!prisma) return NextResponse.json({ error: 'Prisma unavailable' }, { status: 500 })
    let forwarded = false

    if (bundle && (bundle.settings || bundle.menu)) {
      const settingsRecord = bundle.settings ? JSON.parse(JSON.stringify(bundle.settings)) : undefined
      const settingsValue = settingsRecord ? (settingsRecord as Prisma.InputJsonValue) : undefined
      const name = titleizeSlug(from)
      await prisma.tenant.upsert({
        where: { slug: from },
        update: {
          name,
          ...(settingsValue ? { settings: settingsValue } : {}),
        },
        create: {
          slug: from,
          name,
          settings: settingsValue ?? {},
        },
      })
      if (bundle.menu) {
        await writeMenu(from, bundle.menu)
      }
    }

    // Load source tenant and latest menu
    const srcTenant = await prisma.tenant.findUnique({ where: { slug: from } })
    if (!srcTenant) {
      // FS fallback: copy from data/tenants/<from> when DB tenant missing
      try {
        const base = path.join(process.cwd(), 'data', 'tenants', from)
        const safeRead = async (fname: string) => {
          try {
            const buf = await fs.readFile(path.join(base, fname), 'utf8')
            return JSON.parse(buf)
          } catch {
            return null
          }
        }
        const [brand, images, style, copy, theme, menu] = await Promise.all([
          safeRead('brand.json'),
          safeRead('images.json'),
          safeRead('style.json'),
          safeRead('copy.json'),
          safeRead('theme.json'),
          safeRead('menu.json'),
        ])
        // Upsert target settings (merge all available keys)
        await prisma.tenant.upsert({
          where: { slug: to },
          update: { name: to, settings: ({
            ...(brand ? { brand } : {}),
            ...(images ? { images } : {}),
            ...(style ? { style } : {}),
            ...(copy ? { copy } : {}),
            ...(theme ? { theme } : {}),
          } as Prisma.InputJsonValue) },
          create: { slug: to, name: to, settings: ({
            ...(brand ? { brand } : {}),
            ...(images ? { images } : {}),
            ...(style ? { style } : {}),
            ...(copy ? { copy } : {}),
            ...(theme ? { theme } : {}),
          } as Prisma.InputJsonValue) },
        })

        // Persist menu if present (via shared writer → DB when available)
        if (menu && typeof menu === 'object' && Array.isArray(menu.categories)) {
          await writeMenu(to, menu as unknown as MenuResponse)
        }

        return NextResponse.json({ ok: true, fsFallback: true })
      } catch {
        return NextResponse.json({ error: 'Source tenant not found' }, { status: 404 })
      }
    }

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

    const forwardBase = process.env.PROMOTE_FORWARD_BASE_URL || ''
    const shouldForward = !skipForward && forwardBase && ((process.env.VERCEL_ENV || '').toLowerCase() === 'preview')
    if (shouldForward) {
      try {
        const url = `${forwardBase.replace(/\/$/, '')}/api/tenant/promote`
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        const adminToken = process.env.ADMIN_TOKEN?.trim()
        if (adminToken) headers['X-Admin-Token'] = adminToken
        const payload: Record<string, unknown> = { from, to, skipForward: true }
        let forwardBundle: PromoteBundle | undefined
        try {
          const settingsValue = srcTenant.settings ? JSON.parse(JSON.stringify(srcTenant.settings)) : undefined
          const menuPayload = await readMenu(from)
          forwardBundle = {
            ...(settingsValue ? { settings: settingsValue as Record<string, unknown> } : {}),
            ...(menuPayload ? { menu: menuPayload } : {}),
          }
        } catch {}
        if (forwardBundle && (forwardBundle.settings || forwardBundle.menu)) {
          payload.bundle = forwardBundle
        }
        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          cache: 'no-store',
        })
        forwarded = res.ok
      } catch (err) {
        console.error('Promote forward failed', err)
      }
    }

    return NextResponse.json({ ok: true, forwarded })
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'promote_error', detail }, { status: 500 })
  }
}



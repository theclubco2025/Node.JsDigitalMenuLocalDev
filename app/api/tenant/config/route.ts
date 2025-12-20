import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { promises as fs } from 'fs'
import path from 'path'
import type { PrismaClient, Prisma } from '@prisma/client'

type TenantConfigJson = Record<string, unknown> | null

async function readJson(filePath: string): Promise<TenantConfigJson> {
  try {
    const buf = await fs.readFile(filePath, 'utf8')
    return JSON.parse(buf)
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenant = (searchParams.get('tenant') || '').trim() || 'demo'

    const isPreview = process.env.VERCEL_ENV === 'preview'
    // Safety: never serve draft tenants on production
    if (!isPreview && tenant.endsWith('-draft')) {
      return NextResponse.json({ error: 'Not found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } })
    }

    const allowDraftFallback = isPreview || process.env.ALLOW_DRAFT_FALLBACK === '1'
    const fallbackTenant = (allowDraftFallback && !tenant.endsWith('-draft')) ? `${tenant}-draft` : ''
    // Always prefer DB (Neon) so preview reflects live edits instantly; fallback to repo files

    // Load DB settings first (if available)
    let dbBrand: Record<string, unknown> | null = null
    let dbTheme: Record<string, unknown> | null = null
    let dbImages: Record<string, unknown> | null = null
    let dbStyle: Record<string, unknown> | null = null
    let dbCopy: Record<string, unknown> | null = null

    // Fallback (draft) DB settings
    let fbDbBrand: Record<string, unknown> | null = null
    let fbDbTheme: Record<string, unknown> | null = null
    let fbDbImages: Record<string, unknown> | null = null
    let fbDbStyle: Record<string, unknown> | null = null
    let fbDbCopy: Record<string, unknown> | null = null
    if (process.env.DATABASE_URL) {
      try {
        const { prisma } = await import('@/lib/prisma').catch(() => ({ prisma: undefined as PrismaClient | undefined }))
        if (prisma) {
          const row = await prisma.tenant.findUnique({ where: { slug: tenant }, select: { settings: true } })
          const s = (row?.settings as Record<string, unknown>) || {}
          dbTheme = (s.theme as Record<string, unknown>) || null
          dbBrand = (s.brand as Record<string, unknown>) || null
          dbImages = (s.images as Record<string, unknown>) || null
          dbStyle = (s.style as Record<string, unknown>) || null
          dbCopy = (s.copy as Record<string, unknown>) || null

          // If any are missing, try draft tenant as fallback (DB) â€” preview only
          if (fallbackTenant && (!dbBrand || !dbTheme || !dbImages || !dbStyle || !dbCopy)) {
            const fbRow = await prisma.tenant.findUnique({ where: { slug: fallbackTenant }, select: { settings: true } })
            const fs = (fbRow?.settings as Record<string, unknown>) || {}
            fbDbTheme = (fs.theme as Record<string, unknown>) || null
            fbDbBrand = (fs.brand as Record<string, unknown>) || null
            fbDbImages = (fs.images as Record<string, unknown>) || null
            fbDbStyle = (fs.style as Record<string, unknown>) || null
            fbDbCopy = (fs.copy as Record<string, unknown>) || null
          }
        }
      } catch {}
    }

    // Fallback to filesystem for dev/demo
    const base = path.join(process.cwd(), 'data', 'tenants', tenant)
    const fsBrand = await readJson(path.join(base, 'brand.json'))
    const fsTheme = await readJson(path.join(base, 'theme.json'))
    const fsImages = await readJson(path.join(base, 'images.json'))
    const fsStyle = await readJson(path.join(base, 'style.json'))
    const fsCopy = await readJson(path.join(base, 'copy.json'))
    // Filesystem fallback from draft tenant (preview only)
    const fbFsBrand = fallbackTenant ? await readJson(path.join(process.cwd(), 'data', 'tenants', fallbackTenant, 'brand.json')) : null
    const fbFsTheme = fallbackTenant ? await readJson(path.join(process.cwd(), 'data', 'tenants', fallbackTenant, 'theme.json')) : null
    const fbFsImages = fallbackTenant ? await readJson(path.join(process.cwd(), 'data', 'tenants', fallbackTenant, 'images.json')) : null
    const fbFsStyle = fallbackTenant ? await readJson(path.join(process.cwd(), 'data', 'tenants', fallbackTenant, 'style.json')) : null
    const fbFsCopy = fallbackTenant ? await readJson(path.join(process.cwd(), 'data', 'tenants', fallbackTenant, 'copy.json')) : null

    const isNonEmpty = (obj: unknown) => !!(obj && typeof obj === 'object' && Object.keys(obj as Record<string, unknown>).length > 0)
    const hasName = (obj: unknown) => !!(obj && typeof (obj as Record<string, unknown>)['name'] === 'string' && ((obj as Record<string, unknown>)['name'] as string).trim() !== '')

    // Prefer DB only when it actually contains meaningful values; otherwise fall back to FS
    // Prefer live DB when non-empty, then live FS; if still missing, fall back to draft (DB then FS)
    const brand = (hasName(dbBrand) ? dbBrand : null)
      ?? (hasName(fsBrand) ? fsBrand : null)
      ?? (hasName(fbDbBrand) ? fbDbBrand : null)
      ?? fbFsBrand

    const theme = (isNonEmpty(dbTheme) ? dbTheme : null)
      ?? (isNonEmpty(fsTheme) ? fsTheme : null)
      ?? (isNonEmpty(fbDbTheme) ? fbDbTheme : null)
      ?? fbFsTheme

    const images = (isNonEmpty(dbImages) ? dbImages : null)
      ?? (isNonEmpty(fsImages) ? fsImages : null)
      ?? (isNonEmpty(fbDbImages) ? fbDbImages : null)
      ?? fbFsImages

    const style = (isNonEmpty(dbStyle) ? dbStyle : null)
      ?? (isNonEmpty(fsStyle) ? fsStyle : null)
      ?? (isNonEmpty(fbDbStyle) ? fbDbStyle : null)
      ?? fbFsStyle

    const copy = (isNonEmpty(dbCopy) ? dbCopy : null)
      ?? (isNonEmpty(fsCopy) ? fsCopy : null)
      ?? (isNonEmpty(fbDbCopy) ? fbDbCopy : null)
      ?? fbFsCopy

    return NextResponse.json({ brand, theme, images, style, copy }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'config_error', detail }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Protect in production
    if (process.env.NODE_ENV === 'production') {
      const adminToken = process.env.ADMIN_TOKEN
      const headerToken = request.headers.get('x-admin-token') || request.headers.get('X-Admin-Token')
      if (!adminToken || !headerToken || headerToken !== adminToken) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL required for saving settings' }, { status: 501 })
    }

    const { searchParams } = new URL(request.url)
    const tenant = (searchParams.get('tenant') || '').trim()
    if (!tenant) return NextResponse.json({ error: 'Missing tenant' }, { status: 400 })

    const body = await request.json().catch(() => ({}))
    const nextBrand = body?.brand as Record<string, unknown> | undefined
    const nextImages = body?.images as Record<string, unknown> | undefined
    const nextStyle = body?.style as Record<string, unknown> | undefined
    const nextCopy = body?.copy as Record<string, unknown> | undefined

    if (!nextBrand && !nextImages && !nextStyle && !nextCopy) {
      return NextResponse.json({ error: 'No settings provided' }, { status: 400 })
    }

    const { prisma } = await import('@/lib/prisma')
    // Merge with existing settings to preserve other keys (like theme)
    const existing = await prisma.tenant.findUnique({ where: { slug: tenant }, select: { settings: true } })
    const current = (existing?.settings as Record<string, unknown>) || {}
    const merged = {
      ...current,
      ...(nextBrand ? { brand: nextBrand } : {}),
      ...(nextImages ? { images: nextImages } : {}),
      ...(nextStyle ? { style: nextStyle } : {}),
      ...(nextCopy ? { copy: nextCopy } : {}),
    }

    await prisma.tenant.upsert({
      where: { slug: tenant },
      update: { settings: merged as Prisma.InputJsonValue },
      create: { slug: tenant, name: tenant, settings: merged as Prisma.InputJsonValue },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'save_error', detail }, { status: 500 })
  }
}



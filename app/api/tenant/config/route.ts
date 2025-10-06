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
    const preferFSInPreview = process.env.VERCEL_ENV === 'preview'

    // Load DB settings first (if available)
    let dbBrand: Record<string, unknown> | null = null
    let dbTheme: Record<string, unknown> | null = null
    let dbImages: Record<string, unknown> | null = null
    let dbStyle: Record<string, unknown> | null = null
    let dbCopy: Record<string, unknown> | null = null
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

    // In preview, prefer filesystem (repo) over DB to make onboarding edits reflect instantly
    const brand = preferFSInPreview ? (fsBrand ?? dbBrand) : (dbBrand ?? fsBrand)
    const theme = preferFSInPreview ? (fsTheme ?? dbTheme) : (dbTheme ?? fsTheme)
    const images = preferFSInPreview ? (fsImages ?? dbImages) : (dbImages ?? fsImages)
    const style = preferFSInPreview ? (fsStyle ?? dbStyle) : (dbStyle ?? fsStyle)
    const copy = preferFSInPreview ? (fsCopy ?? dbCopy) : (dbCopy ?? fsCopy)

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



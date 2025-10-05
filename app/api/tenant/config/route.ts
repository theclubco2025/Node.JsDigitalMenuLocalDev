import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import type { PrismaClient } from '@prisma/client'

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

    // Prefer DB settings if available
    if (process.env.DATABASE_URL) {
      try {
        const { prisma } = await import('@/lib/prisma').catch(() => ({ prisma: undefined as PrismaClient | undefined }))
        if (prisma) {
          const row = await prisma.tenant.findUnique({ where: { slug: tenant }, select: { settings: true } })
          const s = (row?.settings as Record<string, unknown>) || {}
          const theme = (s.theme as Record<string, unknown>) || null
          const brand = (s.brand as Record<string, unknown>) || null
          const images = (s.images as Record<string, unknown>) || null
          const style = (s.style as Record<string, unknown>) || null
          const copy = (s.copy as Record<string, unknown>) || null
          // If anything exists in DB, return it immediately
          if (brand || theme || images || style || copy) {
            return NextResponse.json({ brand, theme, images, style, copy }, { headers: { 'Cache-Control': 'no-store' } })
          }
        }
      } catch {}
    }

    // Fallback to filesystem for dev/demo
    const base = path.join(process.cwd(), 'data', 'tenants', tenant)
    const brand = await readJson(path.join(base, 'brand.json'))
    const theme = await readJson(path.join(base, 'theme.json'))
    const images = await readJson(path.join(base, 'images.json'))
    const style = await readJson(path.join(base, 'style.json'))
    const copy = await readJson(path.join(base, 'copy.json'))
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
      update: { settings: merged as any },
      create: { slug: tenant, name: tenant, settings: merged as any },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'save_error', detail }, { status: 500 })
  }
}



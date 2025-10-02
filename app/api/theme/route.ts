import { NextRequest, NextResponse } from 'next/server'
import { resolveTenant } from '@/lib/tenant'
import { getTheme } from '@/lib/theme'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const tenant = resolveTenant(request.url)
    const theme = await getTheme(tenant)
    return NextResponse.json(theme, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to load theme' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Theme editing requires DATABASE_URL' }, { status: 501 })
    }
    const tenant = resolveTenant(request.url)
    const body = await request.json()
    const nextTheme = {
      primary: String(body?.primary || '').trim(),
      accent: String(body?.accent || '').trim(),
      radius: String(body?.radius || '').trim(),
    }
    if (!nextTheme.primary && !nextTheme.accent && !nextTheme.radius) {
      return NextResponse.json({ error: 'No theme fields provided' }, { status: 400 })
    }

    const { prisma } = await import('@/lib/prisma')

    // Load existing settings (if any) to preserve non-theme keys
    const existing = await prisma.tenant.findUnique({ where: { slug: tenant }, select: { settings: true } })
    const currentSettings = (existing?.settings as any) || {}

    // Upsert tenant and persist theme
    await prisma.tenant.upsert({
      where: { slug: tenant },
      update: {
        settings: {
          ...currentSettings,
          theme: nextTheme,
        } as any,
      },
      create: {
        slug: tenant,
        name: tenant,
        settings: { theme: nextTheme } as any,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = (e as Error)?.message || 'Failed to save theme'
    // Dev fallback: persist theme to filesystem so UI updates even if DB is momentarily unavailable
    if (process.env.NODE_ENV !== 'production') {
      try {
        const { promises: fs } = await import('fs')
        const path = await import('path')
        const dir = path.join(process.cwd(), 'data', 'tenants', tenant)
        const file = path.join(dir, 'theme.json')
        await fs.mkdir(dir, { recursive: true })
        await fs.writeFile(file, JSON.stringify(nextTheme, null, 2), 'utf8')
        console.warn('[theme] DB unavailable, wrote theme to filesystem for tenant:', tenant)
        return NextResponse.json({ ok: true, fallback: 'fs' })
      } catch (fsErr) {
        console.error('Theme save error (db+fs):', e, fsErr)
        return NextResponse.json({ error: 'Failed to save theme', detail: msg }, { status: 500 })
      }
    }
    return NextResponse.json({ error: 'Failed to save theme' }, { status: 500 })
  }
}




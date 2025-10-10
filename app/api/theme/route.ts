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
  } catch {
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
    const body = await request.json().catch(() => ({}))

    // Normalize radius: accept number (px) or string (ensure px when numeric)
    const rawRadius = body?.radius
    let radius: string = ''
    if (typeof rawRadius === 'number' && Number.isFinite(rawRadius)) {
      radius = `${rawRadius}px`
    } else if (typeof rawRadius === 'string') {
      const trimmed = rawRadius.trim()
      radius = /^\d+(\.\d+)?$/.test(trimmed) ? `${trimmed}px` : trimmed
    }

    const nextTheme: Record<string, string> = {}
    const assign = (k: string) => {
      const v = typeof body?.[k] === 'string' ? String(body[k]).trim() : ''
      if (v) nextTheme[k] = v
    }
    assign('primary')
    assign('accent')
    assign('bg')
    assign('text')
    assign('ink')
    assign('card')
    assign('muted')
    if (radius) nextTheme.radius = radius

    if (Object.keys(nextTheme).length === 0) {
      return NextResponse.json({ error: 'No theme fields provided' }, { status: 400 })
    }

    const { prisma } = await import('@/lib/prisma')

    // Load existing settings (if any) to preserve non-theme keys
    const existing = await prisma.tenant.findUnique({ where: { slug: tenant }, select: { settings: true } })
    const currentSettings = (existing?.settings as Record<string, unknown>) || {}

    // Upsert tenant and persist theme
    await prisma.tenant.upsert({
      where: { slug: tenant },
      update: {
        settings: {
          ...currentSettings,
          theme: {
            ...(currentSettings as Record<string, unknown>)?.['theme'] as Record<string, unknown> || {},
            ...nextTheme,
          },
        },
      },
      create: {
        slug: tenant,
        name: tenant,
        settings: { theme: nextTheme },
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to save theme'
    if (process.env.NODE_ENV !== 'production') {
      console.error('Theme save error:', error)
      return NextResponse.json({ error: 'Failed to save theme', detail: msg }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to save theme' }, { status: 500 })
  }
}




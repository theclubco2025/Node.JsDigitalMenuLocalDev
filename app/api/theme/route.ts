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
  } catch (error) {
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
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to save theme'
    if (process.env.NODE_ENV !== 'production') {
      console.error('Theme save error:', e)
      return NextResponse.json({ error: 'Failed to save theme', detail: msg }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to save theme' }, { status: 500 })
  }
}




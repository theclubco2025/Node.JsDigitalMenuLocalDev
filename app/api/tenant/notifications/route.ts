import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function normalizeEmails(raw: unknown): string[] {
  const s = typeof raw === 'string' ? raw : ''
  const parts = s.split(',').map(x => x.trim()).filter(Boolean)
  const unique = Array.from(new Set(parts.map(p => p.toLowerCase())))
  return unique
}

function parseEmailsOrThrow(raw: unknown): string[] {
  const emails = normalizeEmails(raw)
  for (const e of emails) {
    const ok = z.string().email().safeParse(e).success
    if (!ok) throw new Error(`Invalid email: ${e}`)
  }
  return emails
}

function notificationsFromSettings(settings: unknown): { newOrderEmails: string[] } {
  const s = (settings && typeof settings === 'object') ? (settings as Record<string, unknown>) : {}
  const notifications = (s.notifications && typeof s.notifications === 'object') ? (s.notifications as Record<string, unknown>) : {}
  const raw = notifications.newOrderEmails
  const list =
    Array.isArray(raw)
      ? raw.map(v => String(v || '').trim()).filter(Boolean)
      : (typeof raw === 'string' ? normalizeEmails(raw) : [])
  return { newOrderEmails: list }
}

const PostBody = z.object({
  tenant: z.string().min(1),
  newOrderEmails: z.string().max(2000).optional().default(''),
})

export async function GET(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, error: 'DATABASE_URL required' }, { status: 501 })
    }
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

    const role = (session as unknown as { role?: string }).role || ''
    const tenantId = (session as unknown as { tenantId?: string | null }).tenantId || null

    const requestedTenant = (req.nextUrl.searchParams.get('tenant') || '').trim().toLowerCase()
    if (!requestedTenant) return NextResponse.json({ ok: false, error: 'Missing tenant' }, { status: 400 })

    if (role !== 'SUPER_ADMIN') {
      if (!tenantId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
      const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
      if (!t || t.slug !== requestedTenant) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const row = await prisma.tenant.findUnique({ where: { slug: requestedTenant }, select: { settings: true } })
    const notifs = notificationsFromSettings(row?.settings)
    return NextResponse.json({ ok: true, tenant: requestedTenant, notifications: notifs }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error)?.message || 'Notifications load error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, error: 'DATABASE_URL required' }, { status: 501 })
    }
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

    const role = (session as unknown as { role?: string }).role || ''
    const tenantId = (session as unknown as { tenantId?: string | null }).tenantId || null

    const raw = await req.json().catch(() => ({}))
    const parsed = PostBody.safeParse(raw)
    if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })

    const requestedTenant = parsed.data.tenant.trim().toLowerCase()

    if (role !== 'SUPER_ADMIN') {
      if (!tenantId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
      const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
      if (!t || t.slug !== requestedTenant) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const nextEmails = parseEmailsOrThrow(parsed.data.newOrderEmails)

    const row = await prisma.tenant.findUnique({ where: { slug: requestedTenant }, select: { id: true, settings: true } })
    if (!row) return NextResponse.json({ ok: false, error: 'Tenant not found' }, { status: 404 })

    const currentSettings = (row.settings && typeof row.settings === 'object') ? (row.settings as Record<string, unknown>) : {}
    const currentNotifs = (currentSettings.notifications && typeof currentSettings.notifications === 'object')
      ? (currentSettings.notifications as Record<string, unknown>)
      : {}
    const nextSettings = {
      ...currentSettings,
      notifications: {
        ...currentNotifs,
        newOrderEmails: nextEmails,
      },
    }

    await prisma.tenant.update({
      where: { id: row.id },
      data: { settings: nextSettings as Prisma.InputJsonValue },
      select: { id: true },
    })

    return NextResponse.json({ ok: true, tenant: requestedTenant, notifications: { newOrderEmails: nextEmails } }, { status: 200 })
  } catch (e) {
    const msg = (e as Error)?.message || 'Notifications save error'
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}


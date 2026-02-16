import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getTwilioMessageStatus, twilioConfigured } from '@/lib/notifications/twilio'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const Query = z.object({
  tenant: z.string().min(1),
  sid: z.string().min(5),
})

function kitchenPinFromSettings(settings: unknown): string {
  if (!settings || typeof settings !== 'object') return ''
  const v = (settings as Record<string, unknown>).kitchenPin
  return typeof v === 'string' ? v.trim() : ''
}

function resolveKitchenTenantSlug(raw: string): string {
  const t = (raw || '').trim().toLowerCase()
  if (t === 'independent-kitchen-draft') return 'independent-draft'
  return t
}

function expectedKitchenPin(tenantSlug: string, settings: unknown): string {
  const fromSettings = kitchenPinFromSettings(settings)
  if (fromSettings) return fromSettings
  if (process.env.VERCEL_ENV === 'preview' && (tenantSlug === 'independent-draft' || tenantSlug === 'independent-kitchen-draft')) return '1234'
  return ''
}

function isAuthorized(req: NextRequest, tenantSlug: string, settings: unknown): boolean {
  const pin = expectedKitchenPin(tenantSlug, settings)
  if (!pin) return false
  const provided = (req.headers.get('x-kitchen-pin') || '').trim()
  return provided === pin
}

export async function GET(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, error: 'DATABASE_URL required' }, { status: 501 })
    }
    if (!twilioConfigured()) {
      return NextResponse.json({ ok: false, error: 'Twilio not configured' }, { status: 501 })
    }

    const { searchParams } = new URL(req.url)
    const parsed = Query.safeParse({
      tenant: searchParams.get('tenant') || '',
      sid: searchParams.get('sid') || '',
    })
    if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid query' }, { status: 400 })

    const tenant = resolveKitchenTenantSlug(parsed.data.tenant)
    const t = await prisma.tenant.findUnique({ where: { slug: tenant }, select: { id: true, settings: true } })
    if (!t) return NextResponse.json({ ok: false, error: 'Tenant not found' }, { status: 404 })
    if (!isAuthorized(req, tenant, t.settings)) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

    const msg = await getTwilioMessageStatus(parsed.data.sid)
    return NextResponse.json({ ok: true, message: msg }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error)?.message || 'sms status error' }, { status: 500 })
  }
}


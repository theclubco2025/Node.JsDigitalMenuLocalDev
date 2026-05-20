import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { maybeSendReadyNotifications } from '@/lib/notifications/ready-notifications'
import { resendConfigured } from '@/lib/notifications/resend-client'
import { twilioConfigured } from '@/lib/notifications/twilio'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const Body = z.object({
  orderId: z.string().min(1),
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
  return ''
}

function isAuthorized(req: NextRequest, tenantSlug: string, settings: unknown): boolean {
  const pin = expectedKitchenPin(tenantSlug, settings)
  if (!pin) return false
  const provided = (req.headers.get('x-kitchen-pin') || '').trim()
  return provided === pin
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, error: 'DATABASE_URL required' }, { status: 501 })
    }
    if (!twilioConfigured() && !resendConfigured()) {
      return NextResponse.json({ ok: false, error: 'Notifications not configured' }, { status: 501 })
    }

    const { searchParams } = new URL(req.url)
    const tenant = resolveKitchenTenantSlug(searchParams.get('tenant') || '')
    if (!tenant) return NextResponse.json({ ok: false, error: 'Missing tenant' }, { status: 400 })

    const raw = await req.json().catch(() => ({}))
    const parsed = Body.safeParse(raw)
    if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })

    const t = await prisma.tenant.findUnique({ where: { slug: tenant }, select: { id: true, name: true, settings: true } })
    if (!t) return NextResponse.json({ ok: false, error: 'Tenant not found' }, { status: 404 })
    if (!isAuthorized(req, tenant, t.settings)) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

    const order = await prisma.order.findUnique({
      where: { id: parsed.data.orderId },
      select: {
        id: true,
        tenantId: true,
        status: true,
        customerEmail: true,
        readyEmailSentAt: true,
        readySmsSentAt: true,
      },
    })
    if (!order) return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 })
    if (order.tenantId !== t.id) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    if (String(order.status).toUpperCase() !== 'READY') {
      return NextResponse.json({ ok: false, error: 'Order is not READY' }, { status: 409 })
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        readySmsSentAt: null,
        readyEmailSentAt: null,
        twilioReadyMessageSid: null,
        twilioReadyStatus: null,
        twilioReadyErrorCode: null,
        twilioReadyErrorMessage: null,
        readyEmailLastError: null,
        twilioReadyAttemptCount: { increment: 1 },
        twilioReadyLastAttemptAt: new Date(),
      },
    })

    const notifications = await maybeSendReadyNotifications({
      tenantId: t.id,
      tenantName: t.name || tenant,
      orderId: order.id,
    })

    return NextResponse.json({
      ok: true,
      sms: notifications.sms,
      email: notifications.email,
    }, { status: 200 })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error)?.message || 'Retry notifications error' }, { status: 500 })
  }
}

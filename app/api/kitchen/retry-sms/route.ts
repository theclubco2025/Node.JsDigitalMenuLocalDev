import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { sendTwilioReadySms, twilioConfigured } from '@/lib/notifications/twilio'

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
  // Public POC pins (consistent across environments).
  if (tenantSlug === 'demo') return '1234'
  if (tenantSlug === 'independentbarandgrille' || tenantSlug === 'independent-draft' || tenantSlug === 'independent-kitchen-draft') return '4321'
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

function safeErr(e: unknown): string {
  const msg = (e instanceof Error ? e.message : String(e || '')).trim()
  return msg.length > 220 ? `${msg.slice(0, 220)}…` : (msg || 'unknown_error')
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, error: 'DATABASE_URL required' }, { status: 501 })
    }
    if (!twilioConfigured()) {
      return NextResponse.json({ ok: false, error: 'Twilio not configured' }, { status: 501 })
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
        smsOptIn: true,
        customerPhone: true,
        tableNumber: true,
        twilioReadyAttemptCount: true,
        twilioReadyLastAttemptAt: true,
      },
    })
    if (!order) return NextResponse.json({ ok: false, error: 'Order not found' }, { status: 404 })
    if (order.tenantId !== t.id) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    if (String(order.status).toUpperCase() !== 'READY') return NextResponse.json({ ok: false, error: 'Order is not READY' }, { status: 409 })
    if (!order.smsOptIn) return NextResponse.json({ ok: false, error: 'Customer did not opt in' }, { status: 409 })
    if (!order.customerPhone) return NextResponse.json({ ok: false, error: 'Missing customer phone' }, { status: 409 })

    const attempts = Number(order.twilioReadyAttemptCount || 0)
    if (attempts >= 3) {
      return NextResponse.json({ ok: false, error: 'Retry limit reached' }, { status: 429 })
    }
    const lastAt = order.twilioReadyLastAttemptAt ? new Date(order.twilioReadyLastAttemptAt).getTime() : 0
    if (lastAt && Date.now() - lastAt < 60_000) {
      return NextResponse.json({ ok: false, error: 'Please wait a moment before retrying' }, { status: 429 })
    }

    // Clear prior claim so the send can be retried.
    await prisma.order.update({
      where: { id: order.id },
      data: {
        readySmsSentAt: null,
        twilioReadyMessageSid: null,
        twilioReadyStatus: null,
        twilioReadyErrorCode: null,
        twilioReadyErrorMessage: null,
        twilioReadyAttemptCount: { increment: 1 },
        twilioReadyLastAttemptAt: new Date(),
        twilioReadyTo: order.customerPhone,
      },
    })

    // Claim send (idempotent) and send
    const claimed = await prisma.order.updateMany({
      where: {
        id: order.id,
        tenantId: t.id,
        status: 'READY',
        smsOptIn: true,
        readySmsSentAt: null,
        customerPhone: { not: null },
      },
      data: { readySmsSentAt: new Date() },
    })
    if (claimed.count !== 1) {
      return NextResponse.json({ ok: true, sms: { status: 'skipped', reason: 'already_sent' } }, { status: 200 })
    }

    const isDineIn = Boolean((order.tableNumber || '').trim())
    try {
      const sent = await sendTwilioReadySms({
        tenantName: t.name || tenant,
        orderId: order.id,
        toPhone: order.customerPhone || '',
        isDineIn,
        tableNumber: order.tableNumber,
      })
      await prisma.order.update({
        where: { id: order.id },
        data: {
          twilioReadyMessageSid: sent.sid,
          twilioReadyStatus: sent.status,
          twilioReadyTo: order.customerPhone,
        },
      })
      return NextResponse.json({ ok: true, sms: { status: 'queued', sid: sent.sid, twilioStatus: sent.status } }, { status: 200 })
    } catch (e) {
      const msg = safeErr(e)
      await prisma.order.update({
        where: { id: order.id },
        data: {
          readySmsSentAt: null,
          twilioReadyMessageSid: null,
          twilioReadyStatus: 'failed',
          twilioReadyErrorMessage: msg,
        },
      }).catch(() => {})
      return NextResponse.json({ ok: false, error: msg }, { status: 502 })
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error)?.message || 'Retry SMS error' }, { status: 500 })
  }
}


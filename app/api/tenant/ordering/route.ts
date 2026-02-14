import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DEFAULT_ORDERING = {
  enabled: false,
  paused: false,
  pauseMessage: '',
  fulfillment: 'pickup',
  timezone: 'America/Los_Angeles',
  scheduling: {
    enabled: true,
    slotMinutes: 15,
    leadTimeMinutes: 30,
  },
  dineIn: {
    enabled: false,
    label: 'Table number',
  },
  statusCopy: {
    pickup: {
      step3Label: 'Ready for Pickup',
      readyMessage: 'Your order is ready for pickup at the bar.',
    },
    dineIn: {
      step3Label: 'Ready for Table',
      readyMessage: 'Your order is ready — we’ll bring it to your table.',
    },
  },
  pickupCodeCopy: {
    helper: 'Save this pickup code — you’ll need it when you arrive.',
  },
  hours: null as unknown,
} as const

function normalizeOrdering(raw: unknown): Record<string, unknown> {
  const obj = (raw && typeof raw === 'object') ? (raw as Record<string, unknown>) : {}
  const schedulingRaw = (obj.scheduling && typeof obj.scheduling === 'object')
    ? (obj.scheduling as Record<string, unknown>)
    : {}
  const dineInRaw = (obj.dineIn && typeof obj.dineIn === 'object')
    ? (obj.dineIn as Record<string, unknown>)
    : {}
  const statusCopyRaw = (obj.statusCopy && typeof obj.statusCopy === 'object')
    ? (obj.statusCopy as Record<string, unknown>)
    : {}
  const statusCopyPickupRaw = (statusCopyRaw.pickup && typeof statusCopyRaw.pickup === 'object')
    ? (statusCopyRaw.pickup as Record<string, unknown>)
    : {}
  const statusCopyDineInRaw = (statusCopyRaw.dineIn && typeof statusCopyRaw.dineIn === 'object')
    ? (statusCopyRaw.dineIn as Record<string, unknown>)
    : {}
  const pickupCodeCopyRaw = (obj.pickupCodeCopy && typeof obj.pickupCodeCopy === 'object')
    ? (obj.pickupCodeCopy as Record<string, unknown>)
    : {}

  const enabled = typeof obj.enabled === 'boolean' ? obj.enabled : DEFAULT_ORDERING.enabled
  const paused = typeof obj.paused === 'boolean' ? obj.paused : DEFAULT_ORDERING.paused
  const pauseMessage = typeof obj.pauseMessage === 'string' ? obj.pauseMessage : DEFAULT_ORDERING.pauseMessage
  const fulfillment = (obj.fulfillment === 'pickup') ? 'pickup' : DEFAULT_ORDERING.fulfillment
  const timezone = typeof obj.timezone === 'string' && obj.timezone.trim() ? obj.timezone.trim() : DEFAULT_ORDERING.timezone

  const schedulingEnabled =
    typeof schedulingRaw.enabled === 'boolean' ? schedulingRaw.enabled : DEFAULT_ORDERING.scheduling.enabled
  const slotMinutes =
    typeof schedulingRaw.slotMinutes === 'number' && Number.isFinite(schedulingRaw.slotMinutes)
      ? Math.max(1, Math.floor(schedulingRaw.slotMinutes))
      : DEFAULT_ORDERING.scheduling.slotMinutes
  const leadTimeMinutes =
    typeof schedulingRaw.leadTimeMinutes === 'number' && Number.isFinite(schedulingRaw.leadTimeMinutes)
      ? Math.max(0, Math.floor(schedulingRaw.leadTimeMinutes))
      : DEFAULT_ORDERING.scheduling.leadTimeMinutes

  const hours = Object.prototype.hasOwnProperty.call(obj, 'hours') ? (obj.hours ?? null) : DEFAULT_ORDERING.hours

  return {
    enabled,
    paused,
    pauseMessage,
    fulfillment,
    timezone,
    scheduling: {
      enabled: schedulingEnabled,
      slotMinutes,
      leadTimeMinutes,
    },
    dineIn: {
      enabled: typeof dineInRaw.enabled === 'boolean' ? dineInRaw.enabled : DEFAULT_ORDERING.dineIn.enabled,
      label: typeof dineInRaw.label === 'string' && dineInRaw.label.trim() ? dineInRaw.label.trim() : DEFAULT_ORDERING.dineIn.label,
    },
    statusCopy: {
      pickup: {
        step3Label:
          typeof statusCopyPickupRaw.step3Label === 'string' && statusCopyPickupRaw.step3Label.trim()
            ? statusCopyPickupRaw.step3Label.trim()
            : DEFAULT_ORDERING.statusCopy.pickup.step3Label,
        readyMessage:
          typeof statusCopyPickupRaw.readyMessage === 'string' && statusCopyPickupRaw.readyMessage.trim()
            ? statusCopyPickupRaw.readyMessage.trim()
            : DEFAULT_ORDERING.statusCopy.pickup.readyMessage,
      },
      dineIn: {
        step3Label:
          typeof statusCopyDineInRaw.step3Label === 'string' && statusCopyDineInRaw.step3Label.trim()
            ? statusCopyDineInRaw.step3Label.trim()
            : DEFAULT_ORDERING.statusCopy.dineIn.step3Label,
        readyMessage:
          typeof statusCopyDineInRaw.readyMessage === 'string' && statusCopyDineInRaw.readyMessage.trim()
            ? statusCopyDineInRaw.readyMessage.trim()
            : DEFAULT_ORDERING.statusCopy.dineIn.readyMessage,
      },
    },
    pickupCodeCopy: {
      helper:
        typeof pickupCodeCopyRaw.helper === 'string' && pickupCodeCopyRaw.helper.trim()
          ? pickupCodeCopyRaw.helper.trim()
          : DEFAULT_ORDERING.pickupCodeCopy.helper,
    },
    hours,
  }
}

const Body = z.object({
  tenant: z.string().min(1),
  ordering: z.object({
    enabled: z.boolean().optional(),
    paused: z.boolean().optional(),
    pauseMessage: z.string().max(500).optional(),
    timezone: z.string().max(80).optional(),
    scheduling: z.object({
      enabled: z.boolean().optional(),
      slotMinutes: z.number().int().min(1).max(120).optional(),
      leadTimeMinutes: z.number().int().min(0).max(12 * 60).optional(),
    }).optional(),
    dineIn: z.object({
      enabled: z.boolean().optional(),
      label: z.string().max(40).optional(),
    }).optional(),
    statusCopy: z.object({
      pickup: z.object({
        step3Label: z.string().max(40).optional(),
        readyMessage: z.string().max(200).optional(),
      }).optional(),
      dineIn: z.object({
        step3Label: z.string().max(40).optional(),
        readyMessage: z.string().max(200).optional(),
      }).optional(),
    }).optional(),
    pickupCodeCopy: z.object({
      helper: z.string().max(200).optional(),
    }).optional(),
  }),
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
    const s = (row?.settings as Record<string, unknown>) || {}
    const ordering = normalizeOrdering(s.ordering ?? null)

    return NextResponse.json({ ok: true, tenant: requestedTenant, ordering }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error)?.message || 'Ordering settings error' }, { status: 500 })
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
    const parsed = Body.safeParse(raw)
    if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })

    const requestedTenant = parsed.data.tenant.trim().toLowerCase()

    if (role !== 'SUPER_ADMIN') {
      if (!tenantId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
      const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
      if (!t || t.slug !== requestedTenant) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const row = await prisma.tenant.findUnique({ where: { slug: requestedTenant }, select: { id: true, settings: true } })
    if (!row) return NextResponse.json({ ok: false, error: 'Tenant not found' }, { status: 404 })

    const currentSettings = (row.settings && typeof row.settings === 'object') ? (row.settings as Record<string, unknown>) : {}
    const currentOrdering = normalizeOrdering(currentSettings.ordering ?? null)

    const incoming = parsed.data.ordering as Record<string, unknown>
    const mergedOrdering = normalizeOrdering({
      ...currentOrdering,
      ...incoming,
      scheduling: {
        ...(((currentOrdering as Record<string, unknown>).scheduling as Record<string, unknown>) || {}),
        ...(((incoming.scheduling as Record<string, unknown> | undefined) || {})),
      },
      dineIn: {
        ...(((currentOrdering as Record<string, unknown>).dineIn as Record<string, unknown>) || {}),
        ...(((incoming.dineIn as Record<string, unknown> | undefined) || {})),
      },
      statusCopy: {
        ...(((currentOrdering as Record<string, unknown>).statusCopy as Record<string, unknown>) || {}),
        ...(((incoming.statusCopy as Record<string, unknown> | undefined) || {})),
        pickup: {
          ...(((((currentOrdering as Record<string, unknown>).statusCopy as Record<string, unknown>) || {}).pickup as Record<string, unknown>) || {}),
          ...(((((incoming.statusCopy as Record<string, unknown> | undefined) || {}) as Record<string, unknown>).pickup as Record<string, unknown>) || {}),
        },
        dineIn: {
          ...(((((currentOrdering as Record<string, unknown>).statusCopy as Record<string, unknown>) || {}).dineIn as Record<string, unknown>) || {}),
          ...(((((incoming.statusCopy as Record<string, unknown> | undefined) || {}) as Record<string, unknown>).dineIn as Record<string, unknown>) || {}),
        },
      },
      pickupCodeCopy: {
        ...(((currentOrdering as Record<string, unknown>).pickupCodeCopy as Record<string, unknown>) || {}),
        ...(((incoming.pickupCodeCopy as Record<string, unknown> | undefined) || {})),
      },
    })

    const nextSettings = {
      ...currentSettings,
      ordering: mergedOrdering,
    }

    await prisma.tenant.update({
      where: { id: row.id },
      data: { settings: nextSettings as Prisma.InputJsonValue },
      select: { id: true },
    })

    return NextResponse.json({ ok: true, ordering: mergedOrdering }, { status: 200 })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error)?.message || 'Ordering settings save error' }, { status: 500 })
  }
}


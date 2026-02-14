import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { promises as fs } from 'fs'
import path from 'path'
import type { PrismaClient } from '@prisma/client'
import type { InputJsonValue } from '@prisma/client/runtime/library'

type TenantConfigJson = Record<string, unknown> | null

const DEFAULT_ORDERING = {
  enabled: false,
  paused: false,
  pauseMessage: '',
  fulfillment: 'pickup',
  timezone: 'America/Los_Angeles', // PST default
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
  // If hours are unset, we assume 24/7 for testing.
  hours: null,
} as const

function pocOrderingTenants(): string[] {
  const raw = (process.env.ORDERING_POC_TENANTS || '').trim()
  if (!raw) return []
  return raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
}

function isOrderingPocEnabledForTenant(tenant: string): boolean {
  const list = pocOrderingTenants()
  return list.includes((tenant || '').toLowerCase())
}

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
      ? schedulingRaw.slotMinutes
      : DEFAULT_ORDERING.scheduling.slotMinutes
  const leadTimeMinutes =
    typeof schedulingRaw.leadTimeMinutes === 'number' && Number.isFinite(schedulingRaw.leadTimeMinutes)
      ? schedulingRaw.leadTimeMinutes
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
    // Normalize tenant slug so callers can pass BUTTERCUPPANTRY and still resolve
    // data/tenants/buttercuppantry/* consistently.
    const rawTenant = ((searchParams.get('tenant') || '').trim() || 'demo').toLowerCase()
    const tenant = rawTenant === 'southforkgrille' ? 'south-fork-grille' : rawTenant

    const isPreview = process.env.VERCEL_ENV === 'preview'
    // Safety: never serve draft tenants on production
    if (!isPreview && tenant.endsWith('-draft')) {
      return NextResponse.json({ error: 'Not found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } })
    }

    const allowDraftFallback = isPreview
    const fallbackTenant = (allowDraftFallback && !tenant.endsWith('-draft')) ? `${tenant}-draft` : ''
    // Always prefer DB (Neon) so preview reflects live edits instantly; fallback to repo files

    // Independent live slug: force embedded JSON so live matches preview exactly and avoids any DB mojibake.
    // Tenant-scoped so it won't affect any other menus.
    if (tenant === 'independentbarandgrille') {
      let brand: Record<string, unknown> | null = null
      let theme: Record<string, unknown> | null = null
      let images: Record<string, unknown> | null = null
      let style: Record<string, unknown> | null = null
      let copy: Record<string, unknown> | null = null
      let orderingRaw: Record<string, unknown> | null = null
      try { brand = (await import('@/data/tenants/independentbarandgrille/brand.json')).default as Record<string, unknown> } catch {}
      try { theme = (await import('@/data/tenants/independentbarandgrille/theme.json')).default as Record<string, unknown> } catch {}
      try { images = (await import('@/data/tenants/independentbarandgrille/images.json')).default as Record<string, unknown> } catch {}
      try { style = (await import('@/data/tenants/independentbarandgrille/style.json')).default as Record<string, unknown> } catch {}
      try { copy = (await import('@/data/tenants/independentbarandgrille/copy.json')).default as Record<string, unknown> } catch {}
      // Ordering settings should still come from DB so we can enable it per-tenant without redeploying.
      if (process.env.DATABASE_URL) {
        try {
          const { prisma } = await import('@/lib/prisma').catch(() => ({ prisma: undefined as PrismaClient | undefined }))
          if (prisma) {
            const row = await prisma.tenant.findUnique({ where: { slug: tenant }, select: { settings: true } })
            const s = (row?.settings as Record<string, unknown>) || {}
            orderingRaw = (s.ordering as Record<string, unknown>) || null
          }
        } catch {}
      }
      let ordering = normalizeOrdering(orderingRaw)
      // Live POC toggle (env-driven): allow enabling ordering without DB edits for a specific tenant.
      if (isOrderingPocEnabledForTenant(tenant)) {
        ordering = { ...(ordering as Record<string, unknown>), enabled: true }
      }
      return NextResponse.json({ brand, theme, images: images || {}, style, copy, ordering }, { headers: { 'Cache-Control': 'no-store' } })
    }

    // Load DB settings first (if available)
    let dbBrand: Record<string, unknown> | null = null
    let dbTheme: Record<string, unknown> | null = null
    let dbImages: Record<string, unknown> | null = null
    let dbStyle: Record<string, unknown> | null = null
    let dbCopy: Record<string, unknown> | null = null
    let dbOrdering: Record<string, unknown> | null = null

    // Fallback (draft) DB settings
    let fbDbBrand: Record<string, unknown> | null = null
    let fbDbTheme: Record<string, unknown> | null = null
    let fbDbImages: Record<string, unknown> | null = null
    let fbDbStyle: Record<string, unknown> | null = null
    let fbDbCopy: Record<string, unknown> | null = null
    let fbDbOrdering: Record<string, unknown> | null = null
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
          dbOrdering = (s.ordering as Record<string, unknown>) || null

          // If any are missing, try draft tenant as fallback (DB) â€” preview only
          if (fallbackTenant && (!dbBrand || !dbTheme || !dbImages || !dbStyle || !dbCopy)) {
            const fbRow = await prisma.tenant.findUnique({ where: { slug: fallbackTenant }, select: { settings: true } })
            const fs = (fbRow?.settings as Record<string, unknown>) || {}
            fbDbTheme = (fs.theme as Record<string, unknown>) || null
            fbDbBrand = (fs.brand as Record<string, unknown>) || null
            fbDbImages = (fs.images as Record<string, unknown>) || null
            fbDbStyle = (fs.style as Record<string, unknown>) || null
            fbDbCopy = (fs.copy as Record<string, unknown>) || null
            fbDbOrdering = (fs.ordering as Record<string, unknown>) || null
          }
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
    // Filesystem fallback from draft tenant (preview only)
    const fbFsBrand = fallbackTenant ? await readJson(path.join(process.cwd(), 'data', 'tenants', fallbackTenant, 'brand.json')) : null
    const fbFsTheme = fallbackTenant ? await readJson(path.join(process.cwd(), 'data', 'tenants', fallbackTenant, 'theme.json')) : null
    const fbFsImages = fallbackTenant ? await readJson(path.join(process.cwd(), 'data', 'tenants', fallbackTenant, 'images.json')) : null
    const fbFsStyle = fallbackTenant ? await readJson(path.join(process.cwd(), 'data', 'tenants', fallbackTenant, 'style.json')) : null
    const fbFsCopy = fallbackTenant ? await readJson(path.join(process.cwd(), 'data', 'tenants', fallbackTenant, 'copy.json')) : null

    // Production bundling safety (tenant-scoped):
    // Vercel output file tracing may exclude dynamically-read tenant JSON files.
    // For the Independent live slug, include embedded JSON fallbacks so live matches preview exactly.
    let embeddedBrand: Record<string, unknown> | null = null
    let embeddedTheme: Record<string, unknown> | null = null
    let embeddedImages: Record<string, unknown> | null = null
    let embeddedStyle: Record<string, unknown> | null = null
    let embeddedCopy: Record<string, unknown> | null = null
    if (tenant === 'independentbarandgrille') {
      try { embeddedBrand = (await import('@/data/tenants/independentbarandgrille/brand.json')).default as Record<string, unknown> } catch {}
      try { embeddedTheme = (await import('@/data/tenants/independentbarandgrille/theme.json')).default as Record<string, unknown> } catch {}
      try { embeddedImages = (await import('@/data/tenants/independentbarandgrille/images.json')).default as Record<string, unknown> } catch {}
      try { embeddedStyle = (await import('@/data/tenants/independentbarandgrille/style.json')).default as Record<string, unknown> } catch {}
      try { embeddedCopy = (await import('@/data/tenants/independentbarandgrille/copy.json')).default as Record<string, unknown> } catch {}
    }

    const isNonEmpty = (obj: unknown) => !!(obj && typeof obj === 'object' && Object.keys(obj as Record<string, unknown>).length > 0)
    const hasName = (obj: unknown) => !!(obj && typeof (obj as Record<string, unknown>)['name'] === 'string' && ((obj as Record<string, unknown>)['name'] as string).trim() !== '')

    // Prefer DB only when it actually contains meaningful values; otherwise fall back to FS
    // Prefer live DB when non-empty, then live FS; if still missing, fall back to draft (DB then FS)
    const brand = (hasName(dbBrand) ? dbBrand : null)
      ?? (hasName(fsBrand) ? fsBrand : null)
      ?? (hasName(fbDbBrand) ? fbDbBrand : null)
      ?? fbFsBrand
      ?? embeddedBrand

    const theme = (isNonEmpty(dbTheme) ? dbTheme : null)
      ?? (isNonEmpty(fsTheme) ? fsTheme : null)
      ?? (isNonEmpty(fbDbTheme) ? fbDbTheme : null)
      ?? fbFsTheme
      ?? embeddedTheme

    // Images should MERGE across sources so DB can override but FS can provide defaults (important for demo).
    // Precedence (highest last): draft FS < draft DB < live FS < live DB
    const images = {
      ...(isNonEmpty(fbFsImages) ? (fbFsImages as Record<string, unknown>) : {}),
      ...(isNonEmpty(fbDbImages) ? (fbDbImages as Record<string, unknown>) : {}),
      ...(isNonEmpty(fsImages) ? (fsImages as Record<string, unknown>) : {}),
      ...(isNonEmpty(dbImages) ? (dbImages as Record<string, unknown>) : {}),
      ...(isNonEmpty(embeddedImages) ? embeddedImages : {}),
    }

    const style = (isNonEmpty(dbStyle) ? dbStyle : null)
      ?? (isNonEmpty(fsStyle) ? fsStyle : null)
      ?? (isNonEmpty(fbDbStyle) ? fbDbStyle : null)
      ?? fbFsStyle
      ?? embeddedStyle

    const copy = (isNonEmpty(dbCopy) ? dbCopy : null)
      ?? (isNonEmpty(fsCopy) ? fsCopy : null)
      ?? (isNonEmpty(fbDbCopy) ? fbDbCopy : null)
      ?? fbFsCopy
      ?? embeddedCopy

    let ordering = normalizeOrdering(dbOrdering ?? fbDbOrdering ?? null)
    // Preview-only POC: allow ordering for independent-draft without requiring DB settings.
    // This does NOT affect production and does NOT affect the live independentbarandgrille tenant.
    if (isPreview && tenant === 'independent-draft') {
      ordering = { ...(ordering as Record<string, unknown>), enabled: true }
    }
    // Live POC toggle (env-driven): allow enabling ordering without DB edits for specific tenants.
    if (isOrderingPocEnabledForTenant(tenant)) {
      ordering = { ...(ordering as Record<string, unknown>), enabled: true }
    }
    return NextResponse.json({ brand, theme, images, style, copy, ordering }, { headers: { 'Cache-Control': 'no-store' } })
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
    const tenant = (searchParams.get('tenant') || '').trim().toLowerCase()
    if (!tenant) return NextResponse.json({ error: 'Missing tenant' }, { status: 400 })

    const body = await request.json().catch(() => ({}))
    const nextBrand = body?.brand as Record<string, unknown> | undefined
    const nextImages = body?.images as Record<string, unknown> | undefined
    const nextStyle = body?.style as Record<string, unknown> | undefined
    const nextCopy = body?.copy as Record<string, unknown> | undefined
    const nextOrdering = body?.ordering as Record<string, unknown> | undefined

    if (!nextBrand && !nextImages && !nextStyle && !nextCopy && !nextOrdering) {
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
      ...(nextOrdering ? { ordering: normalizeOrdering(nextOrdering) } : {}),
    }

    await prisma.tenant.upsert({
      where: { slug: tenant },
      update: { settings: merged as InputJsonValue },
      create: { slug: tenant, name: tenant, settings: merged as InputJsonValue },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'save_error', detail }, { status: 500 })
  }
}



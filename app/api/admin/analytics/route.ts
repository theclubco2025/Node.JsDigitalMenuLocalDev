import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma'
import { readMenu } from '@/lib/data/menu'
import { generate } from '@/lib/ai/model'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const Query = z.object({
  tenant: z.string().optional(),
  days: z.coerce.number().int().min(1).max(365).optional(),
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
})

function safeJson(data: unknown) {
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
}

function hourInTz(d: Date, tz: string): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: '2-digit', hour12: false }).formatToParts(d)
    const h = parts.find(p => p.type === 'hour')?.value
    const n = h ? Number(h) : NaN
    return Number.isFinite(n) ? n : d.getHours()
  } catch {
    return d.getHours()
  }
}

function normalizeTenant(raw: string) {
  return (raw || '').trim().toLowerCase()
}

type InsightsJson = {
  highlights: string[]
  wasteRisks: string[]
  menuFixes: string[]
  upsellIdeas: string[]
  trainingNotes: string[]
}

async function computeAnalytics(args: { tenantSlug: string; tenantId: string; tenantName: string; start: Date; end: Date; days: number }) {
  const { tenantSlug, tenantId, tenantName, start, end, days } = args

  // Menu id→name mapping (helps turn AI matched IDs into readable labels)
  const itemNameById = new Map<string, string>()
  try {
    const menu = await readMenu(tenantSlug)
    for (const cat of menu.categories || []) {
      for (const it of cat.items || []) {
        if (typeof it?.id === 'string' && typeof it?.name === 'string') itemNameById.set(it.id, it.name)
      }
    }
  } catch {
    // ignore
  }

  const orders = await prisma.order.findMany({
    where: {
      tenantId,
      createdAt: { gte: start, lte: end },
      paidAt: { not: null },
    },
    orderBy: { createdAt: 'desc' },
    take: 2000,
    select: {
      id: true,
      createdAt: true,
      timezone: true,
      totalCents: true,
      tableNumber: true,
      items: {
        select: {
          id: true,
          name: true,
          quantity: true,
          unitPriceCents: true,
          note: true,
          addOns: true,
        },
      },
    },
  })

  const itemAgg = new Map<string, { name: string; qty: number; revenueCents: number; customCount: number }>()
  const customizations = new Map<string, number>()
  const dineInCount = orders.filter(o => Boolean((o.tableNumber || '').trim())).length
  const pickupCount = orders.length - dineInCount
  const hours = Array.from({ length: 24 }, () => 0)

  for (const o of orders) {
    const tz = (o.timezone || 'America/Los_Angeles').trim() || 'America/Los_Angeles'
    const h = hourInTz(o.createdAt, tz)
    hours[h] = (hours[h] || 0) + 1

    for (const it of o.items) {
      const key = `${it.name}`.trim() || it.id
      const prev = itemAgg.get(key) || { name: it.name, qty: 0, revenueCents: 0, customCount: 0 }
      prev.qty += it.quantity
      prev.revenueCents += it.unitPriceCents * it.quantity

      const hasNote = Boolean((it.note || '').trim())
      const addOnList = Array.isArray(it.addOns) ? it.addOns : null
      const hasAddOns = Boolean(addOnList && addOnList.length > 0)
      if (hasNote || hasAddOns) prev.customCount += 1
      itemAgg.set(key, prev)

      if (hasAddOns && addOnList) {
        for (const a of addOnList as Array<{ name?: unknown }>) {
          const n = String(a?.name || '').trim()
          if (!n) continue
          customizations.set(n, (customizations.get(n) || 0) + 1)
        }
      }
    }
  }

  const assistantEvents = await prisma.assistantEvent.findMany({
    where: { tenantSlug, createdAt: { gte: start, lte: end } },
    orderBy: { createdAt: 'desc' },
    take: 2000,
    select: {
      id: true,
      createdAt: true,
      category: true,
      question: true,
      matchedItemIds: true,
      fallback: true,
    },
  })

  const catCounts = new Map<string, number>()
  const keywordCounts = new Map<string, number>()
  const matchedItemCounts = new Map<string, number>()

  const trackKeyword = (k: string, q: string) => {
    if (q.includes(k)) keywordCounts.set(k, (keywordCounts.get(k) || 0) + 1)
  }

  for (const ev of assistantEvents) {
    const cat = String(ev.category || 'general').trim() || 'general'
    catCounts.set(cat, (catCounts.get(cat) || 0) + 1)

    const q = String(ev.question || '').toLowerCase()
    for (const k of ['gluten', 'celiac', 'dairy', 'lactose', 'nut', 'peanut', 'shellfish', 'allergy', 'spicy', 'price', 'vegan', 'vegetarian', 'wine', 'beer', 'cocktail']) {
      trackKeyword(k, q)
    }
    for (const id of ev.matchedItemIds || []) {
      const mid = String(id || '').trim()
      if (!mid) continue
      matchedItemCounts.set(mid, (matchedItemCounts.get(mid) || 0) + 1)
    }
  }

  const topItemsByQty = Array.from(itemAgg.values()).sort((a, b) => b.qty - a.qty).slice(0, 10)
  const topItemsByRevenue = Array.from(itemAgg.values()).sort((a, b) => b.revenueCents - a.revenueCents).slice(0, 10)
  const topCustomizations = Array.from(customizations.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count }))
  const topCats = Array.from(catCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([category, count]) => ({ category, count }))
  const topKeywords = Array.from(keywordCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([keyword, count]) => ({ keyword, count }))
  const topMatchedItems = Array.from(matchedItemCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, count]) => ({ id, name: itemNameById.get(id) || null, count }))

  return {
    ok: true as const,
    tenant: { slug: tenantSlug, name: tenantName },
    range: { start: start.toISOString(), end: end.toISOString(), days },
    orders: {
      totalPaidOrders: orders.length,
      dineInCount,
      pickupCount,
      topItemsByQty,
      topItemsByRevenue,
      topCustomizations,
      ordersByHour: hours,
    },
    assistant: {
      totalQuestions: assistantEvents.length,
      topCategories: topCats,
      topKeywords,
      topMatchedItems,
      sampleQuestions: assistantEvents.slice(0, 20).map(e => ({ createdAt: e.createdAt, category: e.category, question: e.question, fallback: e.fallback })),
    },
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) return NextResponse.json({ ok: false, error: 'DATABASE_URL required' }, { status: 501 })

    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

    const role = (session as unknown as { role?: string }).role || ''
    const tenantId = (session as unknown as { tenantId?: string | null }).tenantId || null

    const parsed = Query.safeParse({
      tenant: req.nextUrl.searchParams.get('tenant') || undefined,
      days: req.nextUrl.searchParams.get('days') || undefined,
      start: req.nextUrl.searchParams.get('start') || undefined,
      end: req.nextUrl.searchParams.get('end') || undefined,
    })
    if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid query' }, { status: 400 })

    let tenantSlug: string | null = normalizeTenant(parsed.data.tenant || '')
    if (role !== 'SUPER_ADMIN') {
      if (!tenantId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
      const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
      tenantSlug = t?.slug || null
    }
    if (!tenantSlug) return NextResponse.json({ ok: false, error: 'Tenant not found' }, { status: 404 })

    const days = parsed.data.days ?? 30
    const end = parsed.data.end ? new Date(parsed.data.end) : new Date()
    const start = parsed.data.start ? new Date(parsed.data.start) : new Date(end.getTime() - days * 24 * 60 * 60 * 1000)

    const tenantRow = await prisma.tenant.findUnique({ where: { slug: tenantSlug }, select: { id: true, name: true } })
    if (!tenantRow) return NextResponse.json({ ok: false, error: 'Tenant not found' }, { status: 404 })
    const computed = await computeAnalytics({
      tenantSlug,
      tenantId: tenantRow.id,
      tenantName: tenantRow.name,
      start,
      end,
      days,
    })
    return safeJson(computed)
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error)?.message || 'Analytics error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) return NextResponse.json({ ok: false, error: 'DATABASE_URL required' }, { status: 501 })

    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

    const role = (session as unknown as { role?: string }).role || ''
    const tenantId = (session as unknown as { tenantId?: string | null }).tenantId || null

    const body = await req.json().catch(() => ({}))
    const Body = z.object({
      tenant: z.string().optional(),
      days: z.coerce.number().int().min(1).max(365).optional(),
      start: z.string().datetime().optional(),
      end: z.string().datetime().optional(),
    })
    const parsed = Body.safeParse(body)
    if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })

    let tenantSlug: string | null = normalizeTenant(parsed.data.tenant || '')
    if (role !== 'SUPER_ADMIN') {
      if (!tenantId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
      const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
      tenantSlug = t?.slug || null
    }
    if (!tenantSlug) return NextResponse.json({ ok: false, error: 'Tenant not found' }, { status: 404 })

    const days = parsed.data.days ?? 30
    const end = parsed.data.end ? new Date(parsed.data.end) : new Date()
    const start = parsed.data.start ? new Date(parsed.data.start) : new Date(end.getTime() - days * 24 * 60 * 60 * 1000)

    const tenantRow = await prisma.tenant.findUnique({ where: { slug: tenantSlug }, select: { id: true, name: true } })
    if (!tenantRow) return NextResponse.json({ ok: false, error: 'Tenant not found' }, { status: 404 })

    const analyticsJson = await computeAnalytics({
      tenantSlug,
      tenantId: tenantRow.id,
      tenantName: tenantRow.name,
      start,
      end,
      days,
    })

    const sampleQs = (analyticsJson.assistant.sampleQuestions || []).slice(0, 30)

    const system = [
      'You are a restaurant operations analyst.',
      'You will be given structured analytics about a restaurant: orders and customer AI questions.',
      'Return JSON only with keys: highlights, wasteRisks, menuFixes, upsellIdeas, trainingNotes.',
      'Each key must be an array of concise bullet strings.',
      'Avoid mentioning personal data; speak generally.',
    ].join('\n')

    const user = JSON.stringify({
      tenant: analyticsJson.tenant,
      range: { start: start.toISOString(), end: end.toISOString() },
      orders: analyticsJson.orders,
      assistant: {
        totalQuestions: analyticsJson.assistant.totalQuestions,
        topCategories: analyticsJson.assistant.topCategories,
        topKeywords: analyticsJson.assistant.topKeywords,
        topMatchedItems: analyticsJson.assistant.topMatchedItems,
        sampleQuestions: sampleQs,
      },
    })

    // Require OpenAI/API keys (same behavior as assistant generator)
    const keys = (process.env.AI_KEYS || process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '').split(',').map(s => s.trim()).filter(Boolean)
    if (keys.length === 0) {
      return NextResponse.json({ ok: false, error: 'OPENAI_API_KEY (or AI_API_KEY/AI_KEYS) required for insights' }, { status: 501 })
    }

    const started = Date.now()
    const text = await generate({ model: process.env.AI_MODEL, system, user })
    const ms = Date.now() - started

    let insights: InsightsJson | null = null
    try {
      insights = JSON.parse(text) as InsightsJson
    } catch {
      insights = null
    }

    return safeJson({
      ok: true,
      tenant: analyticsJson.tenant,
      range: { start: start.toISOString(), end: end.toISOString(), days },
      latencyMs: ms,
      insights,
      raw: insights ? null : text,
    })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error)?.message || 'Insights error' }, { status: 500 })
  }
}


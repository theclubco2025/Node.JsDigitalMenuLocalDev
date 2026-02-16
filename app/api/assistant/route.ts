/* eslint-disable @typescript-eslint/no-unused-vars */
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getMenuForTenant, filterMenuByDiet, snippet } from '@/lib/data/menu'
import { buildPrompt } from '@/lib/ai/prompt'
import { generate } from '@/lib/ai/model'
import { resolveTenant } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { rateLimit, circuitIsOpen, recordFailure, recordSuccess } from './limit'
import type { MenuResponse } from '@/types/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function corsHeaders(origin?: string) {
  const o = origin || '*'
  return {
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Token',
    'Vary': 'Origin',
    'Cache-Control': 'no-store'
  }
}
function normalize(str: string): string {
  return (str || '').toLowerCase()
}

function canonicalTenantSlug(raw: string): string {
  const t = (raw || '').trim().toLowerCase()
  if (t === 'southforkgrille') return 'south-fork-grille'
  return t
}

function classifyAssistantCategory(query: string): string {
  const q = normalize(query)
  if (!q) return 'general'
  if (q.includes('allerg') || q.includes('gluten') || q.includes('celiac') || q.includes('dairy') || q.includes('lactose') || q.includes('nut') || q.includes('shellfish') || q.includes('soy') || q.includes('egg')) return 'allergens'
  if (q.includes('wine') || q.includes('beer') || q.includes('cocktail') || q.includes('drink') || q.includes('happy hour')) return 'drinks'
  if (q.includes('price') || q.includes('cost') || q.includes('$')) return 'pricing'
  if (q.includes('recommend') || q.includes('popular') || q.includes('best') || q.includes('favorite') || q.includes('suggest')) return 'recommendations'
  if (q.includes('spicy') || q.includes('heat')) return 'spice'
  if (q.includes('vegan') || q.includes('vegetarian') || q.includes('gluten-free') || q.includes('dairy-free') || q.includes('nut-free')) return 'diet'
  return 'general'
}

async function logAssistantEvent(args: {
  tenantSlug: string
  question: string
  answerSnippet: string | null
  category: string
  matchedItemIds: string[]
  latencyMs: number | null
  model: string | null
  fallback: boolean
}) {
  try {
    if (!process.env.DATABASE_URL) return
    await prisma.assistantEvent.create({
      data: {
        tenantSlug: args.tenantSlug,
        question: args.question.slice(0, 2000),
        answerSnippet: args.answerSnippet ? args.answerSnippet.slice(0, 1200) : null,
        category: args.category.slice(0, 80),
        matchedItemIds: args.matchedItemIds.slice(0, 30),
        latencyMs: args.latencyMs ?? null,
        model: args.model ?? null,
        fallback: args.fallback,
      },
      select: { id: true },
    })
  } catch {
    // best-effort; never break assistant
  }
}

function isWineQuery(query: string): boolean {
  const q = normalize(query)
  if (!q) return false
  const keywords = [
    'wine',
    'wines',
    'red wine',
    'white wine',
    'sparkling',
    'champagne',
    'prosecco',
    'rosé',
    'rose',
    'cabernet',
    'merlot',
    'pinot',
    'zinfandel',
    'malbec',
    'syrah',
    'shiraz',
    'sauvignon',
    'chardonnay',
    'riesling',
    'moscato',
    'vintage',
    'winery',
    'bottle',
    'by the glass',
    'pairing',
    'pair with',
  ]
  return keywords.some(k => q.includes(k))
}

function isWineCategoryName(name: string): boolean {
  const n = normalize(name)
  return n.includes('wine')
}

function isBeverageCategoryName(name: string): boolean {
  const n = normalize(name)
  return (
    n.includes('cocktail') ||
    n.includes('beer') ||
    n.includes('wine') ||
    n.includes('happy hour') ||
    n.includes('brunch') && n.includes('cocktail') ||
    n.includes('port wine') ||
    n.includes('dessert cocktails')
  )
}

function isDrinkQuery(query: string): boolean {
  const q = normalize(query)
  if (!q) return false
  const keywords = [
    'drink',
    'drinks',
    'cocktail',
    'cocktails',
    'beer',
    'draft',
    'bottled',
    'wine',
    'wines',
    'martini',
    'margarita',
    'old fashioned',
    'manhattan',
    'mule',
    'aperol',
    'spritz',
    'happy hour',
  ]
  return keywords.some(k => q.includes(k))
}

function wineListMode(query: string): 'summary' | 'full' {
  const q = normalize(query)
  if (!q) return 'summary'
  // Only dump the full list if explicitly requested.
  if (q.includes('all wines') || q.includes('full wine list') || q.includes('entire wine list') || q.includes('everything')) return 'full'
  if (q.includes('list all') || q.includes('show all')) return 'full'
  return 'summary'
}

function wineListResponse(menu: MenuResponse): string {
  const wineCats = (menu.categories || []).filter(c => isWineCategoryName(c.name))
  if (wineCats.length === 0) {
    return "I don't have an up-to-date wine list in this digital menu, so I can't list wines or prices. Please ask your server for today's wine selections."
  }

  const orderKey = (name: string) => {
    const n = normalize(name)
    const isHappy = n.includes('happy hour')
    const isWhite = n.includes('white')
    const isRed = n.includes('red')
    // Happy hour first, then white before red, then alpha
    return `${isHappy ? '0' : '1'}-${isWhite ? '0' : isRed ? '1' : '2'}-${n}`
  }

  const blocks = wineCats
    .slice()
    .sort((a, b) => orderKey(a.name).localeCompare(orderKey(b.name)))
    .map((c) => {
      const title = c.name
      const lines = (c.items || [])
        .filter(it => typeof it.price === 'number' && it.price > 0)
        .map(it => `- **${it.name}**${it.description ? ` — ${it.description}` : ''}${formatPrice(it.price) ? ` (${formatPrice(it.price)})` : ''}`)
      return [`${title}:`, ...lines].join('\n')
    })

  return `Here are the wines currently listed on our menu:\n\n${blocks.join('\n\n')}\n\nIf you don't see what you're looking for, please ask your server about additional selections.`
}

function wineSummaryResponse(menu: MenuResponse): string {
  const wineCats = (menu.categories || []).filter(c => isWineCategoryName(c.name))
  if (wineCats.length === 0) return wineListResponse(menu)

  const pick = (cNameIncludes: string, k: number) => {
    const c = wineCats.find(x => normalize(x.name).includes(cNameIncludes))
    const items = (c?.items || []).filter(it => typeof it.price === 'number' && it.price > 0).slice(0, k)
    return { name: c?.name || null, items }
  }

  const hhWhite = pick('happy hour', 0) // placeholder, we’ll pick more specifically below
  // Prefer specific buckets if present
  const happyWhite = wineCats.find(x => normalize(x.name).includes('happy hour') && normalize(x.name).includes('white'))
  const happyRed = wineCats.find(x => normalize(x.name).includes('happy hour') && normalize(x.name).includes('red'))
  const cockWhite = wineCats.find(x => normalize(x.name).includes('cocktails') && normalize(x.name).includes('white'))
  const cockRed = wineCats.find(x => normalize(x.name).includes('cocktails') && normalize(x.name).includes('red'))

  const takeSome = (cat: typeof wineCats[number] | undefined, k: number) =>
    (cat?.items || []).filter(it => typeof it.price === 'number' && it.price > 0).slice(0, k)

  const sections: Array<{ title: string; items: Array<{ name: string; description?: string; price: number }> }> = []
  if (happyWhite) sections.push({ title: happyWhite.name, items: takeSome(happyWhite, 4) })
  if (happyRed) sections.push({ title: happyRed.name, items: takeSome(happyRed, 4) })
  if (cockWhite) sections.push({ title: cockWhite.name, items: takeSome(cockWhite, 4) })
  if (cockRed) sections.push({ title: cockRed.name, items: takeSome(cockRed, 4) })
  if (sections.length === 0) {
    // fallback: first 2 wine categories, 4 each
    for (const c of wineCats.slice(0, 2)) sections.push({ title: c.name, items: takeSome(c, 4) })
  }

  const lines = sections.flatMap(s => [
    `${s.title}:`,
    ...s.items.map(it => `- **${it.name}**${it.description ? ` — ${it.description}` : ''}${formatPrice(it.price) ? ` (${formatPrice(it.price)})` : ''}`),
    '',
  ])

  return `We have a large wine list. Here are a few highlights (with prices):\n\n${lines.join('\n').trim()}\n\nTell me what you want (red/white, happy hour vs regular, and price range) or say “list all wines” if you want the full list.`
}

function wineItemResponse(menu: MenuResponse, query: string): string {
  const wineMenu: MenuResponse = { categories: (menu.categories || []).filter(c => isWineCategoryName(c.name)) }
  const matches = getTopMatches(wineMenu, query, 8)
  if (!matches.length) return wineListResponse(menu)

  // Prefer the strongest match; include other distinct priced matches too.
  const unique = new Map<string, typeof matches[number]>()
  for (const m of matches) {
    const key = `${m.catName}::${m.item.name}::${m.item.price}`
    if (!unique.has(key)) unique.set(key, m)
  }
  const top = Array.from(unique.values()).slice(0, 6)
  const lines = top.map(m => {
    const desc = m.item.description?.trim()
    const price = formatPrice(m.item.price)
    const parts = [
      `- **${m.item.name}**`,
      desc ? `— ${desc}` : '',
      price ? `(${price})` : '',
      `• ${m.catName}`,
    ].filter(Boolean)
    return parts.join(' ')
  })

  return `Here's what we have listed:\n\n${lines.join('\n')}\n\nIf you'd like, tell me whether you want red or white and your price range.`
}

function beverageSummaryResponse(menu: MenuResponse): string {
  const bevCats = (menu.categories || []).filter(c => isBeverageCategoryName(c.name))
  if (bevCats.length === 0) {
    return "I don't have drinks listed in this digital menu. Please ask your server for drink options."
  }

  const preferred = [
    'Happy Hour — Hand Crafted Cocktails',
    'Cocktails — Specialty Drinks',
    'Cocktails — Draft & Bottled Beer',
    'Happy Hour — White Wine',
    'Happy Hour — Red Wine',
    'Cocktails — White Wines',
    'Cocktails — Red Wines',
  ]

  const orderKey = (name: string) => {
    const idx = preferred.indexOf(name)
    return `${idx === -1 ? '9' : '0'}-${String(idx === -1 ? 99 : idx).padStart(2, '0')}-${normalize(name)}`
  }

  const topCats = bevCats.slice().sort((a, b) => orderKey(a.name).localeCompare(orderKey(b.name))).slice(0, 4)
  const blocks = topCats.map(c => {
    const items = (c.items || []).filter(it => typeof it.price === 'number' && it.price > 0).slice(0, 4)
    const lines = items.map(it => `- **${it.name}**${it.description ? ` — ${it.description}` : ''}${formatPrice(it.price) ? ` (${formatPrice(it.price)})` : ''}`)
    return [`${c.name}:`, ...lines].join('\n')
  })

  return `Here are a few drink options from our menu (with prices):\n\n${blocks.join('\n\n')}\n\nWant cocktails, beer, or wine? If wine, say red or white (and your price range).`
}

function scoreItem(query: string, name: string, description?: string, tags?: string[]): number {
  const q = normalize(query)
  if (!q) return 0
  const n = normalize(name)
  const d = normalize(description || '')
  const t = (tags || []).map(normalize)
  let s = 0
  if (n.includes(q)) s += 5
  if (d.includes(q)) s += 3
  if (t.some(tag => tag.includes(q))) s += 2
  // word-level partial matches
  const words = q.split(/\s+/).filter(Boolean)
  for (const w of words) {
    if (w.length < 3) continue
    if (n.includes(w)) s += 2
    if (d.includes(w)) s += 1
    if (t.some(tag => tag.includes(w))) s += 1
  }
  return s
}

function getTopMatches(menu: MenuResponse, query: string, k: number): Array<{ catId: string; catName: string; item: { id: string; name: string; description?: string; price: number; tags?: string[] }; score: number }> {
  if (!query?.trim()) return []
  const scored: Array<{ catId: string; catName: string; item: { id: string; name: string; description?: string; price: number; tags?: string[] }; score: number }> = []
  for (const c of menu.categories) {
    for (const it of c.items) {
      const s = scoreItem(query, it.name, it.description, it.tags)
      if (s > 0) scored.push({ catId: c.id, catName: c.name, item: it, score: s })
    }
  }
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, k)
}

function matchesToMenu(matches: ReturnType<typeof getTopMatches>, fallback: MenuResponse): MenuResponse {
  const byCat = new Map<string, { id: string; name: string; items: typeof matches[number]['item'][] }>()
  for (const r of matches) {
    if (!byCat.has(r.catId)) byCat.set(r.catId, { id: r.catId, name: r.catName, items: [] })
    byCat.get(r.catId)!.items.push(r.item)
  }
  const categories = Array.from(byCat.values())
  return categories.length > 0 ? { categories } : fallback
}

function formatPrice(price?: number): string {
  if (price == null || Number.isNaN(price)) return ''
  return `$${Number(price).toFixed(2)}`
}

function buildFallback(matches: ReturnType<typeof getTopMatches>, query: string): string {
  if (!matches.length) {
    return `I'm still syncing menu details. Try asking about a specific dish or ingredient.`
  }
  const q = normalize(query)
  const exact = matches.find(m => {
    const name = normalize(m.item.name)
    return name.includes(q) || q.includes(name)
  }) || matches[0]
  const desc = exact.item.description?.trim()
  const price = formatPrice(exact.item.price)
  const pricePart = price ? ` It's priced at ${price}.` : ''
  const base = `${exact.item.name}${desc ? `: ${desc}` : '.'}${pricePart}`.trim()
  const others = matches.filter(m => m !== exact).slice(0, 3)
  if (!others.length) return base
  const otherText = others.map(m => `${m.item.name}${formatPrice(m.item.price) ? ` (${formatPrice(m.item.price)})` : ''}`).join(', ')
  return `${base}
Other matches: ${otherText}.`
}

/*
interface MenuContext {
  categories: Array<{
    id: string
    name: string
    items: Array<{
      id: string
      name: string
      description: string
      price: number
      tags: string[]
      calories?: number
      allergens?: string[]
      spiceLevel?: number
    }>
  }>
  specials?: Array<{
    name: string
    description: string
    price?: number
  }>
  totalItems: number
}

interface CustomerMemory {
  visitCount: number
  favoriteItems: string[]
  dietaryRestrictions: string[]
  spicePreference?: string
  lastOrderItems?: string[]
  priceRange?: 'budget' | 'mid' | 'premium'
  conversationHistory: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
  }>
}

interface TenantProfile {
  name: string
  cuisine: string
  brandVoice: 'upscale' | 'casual' | 'family' | 'trendy' | 'traditional'
  specialty: string
  priceRange: string
  atmosphere: string
  locationContext?: string
}

*/

// Single multi-tenant assistant endpoint (LLaMA-ready)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const query: string = body?.query || ''
    const providedTenant: string | undefined = body?.tenantId
    const filters = body?.filters || {}

    if (!query.trim()) {
      return NextResponse.json({ ok: false, message: 'Missing query' }, { status: 400 })
    }

    const requestStarted = Date.now()
    const tenantId = providedTenant || resolveTenant(request.url)
    const canonical = canonicalTenantSlug(tenantId)
    const isSouthFork = canonical === 'south-fork-grille'
    // South Fork only: always load menu/theme from canonical tenant slug so AI matches live menu exactly.
    const dataTenantId = isSouthFork ? canonical : tenantId

    // Load menu and apply diet filters
    const menu = await getMenuForTenant(dataTenantId)
    const filtered = filterMenuByDiet(menu, {
      vegetarian: !!filters.vegetarian,
      vegan: !!filters.vegan,
      noGlutenListed: !!filters.noGlutenListed,
      noDairyListed: !!filters.noDairyListed,
      noNutsListed: !!filters.noNutsListed,
      glutenFree: !!filters.glutenFree,
      dairyFree: !!filters.dairyFree,
      nutFree: !!filters.nutFree,
    })
    // South Fork prod-guardrail: any wine-related question (including specific wine names) should be deterministic from menu data (no hallucinations).
    if (isSouthFork) {
      const wineMenu: MenuResponse = { categories: (filtered.categories || []).filter(c => isWineCategoryName(c.name)) }
      const isWineList = isWineQuery(query)
      // Disambiguation: only treat as a specific-wine query if wine matches beat food matches.
      const nonWineMenu: MenuResponse = { categories: (filtered.categories || []).filter(c => !isWineCategoryName(c.name)) }
      const bestFood = getTopMatches(nonWineMenu, query, 3)[0]?.score ?? 0
      const bestWine = getTopMatches(wineMenu, query, 3)[0]?.score ?? 0
      const isWineItem = !isWineList && bestWine >= 6 && bestWine > bestFood

      if (isWineList || isWineItem) {
        const text = isWineItem
          ? wineItemResponse(filtered, query)
          : (wineListMode(query) === 'full' ? wineListResponse(filtered) : wineSummaryResponse(filtered))
        await logAssistantEvent({
          tenantSlug: canonical,
          question: query,
          answerSnippet: text,
          category: classifyAssistantCategory(query),
          matchedItemIds: [],
          latencyMs: Date.now() - requestStarted,
          model: process.env.AI_MODEL || null,
          fallback: true,
        })
        return NextResponse.json(
          { ok: true, tenantId, text, fallback: true },
          { headers: corsHeaders(request.headers.get('origin') || '*') }
        )
      }

      // South Fork: handle broader drink questions deterministically so we never rely on limited MENU SNAPSHOT.
      const isDrinkIntent = isDrinkQuery(query)
      if (isDrinkIntent) {
        const text = beverageSummaryResponse(filtered)
        await logAssistantEvent({
          tenantSlug: canonical,
          question: query,
          answerSnippet: text,
          category: classifyAssistantCategory(query),
          matchedItemIds: [],
          latencyMs: Date.now() - requestStarted,
          model: process.env.AI_MODEL || null,
          fallback: true,
        })
        return NextResponse.json(
          { ok: true, tenantId, text, fallback: true },
          { headers: corsHeaders(request.headers.get('origin') || '*') }
        )
      }
    }

    const matches = getTopMatches(filtered, query, 18)
    const focused = matchesToMenu(matches, filtered)
    const menuSnippet = snippet(focused, 1000)
    const preview = matchesToMenu(matches.slice(0, 6), filtered)
    const previewSnippet = snippet(preview, 24)
    const fallbackText = previewSnippet && previewSnippet.trim().length > 0
      ? buildFallback(matches.slice(0, 4), query)
      : `I'm still syncing menu details. Try asking about a specific dish or ingredient.`

    // Load tenant meta from theme.json if available
    const { promises: fs } = await import('fs')
    const path = await import('path')
    const themePath = path.join(process.cwd(), 'data', 'tenants', dataTenantId, 'theme.json')
    let restaurantName = 'Our Restaurant'
    let tone = 'casual'
    try {
      const themeRaw = await fs.readFile(themePath, 'utf8')
      const theme = JSON.parse(themeRaw)
      restaurantName = theme?.name || restaurantName
      tone = theme?.tone || tone
    } catch {}

    const { system, user } = buildPrompt({
      tenantId: dataTenantId,
      restaurantName,
      tone,
      menuSnippet,
      userQuery: query,
      filters,
    })

    const systemWithTenantGuards = isSouthFork
      ? `${system}\n\nSouth Fork guardrails:\n- Never invent or infer any wine list, wineries, varietals, vintages, pours, or wine prices.\n- If asked about wine and it is not explicitly present in the MENU SNAPSHOT, say it is not listed and advise asking the server.\n- For pairings, you may give general flavor guidance only (no specific wine names) unless explicitly present in the MENU SNAPSHOT.`
      : system

    // Rate limit and circuit breaker guards
    if (!rateLimit(tenantId)) {
      return NextResponse.json({ ok: false, message: 'Too many requests. Please slow down.' }, { status: 429 })
    }
    if (circuitIsOpen(tenantId)) {
      return NextResponse.json({ ok: false, message: 'Assistant temporarily unavailable. Please try again.' }, { status: 503 })
    }

    // Guard if provider requires keys and missing; enable local fallback when allowed
    if ((process.env.AI_PROVIDER || 'compatible') !== 'ollama') {
      const keys = (process.env.AI_KEYS || process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '').split(',').map(s=>s.trim()).filter(Boolean)
      if (keys.length === 0) {
        // Fallback: simple retrieval-only answer when no keys (returns top-k menu items)
        await logAssistantEvent({
          tenantSlug: canonical,
          question: query,
          answerSnippet: fallbackText,
          category: classifyAssistantCategory(query),
          matchedItemIds: matches.slice(0, 8).map((m) => String((m as unknown as { item?: { id?: unknown } }).item?.id || '')).filter(Boolean),
          latencyMs: Date.now() - requestStarted,
          model: process.env.AI_MODEL || null,
          fallback: true,
        })
        return NextResponse.json({ ok: true, tenantId, text: fallbackText, fallback: true }, { headers: corsHeaders(request.headers.get('origin') || '*') })
      }
    }

    const started = Date.now()
    try {
      const text = await generate({ model: process.env.AI_MODEL, system: systemWithTenantGuards, user })
      recordSuccess(tenantId)
      const ms = Date.now() - started
      console.log(`[assistant] tenant=${tenantId} ok latency=${ms}ms`)
      await logAssistantEvent({
        tenantSlug: canonical,
        question: query,
        answerSnippet: text,
        category: classifyAssistantCategory(query),
        matchedItemIds: matches.slice(0, 12).map((m) => String((m as unknown as { item?: { id?: unknown } }).item?.id || '')).filter(Boolean),
        latencyMs: ms,
        model: process.env.AI_MODEL || null,
        fallback: false,
      })
      return NextResponse.json({ ok: true, tenantId, text }, { headers: corsHeaders(request.headers.get('origin') || '*') })
    } catch (e) {
      recordFailure(tenantId)
      const ms = Date.now() - started
      const msg = (e as Error)?.message || ''
      console.warn(`[assistant] tenant=${tenantId} fail latency=${ms}ms`, e)
      if (msg.includes('401')) {
        return NextResponse.json({ ok: false, message: 'AI provider rejected credentials (401). Check AI_API_KEY/OPENAI_API_KEY and AI_MODEL.' }, { status: 200, headers: corsHeaders(request.headers.get('origin') || '*') })
      }
      if (msg.includes('404')) {
        return NextResponse.json({ ok: false, message: 'Model not found (404). Set AI_MODEL to a model your account supports.' }, { status: 200, headers: corsHeaders(request.headers.get('origin') || '*') })
      }
      return NextResponse.json({ ok: false, message: 'Assistant temporarily unavailable. Please try again.' }, { status: 200, headers: corsHeaders(request.headers.get('origin') || '*') })
    }
  } catch (e) {
    console.error('Assistant error:', e)
    return NextResponse.json({ ok: false, message: 'Assistant error' }, { status: 500 })
  }
}

/*
// Unused helpers (reference only). Commented out to unblock typecheck/build.
async function getTenantProfile(tenantSlug: string): Promise<TenantProfile | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: {
      name: true,
      settings: true
    }
  })

  if (!tenant) return null

  const settings = tenant.settings as any || {}
  
  return {
    name: tenant.name,
    cuisine: settings.cuisine || 'contemporary',
    brandVoice: settings.brandVoice || 'casual',
    specialty: settings.specialty || 'fresh, quality ingredients',
    priceRange: settings.priceRange || 'moderate',
    atmosphere: settings.atmosphere || 'welcoming',
    locationContext: settings.locationContext
  }
}

async function getMenuContext(tenantSlug: string): Promise<MenuContext | null> {
  const menu = await prisma.menu.findFirst({
    where: { tenant: { slug: tenantSlug } },
    include: {
      categories: {
        include: {
          items: {
            where: { available: true },
            include: { tags: true }
          }
        }
      }
    }
  })

  if (!menu) return null

  const categories = menu.categories.map(category => ({
    id: category.id,
    name: category.name,
    items: category.items.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      tags: item.tags.map(t => t.tag),
      calories: item.calories,
      // Extract allergens from tags
      allergens: item.tags.map(t => t.tag).filter(tag => 
        ['nuts', 'dairy', 'gluten', 'eggs', 'shellfish', 'soy'].some(allergen => 
          tag.toLowerCase().includes(allergen)
        )
      )
    }))
  }))

  return {
    categories,
    totalItems: categories.reduce((sum, cat) => sum + cat.items.length, 0),
    specials: await getCurrentSpecials(tenantSlug)
  }
}

async function getCustomerMemory(tenantSlug: string, fingerprint?: string): Promise<CustomerMemory> {
  if (!fingerprint) {
    return {
      visitCount: 1,
      favoriteItems: [],
      dietaryRestrictions: [],
      conversationHistory: []
    }
  }

  const session = await prisma.customerSession.findFirst({
    where: {
      tenant: { slug: tenantSlug },
      customerFingerprint: fingerprint,
      lastVisit: {
        // Active session within last 24 hours
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    },
    include: {
      conversationHistory: {
        orderBy: { timestamp: 'desc' },
        take: 10 // Recent conversation context
      }
    }
  })

  if (!session) {
    return {
      visitCount: 1,
      favoriteItems: [],
      dietaryRestrictions: [],
      conversationHistory: []
    }
  }

  const prefs = session.preferences as any || {}
  
  return {
    visitCount: prefs.visitFrequency || 1,
    favoriteItems: prefs.favoriteItems || [],
    dietaryRestrictions: prefs.dietaryRestrictions || [],
    spicePreference: prefs.spicePreference,
    lastOrderItems: prefs.lastOrderItems,
    priceRange: prefs.priceRange,
    conversationHistory: session.conversationHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.message,
      timestamp: msg.timestamp
    }))
  }
}

async function generateAIResponse({
  userMessage,
  tenantProfile,
  menuContext,
  customerMemory
}: {
  userMessage: string
  tenantProfile: TenantProfile
  menuContext: MenuContext
  customerMemory: CustomerMemory
}): Promise<string> {

  const systemPrompt = buildSystemPrompt(tenantProfile, menuContext, customerMemory)
  const contextPrompt = buildContextPrompt(customerMemory, menuContext)
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Cost-effective for restaurant use cases
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: contextPrompt },
        ...customerMemory.conversationHistory.slice(-6).map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: "user", content: userMessage }
      ],
      max_tokens: 400,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    })

    const response = completion.choices[0]?.message?.content
    
    if (!response || response.trim().length === 0) {
      return generateFallbackResponse()
    }

    // Validate response is menu-related
    if (isResponseOnTopic(response, menuContext, tenantProfile)) {
      return response.trim()
    } else {
      return "I'm here to help you with our menu! What would you like to know about our dishes?"
    }

  } catch (error) {
    console.error('OpenAI API error:', error)
    return generateFallbackResponse()
  }
}
*/

export async function GET(request: NextRequest) {
  try {
    const provider = (process.env.AI_PROVIDER || 'compatible').toLowerCase()
    if (provider !== 'ollama') {
      const hasKey = Boolean((process.env.AI_KEYS || process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '').trim())
      // When missing keys, expose that assistant is in fallback (enabled) mode
      if (!hasKey) return NextResponse.json({ ok: true, fallback: true }, { headers: corsHeaders(request.headers.get('origin') || '*') })
    }
    return NextResponse.json({ ok: true }, { headers: corsHeaders(request.headers.get('origin') || '*') })
  } catch (e) {
    console.error('Assistant GET error:', e)
    return NextResponse.json({ ok: false, message: 'Assistant temporarily unavailable. Please try again.' }, { status: 200, headers: corsHeaders(request.headers.get('origin') || '*') })
  }
}

// CORS preflight support to avoid 405 on OPTIONS
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({ ok: true }, { headers: corsHeaders(request.headers.get('origin') || '*') })
}

// Explicit HEAD handler to avoid 405 from HEAD checks
export async function HEAD(request: NextRequest) {
  const headers = corsHeaders(request.headers.get('origin') || '*')
  return new NextResponse(null, { headers })
}
/*
// Additional unused helpers (kept for future use). Commented out for build cleanliness.
function buildSystemPrompt(tenantProfile: TenantProfile, menuContext: MenuContext, customerMemory: CustomerMemory): string {
  const brandVoiceInstructions = getBrandVoiceInstructions(tenantProfile.brandVoice)
  const menuSummary = buildMenuSummary(menuContext)
  const customerContext = buildCustomerContext(customerMemory)

  return `You are the knowledgeable AI assistant for ${tenantProfile.name}, a ${tenantProfile.cuisine} restaurant specializing in ${tenantProfile.specialty}.

BRAND VOICE & TONE:
${brandVoiceInstructions}

RESTAURANT CONTEXT:
- Cuisine: ${tenantProfile.cuisine}
- Specialty: ${tenantProfile.specialty}
- Price Range: ${tenantProfile.priceRange}
- Atmosphere: ${tenantProfile.atmosphere}
${tenantProfile.locationContext ? `- Location: ${tenantProfile.locationContext}` : ''}

CURRENT MENU OVERVIEW:
${menuSummary}

CUSTOMER CONTEXT:
${customerContext}

CORE RESPONSIBILITIES:
1. Help customers explore and understand our menu
2. Provide detailed information about ingredients, preparation, allergens
3. Make personalized recommendations based on preferences and history
4. Answer questions about dietary accommodations
5. Share enthusiasm for our food while being helpful and informative

CONVERSATION GUIDELINES:
- Stay focused on menu items, ingredients, preparation, and dining experience
- Use the customer's history to make relevant suggestions
- Be specific about ingredients and preparation methods
- Mention prices when discussing items
- Acknowledge dietary restrictions and suggest alternatives
- Decline non-menu topics politely: "I'm here to help with our menu! What dish interests you?"

STRICT BOUNDARIES:
- Only discuss food, drinks, menu items, ingredients, and restaurant services
- Do not provide cooking recipes or instructions
- Do not discuss other restaurants or competitors  
- Do not provide medical advice about food allergies (suggest speaking with staff)
- Do not take orders or process payments (guide them to order with staff)

Remember: You represent ${tenantProfile.name} - be proud of our food and eager to help customers have a great dining experience!`
}

function getBrandVoiceInstructions(brandVoice: string): string {
  const voiceMap = {
    upscale: "Professional, refined, and sophisticated. Use elegant language, emphasize quality and craftsmanship. Be knowledgeable about wine pairings and preparation techniques.",
    casual: "Friendly, approachable, and conversational. Use warm, welcoming language. Be enthusiastic but not overly formal. Focus on comfort and enjoyment.",
    family: "Warm, inclusive, and patient. Use simple, clear language. Be especially helpful with children's preferences and family dining needs.",
    trendy: "Hip, contemporary, and energetic. Use current language and be excited about new dishes and seasonal ingredients. Emphasize what's fresh and popular.",
    traditional: "Respectful, classic, and authentic. Honor traditional recipes and methods. Be knowledgeable about cultural food history and significance."
  }
  
  return voiceMap[brandVoice as keyof typeof voiceMap] || voiceMap.casual
}

function buildMenuSummary(menuContext: MenuContext): string {
  const categorySummaries = menuContext.categories.map(category => {
    const topItems = category.items.slice(0, 3).map(item => 
      `${item.name} ($${item.price})`
    ).join(', ')
    
    return `${category.name} (${category.items.length} items): ${topItems}${category.items.length > 3 ? '...' : ''}`
  }).join('\n')

  return `We have ${menuContext.totalItems} items across ${menuContext.categories.length} categories:
${categorySummaries}`
}

function buildCustomerContext(customerMemory: CustomerMemory): string {
  let context = ''
  
  if (customerMemory.visitCount > 1) {
    context += `Returning customer (${customerMemory.visitCount} visits). `
  } else {
    context += 'New customer. '
  }
  
  if (customerMemory.favoriteItems.length > 0) {
    context += `Previous favorites: ${customerMemory.favoriteItems.slice(0, 3).join(', ')}. `
  }
  
  if (customerMemory.dietaryRestrictions.length > 0) {
    context += `Dietary considerations: ${customerMemory.dietaryRestrictions.join(', ')}. `
  }
  
  if (customerMemory.spicePreference) {
    context += `Spice preference: ${customerMemory.spicePreference}. `
  }
  
  if (customerMemory.lastOrderItems?.length) {
    context += `Last order included: ${customerMemory.lastOrderItems.slice(0, 2).join(', ')}. `
  }

  return context || 'No previous interaction history.'
}

function buildContextPrompt(customerMemory: CustomerMemory, menuContext: MenuContext): string {
  const now = new Date()
  const hour = now.getHours()
  const timeContext = hour < 11 ? 'morning' : hour < 16 ? 'afternoon' : 'evening'
  
  let prompt = `Current time: ${timeContext}. `
  
  if (menuContext.specials?.length) {
    prompt += `Today's specials: ${menuContext.specials.map(s => s.name).join(', ')}. `
  }
  
  // Add recent conversation context if available
  if (customerMemory.conversationHistory.length > 0) {
    const recentExchange = customerMemory.conversationHistory.slice(0, 2)
    prompt += `Recent conversation context: ${recentExchange.map(msg => 
      `${msg.role}: ${msg.content}`
    ).join(' | ')} `
  }
  
  return prompt
}

function isResponseOnTopic(response: string, menuContext: MenuContext, tenantProfile: TenantProfile): boolean {
  const menuKeywords = [
    ...menuContext.categories.flatMap(cat => [
      cat.name.toLowerCase(),
      ...cat.items.flatMap(item => [
        ...item.name.toLowerCase().split(' '),
        ...item.tags.map(tag => tag.toLowerCase())
      ])
    ]),
    'menu', 'dish', 'food', 'drink', 'price', 'ingredient', 'allergen',
    'vegetarian', 'vegan', 'gluten', 'spicy', 'recommend', 'popular'
  ]
  
  const responseWords = response.toLowerCase().split(/\s+/)
  const relevantWords = responseWords.filter(word => 
    menuKeywords.some(keyword => keyword.includes(word) || word.includes(keyword))
  )
  
  // Consider on-topic if at least 10% of words are menu-related
  return relevantWords.length / responseWords.length >= 0.1
}

async function updateCustomerMemory(
  tenantSlug: string,
  fingerprint: string,
  userMessage: string,
  aiResponse: string,
  menuContext: MenuContext
) {
  if (!fingerprint) return

  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } })
  if (!tenant) return

  // Find or create session
  let session = await prisma.customerSession.findFirst({
    where: {
      tenantId: tenant.id,
      customerFingerprint: fingerprint
    }
  })

  if (!session) {
    session = await prisma.customerSession.create({
      data: {
        tenantId: tenant.id,
        customerFingerprint: fingerprint,
        preferences: { visitFrequency: 1 },
        lastVisit: new Date()
      }
    })
  }

  // Update conversation history
  await Promise.all([
    prisma.conversationMessage.create({
      data: {
        sessionId: session.id,
        role: 'user',
        message: userMessage,
        timestamp: new Date()
      }
    }),
    prisma.conversationMessage.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        message: aiResponse,
        timestamp: new Date()
      }
    })
  ])

  // Extract and update preferences
  await updatePreferences(session.id, userMessage, aiResponse, menuContext)
}

async function updatePreferences(
  sessionId: string,
  userMessage: string,
  aiResponse: string,
  menuContext: MenuContext
) {
  const session = await prisma.customerSession.findUnique({ where: { id: sessionId } })
  if (!session) return

  const currentPrefs = session.preferences as any || {}
  const updates: any = {
    visitFrequency: (currentPrefs.visitFrequency || 0) + 1,
    lastInteraction: new Date().toISOString()
  }

  // Extract dietary preferences
  const dietaryKeywords = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'paleo', 'nut-free']
  const mentionedDietary = dietaryKeywords.filter(keyword =>
    userMessage.toLowerCase().includes(keyword) || aiResponse.toLowerCase().includes(keyword)
  )
  
  if (mentionedDietary.length > 0) {
    updates.dietaryRestrictions = [...new Set([
      ...(currentPrefs.dietaryRestrictions || []),
      ...mentionedDietary
    ])]
  }

  // Extract mentioned items as potential favorites
  const allItems = menuContext.categories.flatMap(cat => cat.items)
  const mentionedItems = allItems.filter(item =>
    userMessage.toLowerCase().includes(item.name.toLowerCase()) ||
    aiResponse.toLowerCase().includes(item.name.toLowerCase())
  ).map(item => item.name)

  if (mentionedItems.length > 0) {
    updates.favoriteItems = [...new Set([
      ...(currentPrefs.favoriteItems || []).slice(-8), // Keep last 8 favorites
      ...mentionedItems
    ])]
  }

  // Extract spice preference
  const spiceKeywords = {
    'mild': ['mild', 'not spicy', 'no spice'],
    'medium': ['medium spice', 'some heat'],
    'hot': ['spicy', 'hot', 'extra spicy', 'very spicy']
  }

  Object.entries(spiceKeywords).forEach(([level, keywords]) => {
    if (keywords.some(keyword => userMessage.toLowerCase().includes(keyword))) {
      updates.spicePreference = level
    }
  })

  await prisma.customerSession.update({
    where: { id: sessionId },
    data: { preferences: { ...currentPrefs, ...updates } }
  })
}

function generateRecommendations(
  menuContext: MenuContext,
  customerMemory: CustomerMemory,
  userMessage: string
): Array<{ name: string; reason: string; price: number }> {
  const allItems = menuContext.categories.flatMap(cat => cat.items)
  const recommendations: Array<{ name: string; reason: string; price: number }> = []
  
  // Based on favorites
  if (customerMemory.favoriteItems.length > 0) {
    const favorite = customerMemory.favoriteItems[0]
    const similarItems = allItems.filter(item => 
      item.name !== favorite &&
      (item.tags.some(tag => 
        allItems.find(i => i.name === favorite)?.tags.includes(tag)
      ) || Math.random() > 0.7) // Simple similarity + randomness
    ).slice(0, 2)
    
    similarItems.forEach(item => {
      recommendations.push({
        name: item.name,
        reason: `Since you enjoyed ${favorite}`,
        price: item.price
      })
    })
  }
  
  // Based on dietary restrictions
  if (customerMemory.dietaryRestrictions.length > 0) {
    const dietaryMatches = allItems.filter(item =>
      customerMemory.dietaryRestrictions.some(restriction =>
        item.tags.some(tag => tag.toLowerCase().includes(restriction.toLowerCase()))
      )
    ).slice(0, 2)
    
    dietaryMatches.forEach(item => {
      recommendations.push({
        name: item.name,
        reason: `Perfect for ${customerMemory.dietaryRestrictions[0]} preferences`,
        price: item.price
      })
    })
  }
  
  return recommendations.slice(0, 3) // Max 3 recommendations
}

async function getCurrentSpecials(tenantSlug: string) {
  // TODO: Implement daily specials system
  return []
}

function generateFallbackResponse(): string {
  const fallbacks = [
    "I'm here to help you explore our delicious menu! What type of dish are you in the mood for?",
    "Let me help you discover something amazing from our menu. Are you looking for something specific?",
    "I'd love to guide you through our menu options. What sounds good to you today?",
    "Our menu has so many great options! Tell me what kind of flavors you're craving.",
    "I'm excited to help you find the perfect dish! What are you in the mood for?"
  ]
  
  return fallbacks[Math.floor(Math.random() * fallbacks.length)]
}
*/

/* eslint-disable @typescript-eslint/no-unused-vars */
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getMenuForTenant, filterMenuByDiet, snippet } from '@/lib/data/menu'
import { buildPrompt } from '@/lib/ai/prompt'
import { generate } from '@/lib/ai/model'
import { resolveTenant } from '@/lib/tenant'
import { rateLimit, circuitIsOpen, recordFailure, recordSuccess } from './limit'
import type { MenuResponse } from '@/types/api'

export const runtime = 'nodejs'

function normalize(str: string): string {
  return (str || '').toLowerCase()
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

function topKMenu(menu: MenuResponse, query: string, k: number): MenuResponse {
  if (!query?.trim()) return menu
  const scored: Array<{ catId: string; catName: string; item: { id: string; name: string; description?: string; price: number; tags?: string[] }; score: number }> = []
  for (const c of menu.categories) {
    for (const it of c.items) {
      const s = scoreItem(query, it.name, it.description, it.tags)
      if (s > 0) scored.push({ catId: c.id, catName: c.name, item: it, score: s })
    }
  }
  scored.sort((a, b) => b.score - a.score)
  const chosen = scored.slice(0, k)
  const byCat = new Map<string, { id: string; name: string; items: { id: string; name: string; description?: string; price: number; tags?: string[] }[] }>()
  for (const r of chosen) {
    if (!byCat.has(r.catId)) byCat.set(r.catId, { id: r.catId, name: r.catName, items: [] })
    byCat.get(r.catId)!.items.push(r.item)
  }
  const categories = Array.from(byCat.values())
  return categories.length > 0 ? { categories } : menu
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

    const tenantId = providedTenant || resolveTenant(request.url)

    // Load menu and apply diet filters
    const menu = await getMenuForTenant(tenantId)
    const filtered = filterMenuByDiet(menu, {
      vegan: !!filters.vegan,
      glutenFree: !!filters.glutenFree,
      dairyFree: !!filters.dairyFree,
    })
    // Retrieval: rank items by query relevance and build a focused context
    const focused = topKMenu(filtered, query, 18)
    const menuSnippet = snippet(focused, 1000)

    // Load tenant meta from theme.json if available
    const { promises: fs } = await import('fs')
    const path = await import('path')
    const themePath = path.join(process.cwd(), 'data', 'tenants', tenantId, 'theme.json')
    let restaurantName = 'Our Restaurant'
    let tone = 'casual'
    try {
      const themeRaw = await fs.readFile(themePath, 'utf8')
      const theme = JSON.parse(themeRaw)
      restaurantName = theme?.name || restaurantName
      tone = theme?.tone || tone
    } catch {}

    const { system, user } = buildPrompt({
      tenantId,
      restaurantName,
      tone,
      menuSnippet,
      userQuery: query,
      filters,
    })

    // Rate limit and circuit breaker guards
    if (!rateLimit(tenantId)) {
      return NextResponse.json({ ok: false, message: 'Too many requests. Please slow down.' }, { status: 429 })
    }
    if (circuitIsOpen(tenantId)) {
      return NextResponse.json({ ok: false, message: 'Assistant temporarily unavailable. Please try again.' }, { status: 503 })
    }

    // Guard if provider requires keys and missing
    if ((process.env.AI_PROVIDER || 'compatible') !== 'ollama') {
      const keys = (process.env.AI_KEYS || process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '').split(',').map(s=>s.trim()).filter(Boolean)
      if (keys.length === 0) {
        return NextResponse.json({ ok: false, message: 'Assistant disabled in dev' }, { status: 501 })
      }
    }

    const started = Date.now()
    try {
      const text = await generate({ model: process.env.AI_MODEL, system, user })
      recordSuccess(tenantId)
      const ms = Date.now() - started
      console.log(`[assistant] tenant=${tenantId} ok latency=${ms}ms`)
      return NextResponse.json({ ok: true, tenantId, text }, { headers: { 'Cache-Control': 'no-store' } })
    } catch (e) {
      recordFailure(tenantId)
      const ms = Date.now() - started
      const msg = (e as Error)?.message || ''
      console.warn(`[assistant] tenant=${tenantId} fail latency=${ms}ms`, e)
      if (msg.includes('401')) {
        return NextResponse.json({ ok: false, message: 'AI provider rejected credentials (401). Check AI_API_KEY/OPENAI_API_KEY and AI_MODEL.' }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
      }
      if (msg.includes('404')) {
        return NextResponse.json({ ok: false, message: 'Model not found (404). Set AI_MODEL to a model your account supports.' }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
      }
      return NextResponse.json({ ok: false, message: 'Assistant temporarily unavailable. Please try again.' }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
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

export async function GET() {
  try {
    const provider = (process.env.AI_PROVIDER || 'compatible').toLowerCase()
    if (provider !== 'ollama') {
      const hasKey = Boolean((process.env.AI_KEYS || process.env.AI_API_KEY || process.env.OPENAI_API_KEY || '').trim())
      if (!hasKey) {
        return NextResponse.json({ ok: false, message: 'Assistant disabled in dev' }, { status: 501 })
      }
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Assistant GET error:', e)
    return NextResponse.json({ ok: false, message: 'Assistant temporarily unavailable. Please try again.' }, { status: 200 })
  }
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

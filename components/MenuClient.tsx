
"use client"

/* eslint-disable @next/next/no-img-element */

import { useState, useMemo, useEffect } from 'react'
import useSWR from 'swr'
import { MenuResponse, MenuItem } from '@/types/api'

type TenantStyleFlags = {
  flags?: Record<string, boolean>
  navVariant?: string
  heroVariant?: string
  accentSecondary?: string
  badges?: Record<string, string>
  texture?: { vignette?: boolean; paper?: boolean }
}

type TenantTheme = {
  primary?: string
  bg?: string
  text?: string
  ink?: string
  card?: string
  muted?: string
  accent?: string
}

type TenantBrand = {
  name?: string
  tagline?: string
  logoUrl?: string
  header?: { logoUrl?: string }
}

type TenantConfig = {
  brand?: TenantBrand
  theme?: TenantTheme
  images?: Record<string, string>
  style?: TenantStyleFlags
  copy?: Record<string, unknown>
}

type ThemeCSSVariables = React.CSSProperties & Record<'--bg' | '--text' | '--ink' | '--card' | '--muted' | '--accent', string | undefined>

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function MenuClient() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedDietaryFilters, setSelectedDietaryFilters] = useState<string[]>([])
  const [cart, setCart] = useState<Array<{ item: MenuItem; quantity: number }>>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [assistantMessage, setAssistantMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{role: 'user' | 'assistant', message: string}>>([])
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [cartBump, setCartBump] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  // plate button removed
  // plate pile removed with floating button
  // fly-to-plate animation removed

  // Get tenant/admin from URL params
  const isBrowser = typeof window !== 'undefined'
  const searchParams = isBrowser ? new URLSearchParams(window.location.search) : null
  const tenant = isBrowser
    ? (searchParams!.get('tenant') || process.env.NEXT_PUBLIC_DEFAULT_TENANT || 'benes')
    : 'benes'
  const isAdmin = isBrowser ? searchParams!.get('admin') === '1' : false
  // Tenant-scoped UI polish (must not affect other menus)
  const isIndependentDraft = tenant === 'independent-draft'
  // Admin token handling for preview saves: read from URL (?token=) then persist to localStorage
  const [adminToken, setAdminToken] = useState<string | null>(null)
  useEffect(() => {
    if (!isBrowser) return
    const urlToken = searchParams?.get('token')
    if (urlToken && urlToken.trim() !== '') {
      try { localStorage.setItem('adminToken', urlToken) } catch {}
      setAdminToken(urlToken)
    } else {
      try { setAdminToken(localStorage.getItem('adminToken')) } catch { setAdminToken(null) }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Tenant flags
  const isBenes = false

  // Tenant config (brand/theme/images)
  const { data: cfg } = useSWR<TenantConfig>(`/api/tenant/config?tenant=${tenant}`, fetcher)
  const brand = cfg?.brand
  const theme = cfg?.theme ?? null
  const imageMap = cfg?.images ?? {}
  const copy = cfg?.copy as Record<string, unknown> | undefined
  const styleCfg = cfg?.style
  const accentSecondary = styleCfg?.accentSecondary
  const categoryIntros = (copy?.categoryIntros as Record<string, string | undefined>) || {}
  const brandLogoUrl = brand?.header?.logoUrl || brand?.logoUrl || ''
  const brandName = brand?.name || 'Menu'
  const brandTagline = brand?.tagline || ''

  // Ensure themed CSS variables exist on first paint, especially for Benes on mobile
  const effectiveTheme = useMemo(() => theme ?? null, [theme])

  

  // Apply theme from config
  useEffect(() => {
    if (typeof window === 'undefined' || !theme) return
    const bg = theme.bg || theme.primary
    if (bg) document.body.style.setProperty('--bg', bg)
    if (theme.text) document.body.style.setProperty('--text', theme.text)
    if (theme.ink) document.body.style.setProperty('--ink', theme.ink)
    if (theme.card) document.body.style.setProperty('--card', theme.card)
    if (theme.muted) document.body.style.setProperty('--muted', theme.muted)
    if (theme.accent) document.body.style.setProperty('--accent', theme.accent)
  }, [theme])

  const { data: menuData, error, isLoading } = useSWR<MenuResponse>(
    `/api/menu?tenant=${tenant}`,
    fetcher
  )

  // Hide hero/specials for Benes draft per request
  const showBenesHero = useMemo(() => styleCfg?.heroVariant !== 'none', [styleCfg?.heroVariant])
  const showSpecials = !!(styleCfg?.flags && (styleCfg.flags as Record<string, boolean>).specials)

  // Admin inline edit state
  const [editableMenu, setEditableMenu] = useState<MenuResponse | null>(null)
  useEffect(() => {
    if (!isAdmin) return
    if (menuData) {
      // Deep clone once when data loads or changes
      setEditableMenu(JSON.parse(JSON.stringify(menuData)))
    }
  }, [isAdmin, menuData])

  const baseMenu: MenuResponse | null = isAdmin ? (editableMenu || null) : (menuData || null)

  // Filter logic matching your Canvas app exactly (client-side now to avoid API refiring per keystroke)
  const filteredCategories = useMemo(() => {
    if (!baseMenu?.categories) return []
    
    return baseMenu.categories
      .map(category => ({
        ...category,
        items: category.items.filter(item => {
          // Category filter
          // Independent draft uses category bar for navigation (scroll), not filtering.
          if (!isIndependentDraft && selectedCategory && category.name !== selectedCategory) return false
          
          // Search filter (name and description)
          if (searchQuery) {
            const searchLower = searchQuery.toLowerCase()
            const matchesName = item.name.toLowerCase().includes(searchLower)
            const matchesDescription = (item.description || '').toLowerCase().includes(searchLower)
            const matchesTags = (item.tags || []).some(tag => tag.toLowerCase().includes(searchLower))
            if (!matchesName && !matchesDescription && !matchesTags) return false
          }
          
          // Dietary filters (must have all selected dietary tags)
          if (selectedDietaryFilters.length > 0) {
            const hasAllDietaryFilters = selectedDietaryFilters.every(dietFilter =>
              (item.tags || []).some(tag => tag.toLowerCase() === dietFilter.toLowerCase())
            )
            if (!hasAllDietaryFilters) return false
          }
          
          return true
        })
      }))
      .filter(category => category.items.length > 0)
  }, [baseMenu, isIndependentDraft, searchQuery, selectedCategory, selectedDietaryFilters])

  const saveAllEdits = async () => {
    if (!isAdmin || !editableMenu) return
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (adminToken && adminToken.trim() !== '') {
        headers['X-Admin-Token'] = adminToken
      }
      const res = await fetch('/api/tenant/import', {
        method: 'POST',
        headers,
        body: JSON.stringify({ tenant, menu: editableMenu })
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(txt || 'Save failed')
      }
      setToast('Saved changes')
    } catch (error) {
      const needsToken = typeof window !== 'undefined' && !adminToken && process.env.NODE_ENV === 'production'
      const suffix = needsToken ? ' — add &token=YOUR_ADMIN_TOKEN to the URL once, then Save again.' : ''
      const message = (error instanceof Error ? error.message : 'Error saving changes') + suffix
      setToast(message)
    }
  }

  const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const highlightText = (text: string | undefined, query: string) => {
    const safeText = text ?? ''
    if (!query) return safeText
    const parts = safeText.split(new RegExp(`(${escapeRegExp(query)})`, 'gi'))
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase()
        ? <mark key={`highlight-${index}`} className="bg-yellow-200 px-1 rounded">{part}</mark>
        : <span key={`text-${index}`}>{part}</span>
    )
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(cartItem => cartItem.item.id !== itemId))
  }

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }
    setCart(prev => prev.map(cartItem =>
      cartItem.item.id === itemId ? { ...cartItem, quantity } : cartItem
    ))
    // no plate pile visuals anymore
  }

  const sendAssistantMessage = async (overrideMessage?: string) => {
    const userMessage = (overrideMessage ?? assistantMessage).trim()
    if (!userMessage) return

    setAssistantMessage('')
    setChatHistory(prev => [...prev, { role: 'user', message: userMessage }])

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant,
          query: userMessage,
          filters: {
            vegan: selectedDietaryFilters.includes('vegan'),
            glutenFree: selectedDietaryFilters.includes('gluten-free'),
            dairyFree: selectedDietaryFilters.includes('dairy-free')
          }
        })
      })

      const raw = await response.text()
      let assistantText = 'Thanks for your question.'
      try {
        const data = raw ? JSON.parse(raw) : null
        if (data) {
          assistantText = data.text || data.response || data.message || assistantText
        } else if (!response.ok) {
          assistantText = `Assistant error (${response.status})`
        }
      } catch {
        assistantText = raw && raw.trim().length > 0 ? raw : assistantText
      }
      setChatHistory(prev => [...prev, { role: 'assistant', message: assistantText }])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sorry, I had trouble processing your request.'
      setChatHistory(prev => [...prev, { role: 'assistant', message }])
    }
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.item.price * item.quantity), 0)

  const dietaryOptions = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free']
  
  const scrollTo = (elementId: string) => {
    if (typeof window === 'undefined') return
    const el = document.getElementById(elementId)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  
  // Note: avoid early returns before hooks to keep hook order stable

  const categories = useMemo(() => menuData?.categories ?? [], [menuData])
  const allCategories = useMemo(() => categories.map(cat => cat.name), [categories])

  const getCategoryIcon = (name: string) => {
    const n = name.toLowerCase()
    // Icons inherit current text color via currentColor
    if (n.includes('appet')) {
      // Utensils
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 3v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M5 3v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M9 3v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M7 11v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M16 3c1.66 0 3 1.34 3 3v15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M13 6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    }
    if (n.includes('main')) {
      // Cloche
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 14a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M2 14h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="12" cy="7" r="1" fill="currentColor"/>
        </svg>
      )
    }
    if (n.includes('salad')) {
      // Leaf
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 14c4-7 12-7 16 0-6 4-10 4-16 0Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M9 12c2 0 3 1 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    }
    if (n.includes('drink') || n.includes('bever')) {
      // Cup
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 5h12l-1 9a4 4 0 0 1-4 3h-2a4 4 0 0 1-4-3L5 5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M17 7h2a3 3 0 0 1 0 6h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    }
    if (n.includes('pasta')) {
      // Bowl noodles
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 13a8 8 0 0 0 16 0H4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M7 11c2 0 3-2 5-2s3 2 5 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    }
    if (n.includes('pizza')) {
      // Pizza slice
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 8c6-4 12-4 18 0L12 21 3 8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <circle cx="12" cy="11" r="1" fill="currentColor"/>
          <circle cx="9" cy="13" r="1" fill="currentColor"/>
          <circle cx="15" cy="13" r="1" fill="currentColor"/>
        </svg>
      )
    }
    if (n.includes('dessert') || n.includes('sweet')) {
      // Cupcake
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M7 10a5 5 0 0 1 10 0" stroke="currentColor" strokeWidth="2"/>
          <path d="M6 11h12l-1 7H7l-1-7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        </svg>
      )
    }
    // Default: dot grid
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="6" cy="6" r="1.5" fill="currentColor"/>
        <circle cx="12" cy="6" r="1.5" fill="currentColor"/>
        <circle cx="18" cy="6" r="1.5" fill="currentColor"/>
        <circle cx="6" cy="12" r="1.5" fill="currentColor"/>
        <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
        <circle cx="18" cy="12" r="1.5" fill="currentColor"/>
      </svg>
    )
  }

  const firstImageUrl = useMemo(() => {
    for (const cat of categories) {
      for (const item of cat.items) {
        if (item.imageUrl) return item.imageUrl
      }
    }
    return null
  }, [categories])

  // Scroll spy to highlight active category
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sectionIds = categories.map(c => `cat-${c.id}`)
    const elements = sectionIds
      .map(id => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el)
    if (elements.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) {
          const id = visible[0].target.id.replace('cat-', '')
          setActiveCategoryId(id)
        }
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] }
    )
    elements.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [categories])

  // Cart bump reset
  useEffect(() => {
    if (!cartBump) return
    const t = setTimeout(() => setCartBump(false), 300)
    return () => clearTimeout(t)
  }, [cartBump])

  // Toast auto-hide
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 1500)
    return () => clearTimeout(t)
  }, [toast])

  const rootStyle: ThemeCSSVariables = {
    background: effectiveTheme?.bg ?? 'var(--bg)',
    color: effectiveTheme?.text ?? 'var(--text)',
    '--bg': effectiveTheme?.bg,
    '--text': effectiveTheme?.text,
    '--ink': effectiveTheme?.ink,
    '--card': effectiveTheme?.card,
    '--muted': effectiveTheme?.muted,
    '--accent': effectiveTheme?.accent,
  }
  const paperTexture = Boolean(styleCfg?.texture?.paper)
  const containerStyle: React.CSSProperties = {
    ...rootStyle,
    ...(paperTexture ? { backgroundImage: 'radial-gradient(rgba(16,16,16,0.03) 1px, transparent 1px)', backgroundSize: '20px 20px' } : {}),
  }

  // Benes-specific featured picks and pairings
  const featuredItemIds: string[] = isBenes ? [
    'i-margherita-napoletana-14',
    'i-fettuccine-bolognese',
    'i-prosciutto-arugula-14'
  ] : []
  const pairingsById: Record<string, string> = isBenes ? {
    'i-fettuccine-bolognese': 'Pairs with Zinfandel',
    'i-margherita-napoletana-14': 'Pairs with Chianti',
    'i-prosciutto-arugula-14': 'Pairs with Pinot Grigio',
    'i-lasagna': 'Pairs with Sangiovese'
  } : {}
  function cardStyleForCategory(categoryName: string): React.CSSProperties {
    if (/pizza/i.test(categoryName)) {
      return {
        backgroundColor: '#ffffff',
        backgroundImage: 'radial-gradient(rgba(16,16,16,0.05) 1px, transparent 1px)',
        backgroundSize: '8px 8px',
        borderColor: 'rgba(0,0,0,0.06)'
      }
    }
    if (/pasta/i.test(categoryName)) {
      return {
        background: '#fffaf2',
        borderColor: 'rgba(185,28,28,0.12)',
        boxShadow: '0 8px 28px rgba(16,16,16,0.08)'
      }
    }
    if (/calzone/i.test(categoryName)) {
      return {
        background: '#fffef8',
        borderColor: 'rgba(0,0,0,0.08)'
      }
    }
    return {}
  }
  function resolveFeatured() {
    const items: Array<MenuItem & { categoryName?: string }> = []
    if (!menuData?.categories) return items
    const idToItem: Record<string, MenuItem & { categoryName: string }> = {}
    for (const cat of menuData.categories) {
      for (const it of cat.items) {
        idToItem[it.id] = { ...it, categoryName: cat.name }
      }
    }
    for (const fid of featuredItemIds) {
      if (idToItem[fid]) items.push(idToItem[fid])
    }
    // Fallback: pick first three if any missing
    if (items.length < 3) {
      outer: for (const cat of menuData.categories) {
        for (const it of cat.items) {
          if (items.some(existing => existing.id === it.id)) continue
          items.push({ ...it, categoryName: cat.name })
          if (items.length >= 3) break outer
        }
      }
    }
    return items
  }

  return (
    <div className="min-h-screen" style={containerStyle}>
      {/* Loading and error states */}
      {error && (
        <div className="flex items-center justify-center min-h-screen text-red-600">Failed to load menu</div>
      )}
      {(!error && isLoading) && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="lux-skeleton h-8 w-64 mb-6 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="lux-skeleton h-48 w-full"></div>
                <div className="p-6 space-y-3">
                  <div className="lux-skeleton h-5 w-2/3 rounded"></div>
                  <div className="lux-skeleton h-4 w-full rounded"></div>
                  <div className="lux-skeleton h-4 w-5/6 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {!error && !isLoading && (
        <>
      {/* Independent draft: top navigation bar with logo + search (no name/description text) */}
      {isIndependentDraft ? (
        <div
          className="sticky top-0 z-50"
          style={{
            background: 'rgba(11, 15, 18, 0.92)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(196, 167, 106, 0.25)',
          }}
        >
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
            <img
              src={brandLogoUrl || 'https://images.squarespace-cdn.com/content/v1/652d775c7dfc3727b42cc773/cd438e8d-6bd2-4053-aa62-3ee8a308ee38/Indy_Logo_Light.png?format=1500w'}
              alt="The Independent"
              className="h-9 w-auto"
              loading="eager"
              decoding="async"
            />
            <div className="flex-1" />
            <div className="relative w-full max-w-md">
              <input
                type="text"
                placeholder="Search the menu…"
                className="w-full px-4 py-2.5 pr-10 rounded-full text-sm text-black bg-white placeholder-gray-500 focus:ring-2 transition-colors"
                style={{ border: '1px solid rgba(196,167,106,0.45)', boxShadow: '0 10px 28px rgba(0,0,0,0.22)' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" />
                  <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Fixed Header: Benes uses centered logo background; others show title */}
          <div
            className="fixed top-0 left-0 right-0 z-50 shadow-sm"
            style={isBenes ? {
              backgroundColor: '#ffffff',
              backgroundImage: brandLogoUrl ? `url(${brandLogoUrl})` : undefined,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              backgroundSize: 'auto 140px'
            } : { background: 'linear-gradient(90deg, var(--primary), var(--accent))' }}
          >
            <div
              className="px-4"
              style={{
                height: 72,
                borderBottom: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              {!isBenes && (
                <div className="max-w-7xl mx-auto h-full flex items-center justify-center gap-3">
                  {brandLogoUrl ? (
                    <img src={brandLogoUrl} alt={brandName} className="w-8 h-8 rounded-full bg-white object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center">🍽️</div>
                  )}
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-white tracking-wide" style={{ fontFamily: 'var(--font-italiana)' }}>{brandName}</h1>
                    <p className="text-gray-200 text-xs">{brandTagline}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Spacer to offset fixed header height */}
      {/* Optional hero subtitle from copy */}
      {!isIndependentDraft && (
        <>
          <div style={{ height: isBenes ? 160 : 80 }} />
          {showBenesHero && (
            <div className="w-full" style={{height:6, background:'linear-gradient(90deg, var(--accent), #ffffff, var(--accent))'}} />
          )}
          {showBenesHero && typeof copy?.heroSubtitle === 'string' && (
            <div className="max-w-7xl mx-auto px-4 mt-2 mb-4">
              <p className="text-sm text-gray-500 italic">{copy.heroSubtitle}</p>
            </div>
          )}
        </>
      )}

      {/* Category chip scroller removed for Benes */}

      {/* Benes hero banner */}
      {showBenesHero && (
        <div className="max-w-7xl mx-auto px-4 mb-6">
          <div
            className="relative w-full h-40 md:h-56 rounded-xl overflow-hidden border"
            style={{ borderColor: 'rgba(0,0,0,0.08)', boxShadow: '0 12px 32px rgba(16,16,16,0.12)' }}
          >
            <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, var(--primary), var(--accent))', opacity: 0.22 }} />
            {brandLogoUrl && (
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url(${brandLogoUrl})`, backgroundRepeat: 'repeat', backgroundSize: '160px 160px' }} />
            )}
            <div className="relative h-full flex items-center justify-between px-5">
              <div className="max-w-lg">
                {typeof copy?.tagline === 'string' && (
                  <div className="text-lg md:text-xl font-semibold" style={{ color: '#FFFFFF' }}>{copy.tagline}</div>
                )}
                {typeof copy?.heroSubtitle === 'string' && (
                  <div className="text-sm md:text-base text-gray-100 mt-1">{copy.heroSubtitle}</div>
                )}
              </div>
              <div className="hidden md:flex items-center gap-2" />
            </div>
          </div>
        </div>
      )}

      {/* Subtle Specials ribbon */}
      {showSpecials && (
        <div className="max-w-7xl mx-auto px-4 mb-4">
          <div className="rounded-lg px-3 py-2 text-sm" style={{ background:'linear-gradient(90deg, rgba(196,167,106,0.10), rgba(255,255,255,0))', border:'1px solid rgba(196,167,106,0.28)', color:'#101010' }}>
            {typeof copy?.specials === 'string' ? copy.specials : "Tonight's Specials are available — ask your server."}
          </div>
        </div>
      )}

      {/* Signature Picks (Benes) */}
      {false && (
        <div className="max-w-7xl mx-auto px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg md:text-xl font-semibold" style={{ fontFamily: 'var(--font-serif)', color: '#101010' }}>Signature Picks</h3>
            <div className="flex-1 ml-4" style={{ height: 2, background: 'linear-gradient(90deg, var(--accent), transparent)' }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {resolveFeatured().map((it) => {
              const src = imageMap[it.id] || it.imageUrl || ''
              return (
                <div key={it.id} className="relative rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(185,28,28,0.22)', boxShadow: '0 10px 24px rgba(16,16,16,0.12)', background:'#fffdf5' }}>
                  {src && (
                    <img src={src} alt={it.name} className="w-full h-44 object-cover" loading="lazy" decoding="async" />
                  )}
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(90deg, rgba(18,136,7,.06), rgba(255,255,255,.02), rgba(185,28,28,.06))' }} />
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold" style={{ fontFamily: 'var(--font-serif)', color:'#101010' }}>{it.name}</div>
                        {pairingsById[it.id] && (
                          <div className="text-xs text-gray-600 mt-0.5">{pairingsById[it.id]}</div>
                        )}
                      </div>
                  <div className="text-sm font-bold px-2 py-0.5 rounded-full" style={{ color:'#0b0b0b', background:'var(--accent)' }}>${Number(it.price ?? 0).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Hero section (hidden for Benes to keep a single compact header) */}
      {!isBenes && !isIndependentDraft && (
        <div className="relative">
          <div
            className="w-full h-56 md:h-64 lg:h-72"
            style={{
              backgroundImage: firstImageUrl ? `url(${firstImageUrl})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderBottom: '1px solid var(--muted)'
            }}
          >
            <div className="w-full h-full" style={{ background: 'linear-gradient(90deg, rgba(30,30,30,0.45), rgba(196,167,106,0.20), rgba(30,30,30,0.45))' }} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <div className="backdrop-blur-sm/20 text-center px-4 py-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.65)' }}>
                  <h2 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--ink)' }}>{brandName}</h2>
              <p className="text-xs md:text-sm" style={{ color: 'var(--accent)' }}>{brandTagline}</p>
            </div>
          </div>
          <div className="w-full h-1.5" style={{ background: 'var(--accent)' }} />
        </div>
      )}

      {/* Admin Edit Bar */}
      {isAdmin && (
        <div className="sticky top-0 z-40 bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3">
            <span className="text-sm text-yellow-900 font-medium">Inline Edit Mode</span>
            <button onClick={saveAllEdits} className="px-3 py-1 rounded text-sm" style={{ background: 'var(--accent)', color: '#0b0b0b' }}>Save All</button>
            {/* Publish draft → live */}
            <button
              onClick={async () => {
                try {
                  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
                  if (adminToken && adminToken.trim() !== '') headers['X-Admin-Token'] = adminToken
                  const from = tenant.endsWith('-draft') ? tenant : `${tenant}-draft`
                  const to = from.replace(/-draft$/, '')
                  const res = await fetch('/api/tenant/promote', {
                    method: 'POST', headers, body: JSON.stringify({ from, to })
                  })
                  if (!res.ok) throw new Error('Publish failed')
                  setToast('Published to live')
                } catch (e) {
                  setToast(e instanceof Error ? e.message : 'Publish failed')
                }
              }}
              className="px-3 py-1 rounded text-sm border border-yellow-300"
              style={{ background: '#fff', color: '#7a5d00' }}
            >
              Publish
            </button>
            <a href={`/menu?tenant=${encodeURIComponent(tenant)}`} className="text-sm text-yellow-900 underline">Exit</a>
          </div>
        </div>
      )}

      {/* Independent draft: sticky category bar (only navigation) */}
      {isIndependentDraft ? (
        <div
          className="sticky z-40"
          style={{
            top: 64,
            background: 'rgba(11, 15, 18, 0.86)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => { setSelectedCategory(null); scrollTo('top') }}
                className="shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition"
                style={selectedCategory === null
                  ? { background: 'var(--accent)', color: '#0b0b0b' }
                  : { background: 'rgba(255,255,255,0.08)', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.14)' }
                }
              >
                All
              </button>
              {filteredCategories.map(c => {
                const isActive = activeCategoryId === c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedCategory(c.name); scrollTo(`cat-${c.id}`) }}
                    className="shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition"
                    style={isActive
                      ? { background: 'rgba(196,167,106,0.18)', color: '#f8fafc', border: '1px solid rgba(196,167,106,0.55)' }
                      : { background: 'rgba(255,255,255,0.08)', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.14)' }
                    }
                  >
                    {c.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        // Search & Filters (scroll with page)
        <div className="max-w-7xl mx-auto px-4 py-2">
          {/* Search Bar */}
          <div className="mb-3">
            <div className="flex items-center gap-2 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search menu items, tags, or categories..."
                  className="w-full px-3 py-2 pr-9 rounded-md focus:ring-2 transition-colors text-sm text-black bg-white placeholder-gray-500"
                  style={{ border: '1px solid var(--muted)' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" />
                    <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <button
                onClick={() => setFiltersOpen(o => !o)}
                className="px-3 py-2 rounded-md text-sm font-medium"
                style={{ background: 'var(--card)', color: 'var(--ink)', border: '1px solid var(--muted)' }}
              >
                {filtersOpen ? 'Hide Filters' : 'Filters'}
              </button>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 justify-center flex-wrap mb-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
              style={selectedCategory===null?{background:'var(--accent)', color:'#0b0b0b'}:{ background:'#ffffff', color:'var(--ink)', border:'1px solid var(--accent)'} }
            >
              All Categories
            </button>
            {allCategories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
                className="px-4 py-2 rounded-full text-sm font-bold transition-all duration-200"
                style={selectedCategory===category?{background:'var(--accent)', color:'#0b0b0b'}:{ background:'#ffffff', color:'var(--ink)', border:'1px solid var(--muted)'} }
              >
                <span className="inline-flex items-center gap-2">
                  {getCategoryIcon(category)}
                  <span>{category}</span>
                </span>
              </button>
            ))}
          </div>

          {/* Dietary Filters (compact dropdown) */}
          {filtersOpen && (
            <div className="flex gap-2 justify-center flex-wrap">
              {dietaryOptions.map(option => (
                <button
                  key={option}
                  onClick={() => {
                    setSelectedDietaryFilters(prev =>
                      prev.includes(option)
                        ? prev.filter(f => f !== option)
                        : [...prev, option]
                    )
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200`}
                  style={selectedDietaryFilters.includes(option)
                    ? { background: 'var(--accent)', color: '#0b0b0b', border: '1px solid var(--accent)' }
                    : { background: 'var(--card)', color: 'var(--ink)', border: '1px solid var(--muted)' }
                  }
                >
                  {option}
                </button>
              ))}
              {(searchQuery || selectedDietaryFilters.length>0 || selectedCategory) && (
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory(null); setSelectedDietaryFilters([]) }}
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{ background: 'var(--card)', color: 'var(--ink)', border: '1px solid var(--muted)' }}
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className={isIndependentDraft ? 'max-w-6xl mx-auto px-4 py-10' : 'max-w-7xl mx-auto px-4 py-8 lg:grid lg:grid-cols-12 lg:gap-8'} style={{ color: 'var(--ink)' }}>
        {/* Current Category Chip */}
        {!isIndependentDraft && (
          <div className="lg:col-span-12 mb-4">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium" style={{ background: '#2a2a2a', color: '#f5f5f5' }}>
              Browsing: {selectedCategory || 'All'}
            </span>
          </div>
        )}
        {/* Category Sidebar */}
        {!isIndependentDraft && (
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-24 lux-card rounded-xl p-4" style={{ background: '#1a1a1a', borderRadius: 'var(--radius)' }}>
            <h3 className="text-sm font-semibold text-gray-200 mb-3">Categories</h3>
            <nav className="space-y-1">
              <button
                onClick={() => scrollTo('top')}
                className="w-full text-left px-3 py-2 rounded-md text-sm font-bold transition"
                style={{ color: '#ffffff', background: '#1f1f1f' }}
              >
                All Categories
              </button>
              {filteredCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => scrollTo(`cat-${category.id}`)}
                  className="w-full text-left px-3 py-2 rounded-md text-sm font-bold transition"
                  style={activeCategoryId===category.id?{ color: '#0b0b0b', background: 'var(--accent)' }:{ color: '#e5e5e5', background: '#1a1a1a' }}
                >
                  <span className="inline-flex items-center gap-2">
                    {getCategoryIcon(category.name)}
                    <span>{category.name}</span>
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </aside>
        )}

        {/* Menu Grid */}
        <div className={isIndependentDraft ? 'space-y-12' : 'space-y-12 lg:col-span-9'} id="top">
          {filteredCategories.map((category, idx) => (
            <div
              key={category.id}
              id={`cat-${category.id}`}
              className={`category-section scroll-mt-24 ${idx > 0 ? (isIndependentDraft ? 'pt-10 border-t border-white/10' : 'pt-8 border-t border-white/10') : ''}`}
              style={{
                borderRadius: 12,
                padding: isIndependentDraft ? 20 : 12
              }}
            >
              <div className={`flex items-center justify-between ${isIndependentDraft ? 'mb-8' : 'mb-6'}`}>
                <h2 className="text-2xl font-extrabold tracking-wide inline-flex items-center gap-3" style={{ fontFamily: 'var(--font-serif)', color: isBenes ? '#101010' : 'var(--ink)' }}>
                  <span>{category.name}</span>
                </h2>
                <div className="flex-1 ml-6" style={{ height: 2, background: accentSecondary ? `linear-gradient(90deg, ${accentSecondary}, transparent)` : 'linear-gradient(90deg, var(--accent), transparent)' }}></div>
              </div>
              {isBenes && typeof categoryIntros[category.name] === 'string' && (
                <p className="text-gray-300 text-sm mb-4">{categoryIntros[category.name]}</p>
              )}
              
              {isIndependentDraft ? (
                <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.04)' }}>
                  {category.items.map((item, itemIdx) => {
                    const tags = (item.tags || [])
                    const dietary = tags.filter(t => ['vegetarian','vegan','gluten-free','dairy-free','nut-free'].includes(t.toLowerCase()))
                    return (
                      <div
                        key={item.id}
                        className="px-6 py-6"
                        style={itemIdx === 0 ? undefined : { borderTop: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <div className="flex items-start justify-between gap-6">
                          <div className="min-w-0">
                            <h3 className="text-lg md:text-xl font-semibold tracking-tight" style={{ color: '#f8fafc' }}>
                              {highlightText(item.name, searchQuery)}
                            </h3>
                            {item.description ? (
                              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'rgba(248,250,252,0.72)' }}>
                                {highlightText(item.description, searchQuery)}
                              </p>
                            ) : null}
                            {dietary.length > 0 ? (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {dietary.map(tag => (
                                  <span
                                    key={tag}
                                    className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(248,250,252,0.86)', border: '1px solid rgba(255,255,255,0.14)' }}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="text-base font-semibold" style={{ color: 'rgba(196,167,106,0.95)' }}>
                              ${Number(item.price ?? 0).toFixed(2)}
                            </div>
                            <button
                              onClick={() => { setIsAssistantOpen(true); void sendAssistantMessage(`Tell me about ${item.name}`) }}
                              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition"
                              style={{
                                background: 'rgba(196,167,106,0.16)',
                                border: '1px solid rgba(196,167,106,0.55)',
                                color: '#f8fafc'
                              }}
                              aria-label={`Ask about ${item.name}`}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M6 10c0-3 2.7-5 6-5s6 2 6 5-2.7 5-6 5c-.9 0-1.8-.1-2.6-.3L6 17v-2.3C6 13.5 6 12.3 6 10Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                              </svg>
                              Ask
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6`}>
                  {category.items.map(item => (
                    <div
                      key={item.id}
                      className="menu-item border rounded-lg overflow-hidden transition-all duration-300 hover:-translate-y-1"
                      style={{
                        borderRadius: 'var(--radius)',
                        background: isBenes ? '#fffdf5' : 'var(--card)',
                        borderColor: isBenes ? 'rgba(185,28,28,0.12)' : 'var(--muted)',
                        boxShadow: isBenes ? '0 6px 24px rgba(16,16,16,0.06)' : undefined,
                        ...cardStyleForCategory(category.name)
                      }}
                    >
                      {(() => {
                        const src = imageMap[item.id] || item.imageUrl || ''
                        if (!src) return null
                        return (
                          <div className="bg-gray-100">
                            <img
                              id={`img-${item.id}`}
                              src={src}
                              alt={item.name}
                              className="w-full h-48 object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                        )
                      })()}
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-xl font-semibold text-black leading-tight" style={{ fontFamily: 'var(--font-serif)' }}>
                            {highlightText(item.name, searchQuery)}
                          </h3>
                          <span className="text-xl font-bold text-black ml-4 px-2 py-0.5 rounded-full" style={{ background: 'var(--accent)', color: '#0b0b0b' }}>${Number(item.price ?? 0).toFixed(2)}</span>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed italic mb-4">
                          {highlightText(item.description, searchQuery)}
                        </p>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0 flex flex-wrap gap-1">
                            {(item.tags || []).map(tag => (
                              <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-normal text-gray-500 border border-gray-300 bg-transparent">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="shrink-0 flex items-center gap-2">
                            <button
                              onClick={() => { setIsAssistantOpen(true); void sendAssistantMessage(`Tell me about ${item.name}`) }}
                              className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 text-black flex items-center gap-2 whitespace-nowrap"
                              aria-label={`Ask about ${item.name}`}
                            >
                              <span>Ask</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Nutrition/legal disclaimer */}
      <div className="max-w-7xl mx-auto px-4 mt-10 mb-24">
        <p className="text-xs text-gray-500 italic">
          2,000 calories a day is used for general nutrition advice, but calorie needs vary. Calorie values are
          estimates and may differ based on preparation or ingredient changes.
        </p>
      </div>

      {/* Floating Plate Button removed */}

      {/* AI Assistant Button */}
      {!isIndependentDraft && (
        <button
          onClick={() => setIsAssistantOpen(true)}
          className="fixed bottom-6 left-6 p-3 rounded-full shadow-lg transition-all duration-200 z-50"
          style={{background:'var(--accent)', color:'#0b0b0b'}}
          aria-label="Open assistant"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12 C 7 6, 17 6, 21 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 12 C 7 18, 17 18, 21 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="1.6" fill="currentColor"/>
          </svg>
        </button>
      )}

      {/* Floating flyers removed */}

      {/* Plate Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
          <div className="ml-auto w-full max-w-md bg-gray-50 h-full shadow-xl flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-black">Your Plate</h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="text-gray-500 hover:text-black transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <div className="text-4xl mb-4">🛒</div>
                  <p>Your plate is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(cartItem => (
                    <div key={cartItem.item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-black">{cartItem.item.name}</h4>
                <p className="text-sm text-gray-600">${Number(cartItem.item.price ?? 0).toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateCartQuantity(cartItem.item.id, cartItem.quantity - 1)}
                            className="w-8 h-8 rounded-full border border-gray-400 flex items-center justify-center hover:bg-gray-200 transition-colors text-black"
                          >
                            −
                          </button>
                          <span className="w-8 h-8 inline-flex items-center justify-center text-center font-medium text-black">{cartItem.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(cartItem.item.id, cartItem.quantity + 1)}
                            className="w-8 h-8 rounded-full border border-gray-400 flex items-center justify-center hover:bg-gray-200 transition-colors text-black"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-black">
                            ${(Number(cartItem.item.price ?? 0) * cartItem.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {cart.length > 0 && (
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-semibold text-black">Total:</span>
                  <span className="text-2xl font-bold text-black">
                  ${Number(cartTotal ?? 0).toFixed(2)}
                  </span>
                </div>
                <button className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors duration-200">
                  Proceed with Plate
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Demo mode - No actual payment processed
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Assistant Drawer */}
      {isAssistantOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
          <div className="w-full max-w-md bg-gray-50 h-full shadow-xl flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-black">Menu Assistant</h2>
                <button
                  onClick={() => setIsAssistantOpen(false)}
                  className="text-gray-500 hover:text-black transition-colors"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Ask about ingredients, allergens, or recommendations
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {chatHistory.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <div className="text-4xl mb-4">🤖</div>
                  <p>Start a conversation!</p>
                  <p className="text-sm mt-2">Try asking:</p>
                  <ul className="text-xs mt-2 space-y-1 text-left">
                    <li>&quot;What vegetarian options do you have?&quot;</li>
                    <li>&quot;Is the pasta gluten-free?&quot;</li>
                    <li>&quot;What&apos;s your most popular dish?&quot;</li>
                  </ul>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`p-3 rounded-lg ${
                      msg.role === 'user' 
                        ? 'bg-gray-100 text-black ml-8' 
                        : 'bg-black text-white mr-8'
                    }`}>
                      <div className="font-medium text-xs mb-1 opacity-70">
                        {msg.role === 'user' ? 'You' : 'Assistant'}
                      </div>
                      <div className="text-sm">{msg.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask about our menu..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-sm text-black bg-white placeholder-gray-500"
                  value={assistantMessage}
                  onChange={(e) => setAssistantMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendAssistantMessage()}
                />
                <button
                  onClick={() => { void sendAssistantMessage() }}
                  className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 right-6 z-50 px-4 py-2 rounded-lg shadow" style={{ background:'#111', color:'#fff' }}>
          {toast}
        </div>
      )}
    </div>
  )
}


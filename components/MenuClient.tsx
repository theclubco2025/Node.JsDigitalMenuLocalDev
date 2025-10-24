
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

type TenantCopy = {
  featuredIds?: string[]
  categoryIntros?: Record<string, string>
  heroSubtitle?: string
  tagline?: string
  specials?: string | boolean
}

type TenantConfig = {
  brand?: TenantBrand
  theme?: TenantTheme
  images?: Record<string, string>
  style?: TenantStyleFlags
  copy?: TenantCopy
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
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [showDemoAcknowledgement, setShowDemoAcknowledgement] = useState(false)

  // Get tenant/admin from URL params
  const isBrowser = typeof window !== 'undefined'
  const searchParams = isBrowser ? new URLSearchParams(window.location.search) : null
  const tenant = isBrowser
    ? (searchParams!.get('tenant') || process.env.NEXT_PUBLIC_DEFAULT_TENANT || 'benes')
    : 'benes'
  const isAdmin = isBrowser ? searchParams!.get('admin') === '1' : false
  const demoAcknowledgeKey = 'demoAcknowledged_v2'
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

  // Tenant config (brand/theme/images)
  const { data: cfg } = useSWR<TenantConfig>(`/api/tenant/config?tenant=${tenant}`, fetcher)
  const brand = cfg?.brand
  const theme = cfg?.theme ?? null
  const imageMap = useMemo(() => cfg?.images ?? {}, [cfg?.images])
  const copy = cfg?.copy as TenantCopy | undefined
  const styleCfg = cfg?.style
  const heroVariant = (styleCfg?.heroVariant || 'image').toLowerCase()
  const accentSecondary = styleCfg?.accentSecondary || undefined
  const categoryIntros: Record<string, string | undefined> = copy?.categoryIntros ?? {}
  const brandLogoUrl = brand?.header?.logoUrl || brand?.logoUrl || ''
  const brandName = tenant === 'demo' ? 'Demo Menu Experience' : (brand?.name || 'Menu')
  const brandTagline = brand?.tagline || ''

  // Ensure themed CSS variables exist on first paint
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
    if (theme.primary) document.body.style.setProperty('--primary', theme.primary)
  }, [theme])

  const { data: menuData, error, isLoading } = useSWR<MenuResponse>(
    `/api/menu?tenant=${tenant}`,
    fetcher
  )

  useEffect(() => {
    if (!isBrowser) return
    if (tenant === 'demo') {
      let acknowledged = false
      try {
        acknowledged = localStorage.getItem(demoAcknowledgeKey) === '1'
      } catch {}
      setShowDemoAcknowledgement(!acknowledged)
    } else {
      setShowDemoAcknowledgement(false)
    }
  }, [demoAcknowledgeKey, isBrowser, tenant])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (tenant === 'demo' && showDemoAcknowledgement) {
      const previous = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = previous
      }
    }
    document.body.style.overflow = ''
    return () => {}
  }, [showDemoAcknowledgement, tenant])

  const specialsText = typeof copy?.specials === 'string' ? copy.specials : ''
  const flags = (styleCfg?.flags ?? {}) as Record<string, boolean>
  const showSpecials = Boolean(flags.specials && specialsText)
  const showSignatureGrid = Boolean(flags.signatureGrid)
  const hideCart = Boolean(flags.hideCart)

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
          if (typeof item.price === 'number' && item.price <= 0) return false
          // Category filter
          if (selectedCategory && category.name !== selectedCategory) return false
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
  }, [baseMenu, searchQuery, selectedCategory, selectedDietaryFilters])

  const updateItemField = (
    categoryId: string,
    itemId: string,
    field: keyof MenuItem,
    value: MenuItem[keyof MenuItem] | undefined
  ) => {
    if (!editableMenu) return
    setEditableMenu(prev => {
      if (!prev) return prev
      const next: MenuResponse = JSON.parse(JSON.stringify(prev))
      for (const cat of next.categories) {
        if (cat.id === categoryId) {
          const idx = cat.items.findIndex(i => i.id === itemId)
          if (idx !== -1) {
            const item = cat.items[idx]
            switch (field) {
              case 'price':
                item.price = typeof value === 'number' ? value : Number(value ?? item.price)
                break
              case 'calories':
                item.calories = value === undefined
                  ? undefined
                  : typeof value === 'number'
                    ? value
                    : Number(value)
                break
              case 'tags':
                item.tags = Array.isArray(value) ? value : item.tags ?? []
                break
              case 'name':
                item.name = value === undefined ? '' : String(value)
                break
              case 'description':
                item.description = value === undefined ? undefined : String(value)
                break
              case 'imageUrl':
                item.imageUrl = value === undefined ? undefined : String(value)
                break
              default:
                item[field] = value as typeof item[typeof field]
            }
          }
          break
        }
      }
      return next
    })
  }

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

  const addTag = (categoryId: string, itemId: string, rawTag: string) => {
    const tag = (rawTag || '').trim()
    if (!tag) return
    if (!editableMenu) return
    setEditableMenu(prev => {
      if (!prev) return prev
      const next: MenuResponse = JSON.parse(JSON.stringify(prev))
      for (const cat of next.categories) {
        if (cat.id === categoryId) {
          const item = cat.items.find(i => i.id === itemId)
          if (item) {
            const tags = new Set(item.tags ?? [])
            tags.add(tag)
            item.tags = Array.from(tags)
          }
          break
        }
      }
      return next
    })
  }

  const removeTag = (categoryId: string, itemId: string, tag: string) => {
    if (!editableMenu) return
    setEditableMenu(prev => {
      if (!prev) return prev
      const next: MenuResponse = JSON.parse(JSON.stringify(prev))
      for (const cat of next.categories) {
        if (cat.id === categoryId) {
          const item = cat.items.find(i => i.id === itemId)
          if (item) {
            item.tags = (item.tags || []).filter(t => t !== tag)
          }
          break
        }
      }
      return next
    })
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

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.item.id === item.id)
      if (existing) {
        return prev.map(cartItem =>
          cartItem.item.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      }
      return [...prev, { item, quantity: 1 }]
    })
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
    // Prefer any configured image if items lack imageUrl in DB
    const fromConfig = Object.values(imageMap || {})[0]
    if (typeof fromConfig === 'string' && fromConfig) return fromConfig
    for (const cat of categories) {
      for (const item of cat.items) {
        if (item.imageUrl) return item.imageUrl
        const mapped = imageMap[item.id]
        if (mapped) return mapped
      }
    }
    return null
  }, [categories, imageMap])

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
  const cursiveFont = '"Playfair Display", "Lucida Handwriting", "Snell Roundhand", cursive'
  const sansFont = '"Inter", "Helvetica Neue", Arial, sans-serif'
  const isDemoTenant = tenant === 'demo'
  const containerStyle: React.CSSProperties = {
    ...rootStyle,
    ...(paperTexture ? { backgroundImage: 'radial-gradient(rgba(16,16,16,0.03) 1px, transparent 1px)', backgroundSize: '20px 20px' } : {}),
    ...(isDemoTenant ? { fontFamily: cursiveFont } : {}),
  }

  // Featured picks come from config copy.style.flags/featuredIds or fallback later
  const featuredItemIds: string[] = copy?.featuredIds ?? []
  function cardStyleForCategory(categoryName: string): React.CSSProperties {
    const base: React.CSSProperties = {
      background: '#ffffff',
      borderColor: 'rgba(0,0,0,0.08)'
    }
    if (!isDemoTenant && /pasta/i.test(categoryName)) {
      return {
        ...base,
        borderColor: 'rgba(185,28,28,0.12)'
      }
    }
    return base
  }
  function getItemBadges(item: MenuItem): string[] {
    const badges: string[] = []
    const name = (item?.name || '').toLowerCase()
    const tags: string[] = item?.tags || []
    if (tags.includes('vegan') || /vegan/.test(name)) badges.push('Vegan')
    if (tags.includes('gf') || /gluten\s*free|gf/.test(name)) badges.push('GF')
    if (/spicy|vesuvio|pepperoncini|diavolo/.test(name)) badges.push('Spicy')
    if (/margherita|bolognese|prosciutto/.test(name)) badges.push('House Favorite')
    return badges
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
    <>
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
      {/* Fixed Header */}
      <div
        className="fixed top-0 left-0 right-0 z-50 shadow-sm"
        style={{ background: 'linear-gradient(90deg, var(--primary), var(--accent))', ...(isDemoTenant ? { fontFamily: cursiveFont } : {}) }}
      >
        <div
          className="px-4"
          style={{ height: 72, borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="max-w-7xl mx-auto h-full flex items-center justify-center gap-3">
            {brandLogoUrl ? (
              <img src={brandLogoUrl} alt={brandName} className="w-8 h-8 rounded-full bg-white object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center">🍽️</div>
            )}
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white tracking-wide" style={{ fontFamily: 'var(--font-italian)' }}>{brandName}</h1>
              <p className="text-gray-200 text-xs">{brandTagline}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer to offset fixed header height */}
      <div style={{ height: 80 }} />

      {/* Category chip scroller (optional - enable via future flag) */}

      {/* No special-case banner */}

      {/* Subtle Specials ribbon */}
      {showSpecials && (
        <div className="max-w-7xl mx-auto px-4 mb-4">
          <div className="rounded-lg px-3 py-2 text-sm" style={{ background:'linear-gradient(90deg, rgba(185,28,28,0.08), rgba(255,255,255,0))', border:'1px solid rgba(185,28,28,0.18)', color:'#101010' }}>
            {specialsText}
          </div>
        </div>
      )}

      {/* Signature Picks (data-flagged) */}
      {showSignatureGrid && (
        <div className="max-w-7xl mx-auto px-4 mb-6">
              <div className="flex items-center mb-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow" style={{ border: '1px solid rgba(0,0,0,0.05)', ...(isDemoTenant ? { fontFamily: cursiveFont } : {}) }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#facc15" aria-hidden="true">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" stroke="#facc15" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
                  <h3 className="text-lg md:text-xl font-semibold" style={{ fontFamily: isDemoTenant ? cursiveFont : 'var(--font-serif)', color: '#101010' }}>Signature Picks</h3>
            </div>
            <div className="flex-1 ml-4" style={{ height: 2, background: 'linear-gradient(90deg, var(--accent), transparent)' }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {resolveFeatured().map((it) => {
              const src = imageMap[it.id] || it.imageUrl || ''
              return (
                <div key={it.id} className="relative rounded-xl overflow-hidden border" style={{ borderColor: 'var(--muted)', boxShadow: '0 10px 24px rgba(16,16,16,0.12)', background:'var(--card)' }}>
                  {src && (
                    <img src={src} alt={it.name} className="w-full h-44 object-cover" loading="lazy" decoding="async" />
                  )}
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold" style={{ fontFamily: 'var(--font-serif)', color:'#101010' }}>{it.name}</div>
                        {/* optional pairing copy can be added via copy data */}
                      </div>
                      {typeof it.price === 'number' && it.price > 0 && (
                        <div className="text-sm font-semibold text-neutral-900">${it.price.toFixed(2)}</div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Hero section (variant-driven) */}
      {heroVariant !== 'none' && (
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
            {/* Overlay tuned by tenant style */}
            <div className="w-full h-full" style={{
              background: 'linear-gradient(90deg, rgba(0,0,0,0.28), rgba(255,255,255,0.14), rgba(0,0,0,0.28))'
            }} />
            {heroVariant === 'logo' && brandLogoUrl && (
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `url(${brandLogoUrl})`,
                  backgroundRepeat: 'repeat',
                  backgroundSize: '160px 160px'
                }}
              />
            )}
          </div>
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <div className="backdrop-blur-sm/20 text-center px-4 py-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.65)' }}>
                  <h2 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--ink)' }}>{brandName}</h2>
                  <p className="text-xs md:text-sm" style={{ color: '#b91c1c' }}>{brandTagline}</p>
            </div>
          </div>
            {/* Divider */}
            <div className="w-full h-1.5" style={{ background: 'var(--muted)' }} />
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
                  if (!res.ok) {
                    const detail = await res.text().catch(() => '')
                    throw new Error(detail || `Publish failed (${res.status})`)
                  }
                  setToast('Published to live')
                } catch (e) {
                  const needsToken = typeof window !== 'undefined' && process.env.NODE_ENV === 'production' && !adminToken
                  const suffix = needsToken ? ' — add &token=YOUR_ADMIN_TOKEN to the URL and retry.' : ''
                  setToast((e instanceof Error ? e.message : 'Publish failed') + suffix)
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

      {/* Search & Filters (scroll with page) */}
      <div className="max-w-7xl mx-auto px-4 py-2">
        {/* Search Bar */}
        <div className="mb-3">
          <div className="flex items-center gap-2 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search menu items, tags, or categories..."
                className="w-full bg-white/80 border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-300"
                style={isDemoTenant ? { fontFamily: sansFont } : undefined}
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 lg:grid lg:grid-cols-12 lg:gap-8" style={{ color: 'var(--ink)' }}>
        {/* Current Category Chip */}
        <div className="lg:col-span-12 mb-4">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium" style={{ background: '#2a2a2a', color: '#f5f5f5' }}>
            Browsing: {selectedCategory || 'All'}
          </span>
        </div>
        {/* Category Sidebar */}
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

        {/* Menu Grid */}
        <div className="space-y-12 lg:col-span-9" id="top">
          {filteredCategories.map((category, idx) => (
            <div
              key={category.id}
              id={`cat-${category.id}`}
              className={`category-section scroll-mt-24 ${idx > 0 ? 'pt-8 border-t' : ''}`}
              style={{
                background: 'var(--card)',
                borderColor: 'var(--muted)',
                borderRadius: 12,
                padding: 12
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-extrabold tracking-widest uppercase inline-flex items-center gap-3" style={isDemoTenant ? { fontFamily: cursiveFont, color: 'var(--ink)' } : { color: 'var(--ink)' }}>
                    {getCategoryIcon(category.name)}
                    <span>{category.name}</span>
                  </h2>
                  {(() => {
                    const categoryImage = imageMap[`category:${category.id}`] || imageMap[`category:${category.name}`]
                    if (!categoryImage) return null
                    return (
                      <img
                        src={categoryImage}
                        alt={`${category.name} hero`}
                        className="hidden sm:block h-14 w-14 rounded-full object-cover border border-neutral-200"
                        loading="lazy"
                        decoding="async"
                      />
                    )
                  })()}
                </div>
                <div className="flex-1 ml-6" style={{ height: 2, background: accentSecondary ? `linear-gradient(90deg, ${accentSecondary}, transparent)` : 'linear-gradient(90deg, var(--accent), transparent)' }}></div>
              </div>
              {typeof categoryIntros[category.name] === 'string' && (
                <p className="text-sm mb-4" style={{ color: 'var(--ink)', opacity: 0.7 }}>{categoryIntros[category.name]}</p>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {category.items.map(item => (
                  <div 
                    key={item.id} 
                    className="menu-item border rounded-lg overflow-hidden transition-all duration-300 hover:-translate-y-1"
                    style={{ 
                      borderRadius: 'var(--radius)', 
                      background: 'var(--card)', 
                      borderColor: 'var(--muted)',
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
                        {isAdmin ? (
                          <input
                            className="text-xl font-semibold text-black leading-tight w-full mr-4 border border-gray-300 rounded px-2 py-1"
                            value={item.name}
                            onChange={e => updateItemField(category.id, item.id, 'name', e.target.value)}
                          />
                        ) : (
                          <h3 className="text-xl font-semibold text-black leading-tight" style={isDemoTenant ? { fontFamily: cursiveFont } : undefined}>
                            {highlightText(item.name, searchQuery)}
                            {typeof item.calories === 'number' && (
                              <span className="ml-2 align-middle text-sm font-normal text-gray-500" style={isDemoTenant ? { fontFamily: sansFont } : undefined}>{item.calories} cal</span>
                            )}
                          </h3>
                        )}
                        {isAdmin ? (
                          <input
                            type="number"
                            step="0.01"
                            className="w-28 text-right text-xl font-bold text-black ml-4 border border-gray-300 rounded px-2 py-1"
                            value={Number(item.price).toString()}
                            onChange={e => updateItemField(category.id, item.id, 'price', e.target.value)}
                          />
                        ) : (
                          <div className="flex flex-col items-end ml-4">
                            <span className="text-xl font-semibold text-black" style={isDemoTenant ? { color: '#27272a', fontFamily: sansFont } : {}}>${item.price.toFixed(2)}</span>
                            {isDemoTenant && (
                              <span
                                className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em]"
                                style={{
                                  background: 'linear-gradient(135deg, rgba(4,106,56,0.9), rgba(255,255,255,0.95), rgba(200,16,46,0.9))',
                                  color: '#0b0b0b',
                                  fontFamily: sansFont,
                                }}
                              >
                                {category.name}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      {!isAdmin && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {getItemBadges(item).map(badge => (
                            <span key={badge} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border" style={{ borderColor:'rgba(0,0,0,0.12)', color:'#6b7280', ...(isDemoTenant ? { fontFamily: sansFont } : {}) }}>{badge}</span>
                          ))}
                        </div>
                      )}
                      
                      {isAdmin ? (
                        <div className="space-y-2 mb-4">
                          <textarea
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-black"
                            placeholder="Description"
                            value={item.description || ''}
                            onChange={e => updateItemField(category.id, item.id, 'description', e.target.value)}
                          />
                          <input
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-black"
                            placeholder="Image URL"
                            value={item.imageUrl || ''}
                            onChange={e => updateItemField(category.id, item.id, 'imageUrl', e.target.value)}
                          />
                        </div>
                      ) : (
                        <p className="text-gray-600 text-sm leading-relaxed italic mb-4" style={isDemoTenant ? { fontFamily: sansFont } : undefined}>
                          {highlightText(item.description, searchQuery)}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between gap-3" style={isDemoTenant ? { fontFamily: sansFont } : undefined}>
                        <div className="flex-1 min-w-0 flex flex-wrap gap-1">
                          {isAdmin ? (
                            <>
                              <input
                                type="number"
                                placeholder="cal"
                                className="w-20 px-2 py-1 text-xs border border-gray-300 rounded text-black"
                                value={item.calories ?? ''}
                                onChange={e => updateItemField(category.id, item.id, 'calories', e.target.value === '' ? undefined : Number(e.target.value))}
                              />
                              {(item.tags || []).map(tag => (
                                <span key={tag} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-normal text-gray-700 border border-gray-300 bg-gray-100">
                                  {tag}
                                  <button aria-label="Remove tag" onClick={() => removeTag(category.id, item.id, tag)} className="ml-1 text-gray-500 hover:text-black">×</button>
                                </span>
                              ))}
                              <input
                                className="px-2 py-1 text-xs border border-gray-300 rounded text-black"
                                placeholder="Add tag (Enter)"
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    const v = (e.target as HTMLInputElement).value
                                    addTag(category.id, item.id, v)
                                    ;(e.target as HTMLInputElement).value = ''
                                  }
                                }}
                              />
                            </>
                          ) : (
                            <>
                              {item.calories && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-normal text-gray-500 border border-gray-300 bg-transparent" style={isDemoTenant ? { fontFamily: sansFont } : undefined}>
                                  {item.calories} cal
                                </span>
                              )}
                              {(item.tags || []).map(tag => (
                                <span 
                                  key={tag} 
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-normal text-gray-500 border border-gray-300 bg-transparent"
                                  style={isDemoTenant ? { fontFamily: sansFont } : undefined}
                                >
                                  {tag}
                                </span>
                              ))}
                            </>
                          )}
                        </div>
                        
                        <div className="shrink-0 flex items-center gap-2">
                          {!hideCart && (
                            <button
                              onClick={() => {
                                addToCart(item)
                                setRecentlyAddedId(item.id)
                                setCartBump(true)
                                setToast(`Added ${item.name}`)
                                setTimeout(() => setRecentlyAddedId(prev => (prev===item.id?null:prev)), 600)
                              }}
                              className={`text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-200 flex items-center gap-1 justify-center whitespace-nowrap min-w-[140px] ${recentlyAddedId===item.id ? 'animate-bump ring-2 ring-red-500' : ''}`}
                              style={{ background: 'var(--accent)' }}
                            >
                              {recentlyAddedId===item.id ? '✓ Added' : 'Add to Plate'}
                            </button>
                          )}
                          <button
                            onClick={() => { setIsAssistantOpen(true); void sendAssistantMessage(`Tell me about ${item.name}`) }}
                            className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 text-black flex items-center gap-2 whitespace-nowrap"
                            aria-label={`Ask about ${item.name}`}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M3 12 C 7 6, 17 6, 21 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M3 12 C 7 18, 17 18, 21 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                              <circle cx="12" cy="12" r="1.6" fill="currentColor"/>
                            </svg>
                            <span>Ask AI</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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

      {/* AI Assistant Button */}
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
                        <p className="text-sm text-gray-600">${cartItem.item.price.toFixed(2)} each</p>
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
                            ${(cartItem.item.price * cartItem.quantity).toFixed(2)}
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
                    ${cartTotal.toFixed(2)}
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

      {isDemoTenant && showDemoAcknowledgement && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
          <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'linear-gradient(120deg, rgba(0,0,0,0.65), rgba(31,41,55,0.7))' }} />
          <div className="relative max-w-lg w-full bg-white rounded-3xl shadow-2xl p-8 text-center space-y-4 border border-black/10" style={{ fontFamily: sansFont }}>
            <h2 className="text-2xl font-semibold text-gray-900">Demo Experience Reminder</h2>
            <p className="text-sm text-gray-600 leading-6">
              This is a live demonstration. Your restaurant’s menu will be customized with your branding,
              items, layout, and even the personality of your personal AI assistant.
            </p>
            <p className="text-sm text-gray-600 leading-6">
              Explore the demo to see what’s possible, then imagine it tailored precisely to your business.
            </p>
            <button
              onClick={() => {
                setShowDemoAcknowledgement(false)
                try { localStorage.setItem(demoAcknowledgeKey, '1') } catch {}
              }}
              className="mt-2 inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-semibold text-white shadow-lg transition-all"
              style={{ background: 'linear-gradient(135deg, rgba(220,38,38,0.95), rgba(34,197,94,0.95))' }}
            >
              Got it — explore the demo
            </button>
          </div>
        </div>
      )}
    </>
  )
}

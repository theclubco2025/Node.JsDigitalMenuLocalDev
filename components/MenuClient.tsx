"use client"

import { useState, useMemo, useEffect, useRef } from 'react'
import useSWR from 'swr'
import { MenuResponse, MenuItem } from '@/types/api'

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
  const plateButtonRef = useRef<HTMLButtonElement | null>(null)
  const [platePile, setPlatePile] = useState<Array<{ itemId: string; src: string }>>([])
  type Flyer = { key: string; src: string; startX: number; startY: number; dx: number; dy: number; moved: boolean }
  const [flyers, setFlyers] = useState<Flyer[]>([])

  // Get tenant/admin from URL params
  const isBrowser = typeof window !== 'undefined'
  const searchParams = isBrowser ? new URLSearchParams(window.location.search) : null
  const tenant = isBrowser
    ? (searchParams!.get('tenant') || process.env.NEXT_PUBLIC_DEFAULT_TENANT || 'benes')
    : 'benes'
  const isAdmin = isBrowser ? searchParams!.get('admin') === '1' : false

  // Tenant flags
  const isBenes = useMemo(() => {
    const slug = (tenant || '').toLowerCase()
    return slug === 'benes' || slug === 'benes-draft'
  }, [tenant])

  // Tenant config (brand/theme/images)
  const { data: cfg } = useSWR<{ brand?: any; theme?: any; images?: Record<string,string>; style?: any; copy?: any }>(`/api/tenant/config?tenant=${tenant}`, fetcher)
  const brand = cfg?.brand || {}
  const theme = cfg?.theme || null
  const imageMap: Record<string,string> = cfg?.images || {}
  const styleCfg = cfg?.style || {}
  const copy = cfg?.copy || {}
  const brandLogoUrl = (brand?.header?.logoUrl || brand?.logoUrl || '') as string
  const brandName = (brand?.name || 'Menu') as string
  const brandTagline = (brand?.tagline || '') as string
  const styleVariant = (styleCfg?.heroVariant || '').toLowerCase()
  const navVariant = (styleCfg?.navVariant || '').toLowerCase()
  const features = {
    chipScroller: navVariant === 'chipscroller',
    signatureGrid: Boolean(styleCfg?.flags?.signatureGrid ?? (styleVariant === 'logobanner')),
    chefNotes: Boolean(styleCfg?.flags?.chefNotes ?? true),
    priceRibbons: Boolean(styleCfg?.flags?.priceRibbons ?? true),
    imageBadges: Boolean(styleCfg?.flags?.imageBadges ?? true),
    specialsRibbon: Boolean(styleCfg?.flags?.specials ?? true),
    pairingNotes: Boolean(styleCfg?.flags?.pairings ?? true),
    badgeText: styleCfg?.badges || {},
    accentSecondary: styleCfg?.accentSecondary || '#b63a2b'
  }

  // Ensure themed CSS variables exist on first paint, especially for Benes on mobile
  const effectiveTheme = useMemo(() => {
    const t: any = theme || {}
    if (isBenes) {
      return {
        primary: t.primary || '#0f1e17',
        bg: t.bg || t.primary || '#0f1e17',
        text: t.text || '#f3f5f0',
        ink: t.ink || '#101010',
        card: t.card || '#ffffff',
        muted: t.muted || '#e7e0d3',
        accent: t.accent || '#ef4444'
      }
    }
    return t
  }, [theme, isBenes])

  const accentColor = effectiveTheme?.accent || '#a53329'
  const accentSecondary = features.accentSecondary || '#a53329'

  // Apply theme from config
  useEffect(() => {
    if (typeof window === 'undefined') return
    const t = theme || {}
    const bg = t.bg || t.primary
    if (bg) document.body.style.setProperty('--bg', bg)
    if (t.text) document.body.style.setProperty('--text', t.text)
    if (t.ink) document.body.style.setProperty('--ink', t.ink)
    if (t.card) document.body.style.setProperty('--card', t.card)
    if (t.muted) document.body.style.setProperty('--muted', t.muted)
    if (t.accent) document.body.style.setProperty('--accent', t.accent)
  }, [theme])

  const { data: menuData, error, isLoading } = useSWR<MenuResponse>(
    `/api/menu?tenant=${tenant}`,
    fetcher
  )

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

  const updateItemField = (categoryId: string, itemId: string, field: keyof MenuItem, value: any) => {
    if (!editableMenu) return
    setEditableMenu(prev => {
      if (!prev) return prev
      const next: MenuResponse = JSON.parse(JSON.stringify(prev))
      for (const cat of next.categories) {
        if (cat.id === categoryId) {
          const idx = cat.items.findIndex(i => i.id === itemId)
          if (idx !== -1) {
            ;(cat.items[idx] as any)[field] = field === 'price' ? Number(value) : value
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
      const res = await fetch('/api/tenant/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant, menu: editableMenu })
      })
      if (!res.ok) throw new Error('Save failed')
      setToast('Saved changes')
    } catch (e) {
      setToast('Error saving changes')
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
            const tags = (item.tags || []).slice()
            if (!tags.includes(tag)) tags.push(tag)
            item.tags = tags
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
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-yellow-200 px-1 rounded">{part}</mark>
        : part
    )
  }

  const launchFlyToPlate = (item: MenuItem) => {
    if (typeof window === 'undefined') return
    const img = document.getElementById(`img-${item.id}`) as HTMLImageElement | null
    const plateBtn = plateButtonRef.current
    if (!img || !plateBtn) return
    const imgRect = img.getBoundingClientRect()
    const btnRect = plateBtn.getBoundingClientRect()
    const startX = imgRect.left + imgRect.width / 2
    const startY = imgRect.top + imgRect.height / 2
    const endX = btnRect.left + btnRect.width / 2
    const endY = btnRect.top + btnRect.height / 2
    const key = `${item.id}-${Date.now()}-${Math.random()}`
    const src = item.imageUrl || `https://via.placeholder.com/120/cccccc/333333?text=${encodeURIComponent(item.name)}`
    setFlyers(prev => [...prev, { key, src, startX, startY, dx: endX - startX, dy: endY - startY, moved: false }])
    // trigger transition on next frame
    requestAnimationFrame(() => {
      setFlyers(prev => prev.map(f => f.key === key ? { ...f, moved: true } : f))
    })
    // cleanup after animation
    setTimeout(() => {
      setFlyers(prev => prev.filter(f => f.key !== key))
    }, 700)
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
    // remove from plate pile if present
    setPlatePile(prev => prev.filter(p => p.itemId !== itemId))
  }

  const updateCartQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }
    setCart(prev => prev.map(cartItem =>
      cartItem.item.id === itemId ? { ...cartItem, quantity } : cartItem
    ))
    if (quantity === 1) {
      // ensure plate pile has this item
      const target = cart.find(c => c.item.id === itemId)?.item
      if (target) {
        const src = target.imageUrl || `https://via.placeholder.com/120/cccccc/333333?text=${encodeURIComponent(target.name)}`
        setPlatePile(prev => {
          if (prev.some(p => p.itemId === itemId)) return prev
          const filtered = prev.filter(p => p.itemId !== itemId)
          return [...filtered.slice(-2), { itemId, src }]
        })
      }
    }
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
          filters: {}
        })
      })

      const data = await response.json()
      const assistantText = data.text || data.response || data.message || 'Thanks for your question.'
      setChatHistory(prev => [...prev, { role: 'assistant', message: assistantText }])
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'assistant', message: 'Sorry, I had trouble processing your request.' }])
    }
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.item.price * item.quantity), 0)
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const dietaryOptions = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'nut-free']
  
  const scrollTo = (elementId: string) => {
    if (typeof window === 'undefined') return
    const el = document.getElementById(elementId)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  
  // Note: avoid early returns before hooks to keep hook order stable

  const categories = menuData?.categories || []
  const allCategories = categories.map(cat => cat.name)

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

  const rootStyle = {
    background: 'var(--bg)',
    color: 'var(--text)',
    ['--bg' as any]: effectiveTheme?.bg,
    ['--text' as any]: effectiveTheme?.text,
    ['--ink' as any]: effectiveTheme?.ink,
    ['--card' as any]: effectiveTheme?.card,
    ['--muted' as any]: effectiveTheme?.muted,
    ['--accent' as any]: effectiveTheme?.accent,
    ...(isBenes ? {
      background: '#ffffff'
    } : {})
  } as React.CSSProperties

  // Benes-specific featured picks and pairings
  const featuredItemIds: string[] = isBenes ? (
    Array.isArray(styleCfg?.featuredIds) && styleCfg.featuredIds.length > 0
      ? styleCfg.featuredIds
      : ['i-margherita-napoletana-14', 'i-fettuccine-bolognese', 'i-prosciutto-arugula-14']
  ) : []
  const pairingsById: Record<string, string> = isBenes ? {
    'i-fettuccine-bolognese': 'Pairs with Zinfandel',
    'i-margherita-napoletana-14': 'Pairs with Chianti',
    'i-prosciutto-arugula-14': 'Pairs with Pinot Grigio',
    'i-lasagna': 'Pairs with Sangiovese'
  } : {}
  function cardStyleForCategory(categoryName: string): React.CSSProperties {
    if (!isBenes) return {}
    if (/pizza/i.test(categoryName)) {
      return {
        backgroundColor: '#ffffff',
        borderColor: 'rgba(164,51,41,0.10)'
      }
    }
    if (/pasta/i.test(categoryName)) {
      return {
        background: '#fffdfa',
        borderColor: 'rgba(164,51,41,0.12)',
        boxShadow: '0 4px 12px rgba(164,51,41,0.06)'
      }
    }
    if (/calzone|antipasti/i.test(categoryName)) {
      return {
        background: '#fffefb',
        borderColor: 'rgba(0,0,0,0.06)'
      }
    }
    return {}
  }
  function getItemBadges(item: any): string[] {
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
    const items: Array<{ id: string; name: string; price: number; imageUrl?: string; categoryName?: string }> = []
    if (!menuData?.categories) return items
    const idToItem: Record<string, any> = {}
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
      for (const cat of menuData.categories) {
        for (const it of cat.items) {
          if (items.find(x => x.id === it.id)) continue
          items.push({ ...it, categoryName: cat.name })
          if (items.length >= 3) break
        }
        if (items.length >= 3) break
      }
    }
    return items
  }

  const specialsText = copy?.specials || 'Margherita 14\", Fettuccine Bolognese, Prosciutto & Arugula'
  const badgeText = (features.badgeText?.category || copy?.badges?.category || brandName)
  const cardAccentText = features.priceRibbons && isBenes ? '#1c2c24' : 'var(--ink)'

  return (
    <div className="min-h-screen" style={rootStyle}>
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
            height: isBenes ? 160 : 72,
            borderBottom: isBenes ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)'
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
                <h1 className="text-2xl font-bold text-white tracking-wide" style={{ fontFamily: 'var(--font-italian)' }}>{brandName}</h1>
                <p className="text-gray-200 text-xs">{brandTagline}</p>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Spacer to offset fixed header height */}
      <div style={{ height: isBenes ? 180 : 80 }} />
      {isBenes && (
        <div className="relative">
          <div className="w-full h-1.5" style={{ background:'linear-gradient(90deg, #128807 0% 33.33%, #ffffff 33.33% 66.66%, #b91c1c 66.66% 100%)' }} />
          {copy?.heroSubtitle && (
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex flex-wrap items-center justify-between gap-3 py-3">
                <p className="text-sm text-gray-600 italic" style={{ fontFamily:'var(--font-serif)' }}>{copy.heroSubtitle}</p>
                {brand?.established && (
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-gray-500">
                    <span className="w-8 h-px bg-gray-300" />
                    <span>{brand.established}</span>
                    <span className="w-8 h-px bg-gray-300" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Category chip scroller */}
      {features.chipScroller && (
        <div className="w-full sticky top-[160px] z-40" style={{ background:'rgba(255,255,255,0.96)', boxShadow:'0 6px 18px rgba(16,16,16,0.08)', borderBottom:'1px solid rgba(164,51,41,0.18)' }}>
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between py-3">
              <div className="text-sm uppercase tracking-[0.28em] text-gray-500 hidden md:block">Navigate</div>
              <div className="text-xs text-gray-500 md:hidden uppercase tracking-[0.25em]">Menu</div>
              <button
                onClick={() => {
                  setSelectedCategory(null)
                  const el = document.getElementById('top')
                  if (el) el.scrollIntoView({ behavior:'smooth', block:'start' })
                }}
                className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500"
              >
                View All
              </button>
            </div>
            <div className="no-scrollbar overflow-x-auto pb-3 -mx-2 px-2 flex gap-2">
              {(menuData?.categories || []).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.name === selectedCategory ? null : cat.name)
                    const el = document.getElementById(`cat-${cat.id}`)
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }}
                  className={`px-4 py-1.5 rounded-full text-sm border transition-colors whitespace-nowrap font-semibold ${activeCategoryId===cat.id ? 'bg-[var(--accent)] text-black border-[var(--accent)]' : 'bg-white text-black'}`}
                  style={{ borderColor: activeCategoryId===cat.id ? undefined : accentColor, boxShadow: activeCategoryId===cat.id ? '0 4px 12px rgba(164,51,41,0.25)' : undefined, fontFamily:'var(--font-serif)' }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hero banner */}
      {styleVariant === 'logobanner' && (
        <div className="max-w-7xl mx-auto px-4 mb-6">
          <div
            className="relative w-full h-40 md:h-56 rounded-xl overflow-hidden border"
            style={{ borderColor: 'rgba(164,51,41,0.12)', boxShadow: '0 4px 14px rgba(16,16,16,0.06)', background:'#ffffff' }}
          >
            {brandLogoUrl && (
              <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `url(${brandLogoUrl})`, backgroundRepeat: 'repeat', backgroundSize: '180px 180px' }} />
            )}
            <div className="relative h-full flex flex-col md:flex-row items-center justify-between px-5">
              <div className="max-w-lg text-center md:text-left">
                {copy?.tagline && (
                  <div className="text-lg md:text-xl font-semibold" style={{ color: '#121212', fontFamily:'var(--font-serif)' }}>{copy.tagline}</div>
                )}
                {copy?.heroSubtitle && (
                  <p className="text-sm text-gray-600 mt-3" style={{ fontFamily:'var(--font-serif)', letterSpacing:'0.08em' }}>{copy.heroSubtitle}</p>
                )}
              </div>
              <div className="hidden md:flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-gray-400">
                <span>Verde</span>
                <span>•</span>
                <span>Bianco</span>
                <span>•</span>
                <span>Rosso</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Specials ribbon */}
      {features.specialsRibbon && (
        <div className="max-w-7xl mx-auto px-4 mb-4">
          <div className="rounded-md px-4 py-3 text-sm flex flex-col md:flex-row md:items-center md:justify-between gap-2" style={{ background:'#fff5f3', border:`1px solid ${accentColor}2b`, color:'#3a1f1c' }}>
            <div>
              <div className="text-[0.65rem] uppercase tracking-[0.26em]" style={{ color:'#5a5a5a' }}>Tonight’s Specials</div>
              <div className="mt-1 font-semibold" style={{ fontFamily:'var(--font-serif)', color:'#2e3e38' }}>{specialsText}</div>
            </div>
            <button
              className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] font-semibold"
              style={{ color: accentSecondary }}
              onClick={() => {
                const el = document.getElementById('top')
                if (el) el.scrollIntoView({ behavior:'smooth', block:'start' })
              }}
            >
              View Menu
            </button>
          </div>
        </div>
      )}

      {/* Signature Picks */}
      {features.signatureGrid && (
        <div className="max-w-7xl mx-auto px-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg md:text-xl font-semibold" style={{ fontFamily: 'var(--font-serif)', color: '#101010' }}>Signature Picks</h3>
              <p className="text-xs text-gray-500 uppercase tracking-[0.2em]">House Favorites • Tradizione</p>
            </div>
            <div className="flex-1 ml-4 hidden sm:block" style={{ height: 2, background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {resolveFeatured().map((it) => {
              const src = imageMap[it.id] || (it as any).imageUrl || ''
              return (
                <div key={it.id} className="relative rounded-xl overflow-hidden border bg-white" style={{ borderColor: `${accentColor}2b`, boxShadow: '0 6px 16px rgba(16,16,16,0.08)' }}>
                  {src && (
                    <img src={src} alt={it.name} className="w-full h-44 object-cover" loading="lazy" decoding="async" />
                  )}
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold" style={{ fontFamily: 'var(--font-serif)', color:'#101010' }}>{it.name}</div>
                        {pairingsById[it.id] && (
                          <div className="text-xs text-gray-600 mt-0.5" style={{ fontFamily: 'var(--font-serif)' }}>{pairingsById[it.id]}</div>
                        )}
                      </div>
                      <div className="text-sm font-bold px-2 py-0.5 rounded-full text-white" style={{ background:`linear-gradient(180deg, ${accentSecondary}, #8c241a)` }}>${Number((it as any).price).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              )}
            )}
          </div>
        </div>
      )}

      {/* Hero section (hidden for Benes to keep a single compact header) */}
      {!isBenes && (
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
            {/* Italian overlay gradient */}
            <div className="w-full h-full" style={{
              background: 'linear-gradient(90deg, rgba(107,33,24,0.55), rgba(255,255,255,0.25), rgba(164,51,41,0.55))'
            }} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center px-4">
            <div className="backdrop-blur-sm/20 text-center px-4 py-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.65)' }}>
              <h2 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--ink)' }}>{brand.name}</h2>
              <p className="text-xs md:text-sm" style={{ color: '#b91c1c' }}>{brand.tagline}</p>
            </div>
          </div>
          {/* Tricolor divider bar */}
          <div className="w-full h-1.5 flex">
            <div className="flex-1" style={{ background: '#14532d' }} />
            <div className="flex-1" style={{ background: '#ffffff' }} />
            <div className="flex-1" style={{ background: '#b91c1c' }} />
          </div>
        </div>
      )}

      {/* Admin Edit Bar */}
      {isAdmin && (
        <div className="sticky top-0 z-40 bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3">
            <span className="text-sm text-yellow-900 font-medium">Inline Edit Mode</span>
            <button onClick={saveAllEdits} className="px-3 py-1 rounded text-sm" style={{ background: 'var(--accent)', color: '#0b0b0b' }}>Save All</button>
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
            style={selectedCategory===null?{background:accentColor, color:'#0b0b0b'}:{ background:'#ffffff', color:'var(--ink)', border:`1px solid ${accentColor}` } }
          >
            All Categories
          </button>
          {allCategories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
              className="px-4 py-2 rounded-full text-sm font-bold transition-all duration-200"
              style={selectedCategory===category?{background:accentColor, color:'#0b0b0b'}:{ background:'#ffffff', color:'var(--ink)', border:`1px solid ${accentColor}` } }
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
              className={`category-section scroll-mt-24 ${idx > 0 ? 'pt-8 border-t border-white/10' : ''}`}
              style={{
                background: isBenes
                  ? '#ffffff'
                  : 'linear-gradient(90deg, rgba(20,83,45,0.03) 0% 33.33%, rgba(255,255,255,0.03) 33.33% 66.66%, rgba(185,28,28,0.03) 66.66% 100%)',
                borderRadius: 12,
                padding: isBenes ? 14 : 12,
                border: isBenes ? '1px solid rgba(164,51,41,0.08)' : undefined
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  {features.chefNotes && badgeText && (
                    <span className="px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.18em]" style={{ background:`${accentSecondary}14`, color: accentSecondary, border:`1px solid ${accentSecondary}33` }}>
                      {badgeText}
                    </span>
                  )}
                  <h2 className="text-xl md:text-2xl font-semibold text-black uppercase inline-flex items-center gap-3" style={{ fontFamily: 'var(--font-serif)', letterSpacing:'0.14em' }}>
                  {getCategoryIcon(category.name)}
                  <span>{category.name}</span>
                </h2>
              </div>
                <div className="hidden md:block flex-1 ml-6" style={{ height: 1, background: 'linear-gradient(90deg, rgba(16,16,16,0.06), transparent)' }}></div>
              </div>
              {features.chefNotes && copy?.categoryIntros?.[category.name] && (
                <div className="mb-4">
                  <p className="text-gray-600 text-sm" style={{ fontFamily: 'var(--font-serif)' }}>{copy.categoryIntros[category.name]}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {category.items.map(item => (
                  <div 
                    key={item.id} 
                    className="menu-item border rounded-lg overflow-hidden transition-all duration-200 hover:-translate-y-1 group"
                    style={Object.assign({
                      borderRadius: 'var(--radius)',
                      background: isBenes ? '#ffffff' : 'var(--card)',
                      borderColor: isBenes ? 'rgba(63,93,79,0.15)' : 'var(--muted)',
                      boxShadow: isBenes ? '0 3px 10px rgba(16,16,16,0.04)' : undefined
                    }, cardStyleForCategory(category.name))}
                  >
                    {(() => {
                      const src = imageMap[item.id] || item.imageUrl || ''
                      if (!src) return null
                      return (
                        <div className="bg-gray-50">
                      <img 
                        id={`img-${item.id}`}
                            src={src}
                        alt={item.name}
                            className="w-full h-52 object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                            loading="lazy" decoding="async"
                      />
                          {features.imageBadges && (
                            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] uppercase" style={{ background: accentSecondary, color:'#fff', fontFamily:'var(--font-serif)' }}>Signature</div>
                          )}
                    </div>
                      )
                    })()}
                    
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-2.5">
                        {isAdmin ? (
                          <input
                            className="text-xl font-semibold text-black leading-tight w-full mr-4 border border-gray-300 rounded px-2 py-1"
                            value={item.name}
                            onChange={e => updateItemField(category.id, item.id, 'name', e.target.value)}
                          />
                        ) : (
                          <h3 className="text-lg font-semibold text-black leading-tight" style={{ fontFamily: 'var(--font-serif)' }}>
                            {highlightText(item.name, searchQuery)}
                            <span className="ml-2 align-middle text-sm font-normal text-gray-500">
                              ({typeof item.calories === 'number' ? `${item.calories} cal` : 'cal N/A'})
                            </span>
                          </h3>
                        )}
                        {isAdmin ? (
                          <input
                            type="number"
                            step="0.01"
                            className="w-24 text-right text-lg font-bold text-black ml-4 border border-gray-300 rounded px-2 py-1"
                            value={Number(item.price).toString()}
                            onChange={e => updateItemField(category.id, item.id, 'price', e.target.value)}
                          />
                        ) : (
                          <span className="text-lg font-semibold text-black ml-4 px-2 py-0.5 rounded-full" style={{ background: features.priceRibbons && isBenes ? `${accentColor}1a` : undefined, color: cardAccentText, fontFamily:'var(--font-serif)' }}>${item.price.toFixed(2)}</span>
                        )}
                      </div>
                      {!isAdmin && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {getItemBadges(item).map(b => (
                            <span key={b} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border" style={{ borderColor:`${accentSecondary}33`, color: accentSecondary, background:`${accentSecondary}0d` }}>{b}</span>
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
                        <p className="text-gray-600 text-sm leading-relaxed mb-4" style={{ fontFamily:'var(--font-serif)' }}>
                          {highlightText(item.description, searchQuery)}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0 flex flex-wrap gap-1">
                          {!isAdmin && features.pairingNotes && pairingsById[item.id] && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs" style={{ color: accentSecondary, border:`1px solid ${accentSecondary}33`, fontFamily:'var(--font-serif)' }}>
                              {pairingsById[item.id]}
                                </span>
                          )}
                        </div>
                        
                        <div className="shrink-0 flex items-center gap-2">
                        <button
                          onClick={() => {
                            addToCart(item)
                            setRecentlyAddedId(item.id)
                            setCartBump(true)
                            setToast(`Added ${item.name}`)
                            setTimeout(() => setRecentlyAddedId(prev => (prev===item.id?null:prev)), 600)
                            launchFlyToPlate(item)
                            const thumb = item.imageUrl || `https://via.placeholder.com/120/cccccc/333333?text=${encodeURIComponent(item.name)}`
                            setPlatePile(prev => {
                              const filtered = prev.filter(p => p.itemId !== item.id)
                              return [...filtered.slice(-2), { itemId: item.id, src: thumb }]
                            })
                          }}
                            className={`text-white px-3.5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1 justify-center whitespace-nowrap min-w-[120px]`}
                            style={{
                              background: isBenes ? `linear-gradient(180deg, ${accentColor}, #2f423a)` : 'var(--accent)',
                              boxShadow: isBenes ? `0 3px 10px ${accentSecondary}33` : undefined,
                              border: recentlyAddedId===item.id ? `2px solid ${accentSecondary}66` : 'none'
                            }}
                        >
                          {recentlyAddedId===item.id ? '✓ Added' : 'Add to Plate'}
                        </button>
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
                          <span>Ask</span>
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

      {/* Floating Plate Button with hover preview */}
      <div
        className="fixed bottom-6 right-6 z-50"
        onMouseEnter={() => {/* open preview on hover */}}
        onMouseLeave={() => {/* close preview handled by CSS hover state */}}
      >
        <div className="group relative">
          <button
            onClick={() => setIsCartOpen(true)}
            ref={plateButtonRef}
            className={`relative text-white px-6 py-3 rounded-full shadow-lg transition-all duration-200 flex items-center gap-2 ${cartBump ? 'animate-bump' : ''}`}
            style={{background:'var(--accent)', color:'#0b0b0b'}}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span className="font-medium">Plate ({cartItemCount})</span>
            {cartItemCount > 0 && (
              <span className="font-bold">${cartTotal.toFixed(2)}</span>
            )}
            {/* Plate pile thumbnails */}
            {platePile.length > 0 && (
              <div className="absolute -top-3 -right-3 flex -space-x-2 pointer-events-none">
                {platePile.map((p, i) => (
                  <img key={`${p.itemId}-${i}`} src={p.src} alt="" className="w-6 h-6 rounded-full border border-white object-cover shadow" />
                ))}
              </div>
            )}
          </button>
          {/* Hover preview */}
          {cart.length > 0 && (
            <div className="pointer-events-none absolute right-0 bottom-full mb-2 w-72 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150">
              <div className="bg-white text-black rounded-lg shadow-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <span className="text-sm font-semibold">Plate Preview</span>
                  <span className="text-sm font-medium">${cartTotal.toFixed(2)}</span>
                </div>
                <ul className="max-h-56 overflow-auto">
                  {cart.slice(0,3).map(ci => (
                    <li key={ci.item.id} className="px-4 py-2 text-sm flex items-center justify-between">
                      <span className="truncate mr-2">{ci.item.name}</span>
                      <span className="text-gray-600">×{ci.quantity}</span>
                    </li>
                  ))}
                  {cart.length > 3 && (
                    <li className="px-4 py-2 text-xs text-gray-500">+ {cart.length - 3} more items</li>
                  )}
                </ul>
                <div className="px-4 py-2 bg-gray-50 text-right">
                  <button onClick={() => setIsCartOpen(true)} className="text-sm font-medium text-black hover:underline pointer-events-auto">Open plate</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Assistant Button */}
      <button
        onClick={() => setIsAssistantOpen(true)}
        className="fixed bottom-6 left-6 p-3 rounded-full shadow-lg transition-all duration-200 z-50"
        style={{background: accentColor, color:'#0b0b0b'}}
        aria-label="Open assistant"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 12 C 7 6, 17 6, 21 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 12 C 7 18, 17 18, 21 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="12" r="1.6" fill="currentColor"/>
        </svg>
      </button>

      {/* Floating flyers for add-to-plate animation */}
      {flyers.map(f => (
        <img
          key={f.key}
          src={f.src}
          className="fixed w-10 h-10 rounded-full object-cover z-[60] pointer-events-none transition-transform duration-700 ease-out shadow"
          style={{
            left: 0,
            top: 0,
            transform: `translate(${f.startX}px, ${f.startY}px) ${f.moved ? `translate(${f.dx}px, ${f.dy}px) scale(0.4)` : ''}`,
            border: '2px solid white'
          }}
          alt=""
        />
      ))}

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
                    <li>"What vegetarian options do you have?"</li>
                    <li>"Is the pasta gluten-free?"</li>
                    <li>"What's your most popular dish?"</li>
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

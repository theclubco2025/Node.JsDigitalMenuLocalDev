
"use client"

/* eslint-disable @next/next/no-img-element */

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
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

type OrderingScheduling = {
  enabled?: boolean
  slotMinutes?: number
  leadTimeMinutes?: number
}

type OrderingSettings = {
  enabled?: boolean
  fulfillment?: 'pickup'
  timezone?: string
  scheduling?: OrderingScheduling
  hours?: unknown
}

type TenantConfig = {
  brand?: TenantBrand
  theme?: TenantTheme
  images?: Record<string, string>
  style?: TenantStyleFlags
  copy?: Record<string, unknown>
  ordering?: OrderingSettings
}

type ThemeCSSVariables = React.CSSProperties & Record<'--bg' | '--text' | '--ink' | '--card' | '--muted' | '--accent', string | undefined>

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function MenuClient() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedDietaryFilters, setSelectedDietaryFilters] = useState<string[]>([])
  const [cart, setCart] = useState<Array<{ item: MenuItem; quantity: number; addOns: Array<{ name: string; priceDeltaCents: number }>; note: string }>>([])
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
  // Live slug: independentbarandgrille
  // Draft slug: independent-draft
  const isIndependentDraft = tenant === 'independent-draft' || tenant === 'independentbarandgrille'
  const flyToPlateEnabled = tenant === 'independentbarandgrille' || tenant === 'independent-draft'
  const plateButtonRef = useRef<HTMLButtonElement | null>(null)
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
  const imageMap = useMemo(() => cfg?.images ?? {}, [cfg?.images])
  const copy = cfg?.copy as Record<string, unknown> | undefined
  const styleCfg = cfg?.style
  const orderingCfg = cfg?.ordering
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
          
          // Search filter (name + tags; descriptions are hidden)
          if (searchQuery) {
            const searchLower = searchQuery.toLowerCase()
            const matchesName = item.name.toLowerCase().includes(searchLower)
            const matchesTags = (item.tags || []).some(tag => tag.toLowerCase().includes(searchLower))
            if (!matchesName && !matchesTags) return false
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

  const cartTotalCents = cart.reduce((sum, line) => {
    const base = Math.round((line.item.price || 0) * 100)
    const addOnCents = (line.addOns || []).reduce((s, a) => s + (a.priceDeltaCents || 0), 0)
    return sum + (base + addOnCents) * line.quantity
  }, 0)

  // Live testing: allow Independent to exercise ordering UI on production even if DB config lags.
  const forceOrderingUi = tenant === 'independentbarandgrille'
  const orderingEnabled = orderingCfg?.enabled === true || forceOrderingUi
  const orderingPaused = (orderingCfg as unknown as { paused?: boolean } | undefined)?.paused === true
  const orderingPauseMessage =
    (orderingCfg as unknown as { pauseMessage?: unknown } | undefined)?.pauseMessage
  const orderingPauseText = typeof orderingPauseMessage === 'string' && orderingPauseMessage.trim()
    ? orderingPauseMessage.trim()
    : 'Ordering is temporarily paused. Please try again later.'
  const orderingTimezone = (typeof orderingCfg?.timezone === 'string' && orderingCfg?.timezone.trim())
    ? orderingCfg.timezone.trim()
    : 'America/Los_Angeles'
  const slotMinutes = typeof orderingCfg?.scheduling?.slotMinutes === 'number' ? orderingCfg!.scheduling!.slotMinutes! : 15
  const leadTimeMinutes = typeof orderingCfg?.scheduling?.leadTimeMinutes === 'number' ? orderingCfg!.scheduling!.leadTimeMinutes! : 30
  const schedulingEnabled = orderingCfg?.scheduling?.enabled !== false
  const dineInEnabled = (orderingCfg as unknown as { dineIn?: { enabled?: boolean } } | undefined)?.dineIn?.enabled === true
  const dineInLabel = String((orderingCfg as unknown as { dineIn?: { label?: unknown } } | undefined)?.dineIn?.label || 'Table number')
  const [pickupWhen, setPickupWhen] = useState<'asap' | 'scheduled'>('asap')
  const [scheduledForIso, setScheduledForIso] = useState<string>('') // ISO string
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [smsOptIn, setSmsOptIn] = useState(false)
  const [orderNote, setOrderNote] = useState('')
  const [tipPercent, setTipPercent] = useState<number>(15)
  const [customTip, setCustomTip] = useState('')
  const [tableNumber, setTableNumber] = useState('')
  const [fulfillmentMode, setFulfillmentMode] = useState<'pickup' | 'dinein'>('pickup')

  const tipCents = useMemo(() => {
    if (!orderingEnabled) return 0
    const raw = customTip.trim()
    if (raw) {
      const n = Number(raw)
      if (!Number.isFinite(n) || n <= 0) return 0
      return Math.min(25_000, Math.round(n * 100))
    }
    const pct = Math.max(0, Math.min(50, Math.floor(tipPercent || 0)))
    return Math.min(25_000, Math.round(cartTotalCents * (pct / 100)))
  }, [orderingEnabled, customTip, tipPercent, cartTotalCents])

  const orderTotalCents = cartTotalCents + tipCents
  const orderTotal = orderTotalCents / 100

  useEffect(() => {
    if (!dineInEnabled && fulfillmentMode === 'dinein') {
      setFulfillmentMode('pickup')
      setTableNumber('')
    }
  }, [dineInEnabled, fulfillmentMode])

  const contactStorageKey = useMemo(() => `order_contact_v1:${tenant}`, [tenant])
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(contactStorageKey)
      if (!raw) return
      const parsed = JSON.parse(raw) as { email?: string; name?: string; phone?: string }
      if (typeof parsed.email === 'string') setCustomerEmail(parsed.email)
      if (typeof parsed.name === 'string') setCustomerName(parsed.name)
      if (typeof parsed.phone === 'string') setCustomerPhone(parsed.phone)
    } catch {
      // ignore
    }
  }, [contactStorageKey])
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(contactStorageKey, JSON.stringify({
        email: customerEmail,
        name: customerName,
        phone: customerPhone,
      }))
    } catch {
      // ignore
    }
  }, [contactStorageKey, customerEmail, customerName, customerPhone])

  const emailOk = useMemo(() => {
    const e = customerEmail.trim()
    if (!e) return false
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
  }, [customerEmail])

  const dateKeyInTz = (ms: number, tz: string) => {
    const d = new Date(ms)
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d)
    const y = parts.find(p => p.type === 'year')?.value || '0000'
    const m = parts.find(p => p.type === 'month')?.value || '00'
    const day = parts.find(p => p.type === 'day')?.value || '00'
    return `${y}-${m}-${day}`
  }

  const availableSlots = useMemo(() => {
    if (!orderingEnabled || !schedulingEnabled) return []
    const slot = Math.max(1, Math.floor(slotMinutes))
    const lead = Math.max(0, Math.floor(leadTimeMinutes))
    const now = Date.now()
    const startMs = now + lead * 60_000
    const startMin = Math.ceil(startMs / 60_000)
    const alignedMin = Math.ceil(startMin / slot) * slot
    const first = alignedMin * 60_000
    const count = Math.min(96, Math.ceil((24 * 60) / slot))
    const slots: string[] = []
    for (let i = 0; i < count; i++) {
      const d = new Date(first + i * slot * 60_000)
      slots.push(d.toISOString())
    }
    // Same-day only in the tenant timezone (PT by default).
    const todayKey = dateKeyInTz(now, orderingTimezone)
    return slots.filter((iso) => dateKeyInTz(Date.parse(iso), orderingTimezone) === todayKey)
  }, [orderingEnabled, schedulingEnabled, slotMinutes, leadTimeMinutes, orderingTimezone])

  const formatSlot = (iso: string) => {
    try {
      const d = new Date(iso)
      const t = d.toLocaleTimeString(undefined, {
        timeZone: orderingTimezone,
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      })
      return `Today ${t}`
    } catch {
      return iso
    }
  }

  const canScheduleToday = orderingEnabled && schedulingEnabled && availableSlots.length > 0

  const isAddOnTag = (tag: string) => {
    const t = String(tag || '').trim().toLowerCase()
    return t.startsWith('addon:') || t.startsWith('add-on:')
  }

  const visibleTags = (tags: string[] | undefined) => (tags || []).filter(t => !isAddOnTag(t))

  const parseAddOnDefs = (tags: string[] | undefined) => {
    const out: Array<{ name: string; priceDeltaCents: number }> = []
    for (const raw of tags || []) {
      const t = String(raw || '').trim()
      if (!t || !isAddOnTag(t)) continue
      const rest = t.split(':').slice(1).join(':').trim()
      if (!rest) continue
      let name = rest
      let pricePart = ''
      if (rest.includes('|')) {
        const [n, p] = rest.split('|')
        name = (n || '').trim()
        pricePart = (p || '').trim()
      } else if (rest.includes('=')) {
        const [n, p] = rest.split('=')
        name = (n || '').trim()
        pricePart = (p || '').trim()
      }
      if (!name) continue
      const priceRaw = pricePart.replace(/^\$/, '').trim()
      let priceDeltaCents = 0
      if (priceRaw) {
        const asNum = Number(priceRaw)
        if (Number.isFinite(asNum)) {
          if (Number.isInteger(asNum) && asNum >= 50) priceDeltaCents = Math.max(0, Math.floor(asNum))
          else priceDeltaCents = Math.max(0, Math.round(asNum * 100))
        }
      }
      out.push({ name, priceDeltaCents })
    }
    out.sort((a, b) => a.name.localeCompare(b.name) || a.priceDeltaCents - b.priceDeltaCents)
    return out
  }

  const flyToPlate = useCallback((fromEl: HTMLElement, item: MenuItem) => {
    if (!flyToPlateEnabled) return
    if (typeof window === 'undefined' || typeof document === 'undefined') return
    const toEl = plateButtonRef.current
    if (!toEl) return

    const from = fromEl.getBoundingClientRect()
    const to = toEl.getBoundingClientRect()

    const startX = from.left + from.width / 2
    const startY = from.top + from.height / 2
    const endX = to.left + to.width / 2
    const endY = to.top + to.height / 2

    const size = 22
    const ghost = document.createElement('div')
    ghost.style.position = 'fixed'
    ghost.style.left = `${startX - size / 2}px`
    ghost.style.top = `${startY - size / 2}px`
    ghost.style.width = `${size}px`
    ghost.style.height = `${size}px`
    ghost.style.borderRadius = '999px'
    ghost.style.zIndex = '9999'
    ghost.style.pointerEvents = 'none'
    ghost.style.boxShadow = '0 10px 24px rgba(0,0,0,0.25)'

    const src = (imageMap[item.id] || item.imageUrl || '').trim()
    if (src) {
      ghost.style.backgroundImage = `url("${src}")`
      ghost.style.backgroundSize = 'cover'
      ghost.style.backgroundPosition = 'center'
    } else {
      ghost.style.background = 'linear-gradient(135deg, rgba(196,167,106,0.95), rgba(255,255,255,0.55))'
      ghost.style.border = '1px solid rgba(0,0,0,0.08)'
    }

    document.body.appendChild(ghost)

    const dx = endX - startX
    const dy = endY - startY

    const anim = ghost.animate(
      [
        { transform: 'translate(0px, 0px) scale(1)', opacity: 1 },
        { transform: `translate(${dx * 0.65}px, ${dy * 0.65}px) scale(0.92)`, opacity: 1, offset: 0.7 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.55)`, opacity: 0.15 },
      ],
      { duration: 520, easing: 'cubic-bezier(0.2, 0.9, 0.2, 1)', fill: 'forwards' }
    )
    anim.onfinish = () => {
      try { ghost.remove() } catch {}
      setCartBump(true)
    }
  }, [flyToPlateEnabled, imageMap])

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
      return [...prev, { item, quantity: 1, addOns: [], note: '' }]
    })
    setToast(`Added ${item.name}`)
  }

  const startCheckout = async () => {
    try {
      if (orderingEnabled && orderingPaused) {
        setToast(orderingPauseText)
        return
      }
      if (orderingEnabled && dineInEnabled && fulfillmentMode === 'dinein' && !tableNumber.trim()) {
        setToast(`Please enter your ${dineInLabel.toLowerCase()} to place a dine-in order.`)
        return
      }
      if (orderingEnabled && !emailOk) {
        setToast('Email is required for your receipt.')
        return
      }
      if (orderingEnabled && smsOptIn && !customerPhone.trim()) {
        setToast('Please add a phone number to receive SMS updates.')
        return
      }
      const payload = {
        tenant,
        items: cart.map(ci => ({
          id: ci.item.id,
          quantity: ci.quantity,
          addOns: ci.addOns || [],
          note: (ci.note || '').trim() || null,
        })),
        scheduledFor: (orderingEnabled && schedulingEnabled && pickupWhen === 'scheduled' && scheduledForIso)
          ? scheduledForIso
          : null,
        tableNumber: (orderingEnabled && dineInEnabled && fulfillmentMode === 'dinein') ? (tableNumber.trim() || null) : null,
        customerEmail: customerEmail.trim(),
        customerName: customerName.trim() || null,
        customerPhone: customerPhone.trim() || null,
        smsOptIn: Boolean(smsOptIn),
        tipCents,
        orderNote: orderNote.trim() || null,
      }
      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok || !data?.url) {
        const err = data?.message || data?.error || `Checkout failed (${res.status})`
        setToast(String(err))
        return
      }
      window.location.href = String(data.url)
    } catch (e) {
      setToast((e as Error)?.message || 'Checkout error')
    }
  }

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
      {/* Independent draft: top navigation bar with logo + search */}
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                brandLogoUrl
                || 'https://images.squarespace-cdn.com/content/v1/652d775c7dfc3727b42cc773/cd438e8d-6bd2-4053-aa62-3ee8a308ee38/Indy_Logo_Light.png?format=1500w'
              }
              alt={brandName || 'The Independent'}
              className="h-9 w-auto"
              loading="eager"
              decoding="async"
            />
            <div className="flex-1" />
            <div className="relative w-full max-w-md">
              <input
                type="text"
                placeholder="Search the menu..."
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
            style={{ background: 'linear-gradient(90deg, var(--primary), var(--accent))' }}
          >
            <div
              className="px-4"
              style={{
                height: 72,
                borderBottom: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <div className="max-w-7xl mx-auto h-full flex items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center">🍽️</div>
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-white tracking-wide" style={{ fontFamily: 'var(--font-italiana)' }}>{brandName}</h1>
                  <p className="text-gray-200 text-xs">{brandTagline}</p>
                </div>
              </div>
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

      {/* Benes hero banner (Benes-only) */}
      {!isIndependentDraft && isBenes && showBenesHero && (
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
          <div
            className="rounded-lg px-3 py-2 text-[13px] font-semibold tracking-wide"
            style={{
              background: isIndependentDraft
                ? 'linear-gradient(90deg, rgba(196,167,106,0.16), rgba(255,255,255,0.02))'
                : 'linear-gradient(90deg, rgba(196,167,106,0.10), rgba(255,255,255,0))',
              border: isIndependentDraft
                ? '1px solid rgba(255,255,255,0.14)'
                : '1px solid rgba(196,167,106,0.28)',
              color: isIndependentDraft ? 'rgba(248,250,252,0.92)' : '#101010',
              fontFamily: 'var(--font-serif)',
            }}
          >
            {typeof copy?.specials === 'string'
              ? copy.specials
              : (isIndependentDraft
                ? "Ask your server for this week's specials & cocktail pairings."
                : "Tonight's Specials are available — ask your server."
              )
            }
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

      {/* Admin Edit Bar */}
      {isAdmin && (
        <div className="sticky top-0 z-40 bg-yellow-50 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3">
            <span className="text-sm text-yellow-900 font-medium">Inline Edit Mode</span>
            <button onClick={saveAllEdits} className="px-3 py-1 rounded text-sm" style={{ background: 'var(--accent)', color: '#0b0b0b' }}>Save All</button>
            {/* Publish draft to live */}
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
                <h2
                  className="text-2xl font-extrabold tracking-wide inline-flex items-center gap-3"
                  style={{
                    fontFamily: 'var(--font-serif)',
                    color: isIndependentDraft ? '#f8fafc' : (isBenes ? '#101010' : 'var(--ink)')
                  }}
                >
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
                            {typeof item.description === 'string' && item.description.trim() !== '' && (
                              <div
                                className="mt-2 text-sm"
                                style={{
                                  color: 'rgba(248,250,252,0.78)',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {item.description.trim()}
                              </div>
                            )}
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
                          <div className="shrink-0 flex flex-col items-end">
                            <div className="text-base font-semibold" style={{ color: 'rgba(196,167,106,0.95)' }}>
                              ${Number(item.price ?? 0).toFixed(2)}
                            </div>
                            <div className="mt-3 flex flex-col gap-2">
                              <button
                                onClick={(e) => {
                                  addToCart(item)
                                  flyToPlate(e.currentTarget as unknown as HTMLElement, item)
                                }}
                                className="inline-flex h-10 w-28 items-center justify-center gap-2 rounded-full text-sm font-extrabold transition shadow-sm"
                                style={{
                                  background: 'rgba(196,167,106,0.18)',
                                  border: '1px solid rgba(196,167,106,0.55)',
                                  color: '#f8fafc'
                                }}
                                aria-label={`Add ${item.name} to order`}
                              >
                                Add
                              </button>
                              <button
                                onClick={() => { setIsAssistantOpen(true); void sendAssistantMessage(`Tell me about ${item.name}`) }}
                                className="inline-flex h-10 w-28 items-center justify-center gap-2 rounded-full text-sm font-extrabold transition shadow-sm"
                                style={{
                                  background: 'rgba(255,255,255,0.06)',
                                  border: '1px solid rgba(255,255,255,0.14)',
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
                        {typeof item.description === 'string' && item.description.trim() !== '' ? (
                          <p
                            className="mb-4 text-sm text-gray-700"
                            style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {item.description.trim()}
                          </p>
                        ) : (
                          <div className="mb-4" />
                        )}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0 flex flex-wrap gap-1">
                            {visibleTags(item.tags).map(tag => (
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
        <p className="mt-2 text-xs text-gray-500">
          AI answers may be inaccurate. For allergies and dietary needs, please confirm with staff.
        </p>
      </div>

      {/* Floating Plate Button removed */}
      {/* Independent draft: floating Order button */}
      {isIndependentDraft && (
        <button
          ref={plateButtonRef}
          onClick={() => setIsCartOpen(true)}
          className={`fixed bottom-6 right-6 z-50 rounded-full px-5 py-3 text-sm font-extrabold shadow-lg ${cartBump ? 'animate-bump' : ''}`}
          style={{
            background: 'rgba(196,167,106,0.95)',
            color: '#0b0b0b',
            border: '1px solid rgba(196,167,106,0.65)'
          }}
          aria-label="Open order"
        >
          Order ({cart.reduce((n, ci) => n + ci.quantity, 0)})
        </button>
      )}

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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex">
          <div className="ml-auto w-full max-w-md bg-neutral-950 text-white h-full shadow-2xl border-l border-white/10 flex flex-col">
            <div className="p-6 border-b border-white/10 bg-neutral-950/90 backdrop-blur">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Your Plate</h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 py-6 bg-neutral-950 overscroll-contain">
              {cart.length === 0 ? (
                <div className="text-center text-white/70 mt-8">
                  <div className="text-4xl mb-4">🛒</div>
                  <p>Your plate is empty</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Fulfillment (dine-in vs pickup) */}
                  {orderingEnabled && dineInEnabled && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm">
                      <div className="text-sm font-extrabold tracking-wide text-white">Order type</div>
                      <div className="mt-2 text-sm text-white/70">
                        Choose pickup or dine-in so the kitchen routes it correctly.
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setFulfillmentMode('pickup')}
                          className="px-4 py-2.5 rounded-xl text-sm font-extrabold border transition"
                          style={fulfillmentMode === 'pickup'
                            ? { background: 'var(--accent)', color: '#0b0b0b', borderColor: 'var(--accent)' }
                            : { background: 'rgba(255,255,255,0.06)', color: '#fff', borderColor: 'rgba(255,255,255,0.14)' }
                          }
                        >
                          To-go pickup
                        </button>
                        <button
                          type="button"
                          onClick={() => setFulfillmentMode('dinein')}
                          className="px-4 py-2.5 rounded-xl text-sm font-extrabold border transition"
                          style={fulfillmentMode === 'dinein'
                            ? { background: 'var(--accent)', color: '#0b0b0b', borderColor: 'var(--accent)' }
                            : { background: 'rgba(255,255,255,0.06)', color: '#fff', borderColor: 'rgba(255,255,255,0.14)' }
                          }
                        >
                          Dine-in
                        </button>
                      </div>

                      {fulfillmentMode === 'dinein' && (
                        <div className="mt-4">
                          <label className="block text-xs font-semibold text-white/80">{dineInLabel}</label>
                          <input
                            inputMode="numeric"
                            value={tableNumber}
                            onChange={(e) => setTableNumber(e.target.value)}
                            placeholder={dineInLabel}
                            className="mt-2 w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-[16px] text-white placeholder-white/40"
                          />
                          {!tableNumber.trim() && (
                            <div className="mt-2 text-xs font-semibold text-amber-700">
                              Required for dine-in orders.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Your Order */}
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm">
                    <div className="text-sm font-extrabold tracking-wide text-white">Your Order</div>
                    <div className="mt-4 space-y-4">
                      {cart.map(cartItem => {
                        const defs = parseAddOnDefs(cartItem.item.tags)
                        const base = Math.round((Number(cartItem.item.price ?? 0)) * 100)
                        const addOnCents = (cartItem.addOns || []).reduce((s, a) => s + (a.priceDeltaCents || 0), 0)
                        const unitCents = base + addOnCents
                        const lineCents = unitCents * cartItem.quantity
                        return (
                          <div key={cartItem.item.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="font-semibold text-black truncate">{cartItem.item.name}</div>
                                  </div>
                                  <div className="shrink-0 text-right">
                                    <div className="text-xs text-gray-500">Per item</div>
                                    <div className="font-semibold text-black">${(unitCents / 100).toFixed(2)}</div>
                                  </div>
                                </div>

                                <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                                  <div className="text-xs font-bold text-gray-800">Item customization</div>

                                  {defs.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      {defs.map((opt) => {
                                        const checked = (cartItem.addOns || []).some(a => a.name === opt.name && a.priceDeltaCents === opt.priceDeltaCents)
                                        return (
                                          <label key={`${opt.name}:${opt.priceDeltaCents}`} className="flex items-center gap-2 text-sm text-gray-900">
                                            <input
                                              type="checkbox"
                                              checked={checked}
                                              onChange={(e) => {
                                                const nextChecked = e.target.checked
                                                setCart(prev => prev.map(ci => {
                                                  if (ci.item.id !== cartItem.item.id) return ci
                                                  const existing = ci.addOns || []
                                                  const without = existing.filter(a => !(a.name === opt.name && a.priceDeltaCents === opt.priceDeltaCents))
                                                  return {
                                                    ...ci,
                                                    addOns: nextChecked ? [...without, opt] : without,
                                                  }
                                                }))
                                              }}
                                              className="h-4 w-4"
                                            />
                                            <span className="flex-1">{opt.name}</span>
                                            <span className="font-mono text-gray-600">+${(opt.priceDeltaCents / 100).toFixed(2)}</span>
                                          </label>
                                        )
                                      })}
                                    </div>
                                  )}

                                  <div className="mt-3">
                                    <input
                                      inputMode="text"
                                      value={cartItem.note || ''}
                                      onChange={(e) => {
                                        const v = e.target.value
                                        setCart(prev => prev.map(ci => ci.item.id === cartItem.item.id ? { ...ci, note: v } : ci))
                                      }}
                                      placeholder="Add a note for this item (optional)"
                                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-[16px] text-black"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0 flex flex-col items-end gap-3">
                                {/* Branded quantity stepper */}
                                <div className="inline-flex items-center rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                                  <button
                                    onClick={() => updateCartQuantity(cartItem.item.id, cartItem.quantity - 1)}
                                    className="h-11 w-11 flex items-center justify-center text-base font-black text-black hover:bg-gray-50"
                                    aria-label={`Decrease quantity for ${cartItem.item.name}`}
                                  >
                                    −
                                  </button>
                                  <div className="h-11 w-12 flex items-center justify-center text-base font-extrabold text-black">
                                    {cartItem.quantity}
                                  </div>
                                  <button
                                    onClick={() => updateCartQuantity(cartItem.item.id, cartItem.quantity + 1)}
                                    className="h-11 w-11 flex items-center justify-center text-base font-black text-black hover:bg-gray-50"
                                    aria-label={`Increase quantity for ${cartItem.item.name}`}
                                  >
                                    +
                                  </button>
                                </div>

                                <div className="text-right">
                                  <div className="text-xs text-gray-500">Line total</div>
                                  <div className="text-lg font-extrabold text-black">${(lineCents / 100).toFixed(2)}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Order-wide notes */}
                  {orderingEnabled && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="text-sm font-extrabold tracking-wide text-black">Order-wide notes</div>
                      <div className="mt-2 text-sm text-gray-600">Anything the kitchen should know for the whole order.</div>
                      <textarea
                        value={orderNote}
                        onChange={(e) => setOrderNote(e.target.value)}
                        placeholder="Example: allergy note, extra napkins, etc."
                        className="mt-4 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-[16px] text-black"
                        rows={3}
                      />
                    </div>
                  )}

                  {/* Contact Info */}
                  {orderingEnabled && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="text-sm font-extrabold tracking-wide text-black">Contact Info</div>
                      <div className="mt-2 text-sm text-gray-600">Receipt & updates. We’ll send your receipt and pickup updates here.</div>
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="Email (required)"
                          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-[16px] text-black"
                        />
                        <input
                          type="text"
                          inputMode="text"
                          autoComplete="name"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Name (optional)"
                          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-[16px] text-black"
                        />
                        <input
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="Phone (optional)"
                          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-[16px] text-black sm:col-span-2"
                        />
                      </div>

                      <label className="mt-4 flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4"
                          checked={smsOptIn}
                          onChange={(e) => setSmsOptIn(e.target.checked)}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-black">Text me when my order is ready</div>
                          <div className="text-xs text-gray-600">
                            Optional. Message &amp; data rates may apply. Reply STOP to opt out.
                          </div>
                        </div>
                      </label>
                      {smsOptIn && !customerPhone.trim() && (
                        <div className="mt-2 text-sm font-semibold text-amber-700">
                          Please add a phone number to receive SMS updates.
                        </div>
                      )}

                      {!emailOk && (
                        <div className="mt-3 text-sm font-semibold text-amber-700">
                          Please enter a valid email to place your order.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tip */}
                  {orderingEnabled && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="text-sm font-extrabold tracking-wide text-black">Tip</div>
                      <div className="mt-2 text-sm text-gray-600">Optional. Tips go directly to the restaurant.</div>
                      <div className="mt-4 grid grid-cols-4 gap-2">
                        {[0, 10, 15, 20].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => { setTipPercent(pct); setCustomTip('') }}
                            className="rounded-xl px-3 py-2 text-sm font-extrabold border transition"
                            style={customTip.trim() === '' && tipPercent === pct
                              ? { background: 'var(--accent)', color: '#0b0b0b', borderColor: 'var(--accent)' }
                              : { background: '#fff', color: '#111', borderColor: 'rgba(0,0,0,0.15)' }
                            }
                          >
                            {pct === 0 ? 'No' : `${pct}%`}
                          </button>
                        ))}
                      </div>
                      <div className="mt-3">
                        <label className="block text-xs font-semibold text-gray-700">Custom tip</label>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-700">$</span>
                          <input
                            inputMode="decimal"
                            value={customTip}
                            onChange={(e) => setCustomTip(e.target.value)}
                            placeholder="0.00"
                            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-[16px] text-black"
                          />
                        </div>
                        {tipCents > 0 && (
                          <div className="mt-2 text-xs text-gray-600">
                            Tip: ${(tipCents / 100).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pickup Time */}
                  {orderingEnabled && schedulingEnabled && fulfillmentMode === 'pickup' && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-2 text-sm font-extrabold tracking-wide text-black">
                        <span aria-hidden="true">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                            <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          </svg>
                        </span>
                        Pickup Time
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPickupWhen('asap')}
                          className="px-4 py-2.5 rounded-xl text-sm font-extrabold border transition"
                          style={pickupWhen === 'asap'
                            ? { background: 'var(--accent)', color: '#0b0b0b', borderColor: 'var(--accent)' }
                            : { background: '#fff', color: '#111', borderColor: 'rgba(0,0,0,0.15)' }
                          }
                        >
                          ASAP
                        </button>
                        <button
                          type="button"
                          disabled={!canScheduleToday}
                          onClick={() => {
                            if (!canScheduleToday) return
                            setPickupWhen('scheduled')
                            if (!scheduledForIso && availableSlots[0]) setScheduledForIso(availableSlots[0])
                          }}
                          className="px-4 py-2.5 rounded-xl text-sm font-extrabold border transition"
                          style={pickupWhen === 'scheduled'
                            ? { background: 'var(--accent)', color: '#0b0b0b', borderColor: 'var(--accent)', opacity: canScheduleToday ? 1 : 0.5 }
                            : { background: '#fff', color: '#111', borderColor: 'rgba(0,0,0,0.15)', opacity: canScheduleToday ? 1 : 0.5 }
                          }
                        >
                          Schedule today
                        </button>
                      </div>
                      {pickupWhen === 'scheduled' && (
                        <div className="mt-4">
                          <select
                            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-[16px] text-black"
                            value={scheduledForIso}
                            onChange={(e) => setScheduledForIso(e.target.value)}
                          >
                            {availableSlots.map((iso) => (
                              <option key={iso} value={iso}>{formatSlot(iso)}</option>
                            ))}
                          </select>
                          <div className="mt-2 text-xs text-gray-500">
                            Times shown in PT. Same-day only.
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dine-in UI moved to top as the first step */}

                  {orderingEnabled && orderingPaused && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                      {orderingPauseText}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {cart.length > 0 && (
              <div className="p-5 border-t border-white/10 bg-neutral-950 shadow-[0_-10px_24px_rgba(0,0,0,0.35)]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white/70">Order total</div>
                    <div className="text-2xl font-extrabold text-white">${Number(orderTotal ?? 0).toFixed(2)}</div>
                    {orderingEnabled && tipCents > 0 && (
                      <div className="mt-1 text-xs text-white/60">
                        Includes ${(tipCents / 100).toFixed(2)} tip
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (orderingEnabled) {
                        void startCheckout()
                        return
                      }
                      setToast('Demo mode — ordering is not enabled for this tenant yet.')
                    }}
                    className="rounded-2xl px-5 py-3 text-sm font-extrabold shadow-sm hover:opacity-95 disabled:opacity-60"
                    style={{ background: 'var(--accent)', color: '#0b0b0b' }}
                    disabled={cart.length === 0 || (orderingEnabled && (!emailOk || orderingPaused || (smsOptIn && !customerPhone.trim()) || (dineInEnabled && fulfillmentMode === 'dinein' && !tableNumber.trim())))}
                  >
                    {orderingEnabled ? 'Place order' : 'Proceed with Plate'}
                  </button>
                </div>
                {!orderingEnabled && (
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Demo mode - No actual payment processed
                  </p>
                )}
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
              <div className="mt-3 text-xs text-gray-500">
                AI answers may be inaccurate. For allergies and dietary needs, please confirm with staff.
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



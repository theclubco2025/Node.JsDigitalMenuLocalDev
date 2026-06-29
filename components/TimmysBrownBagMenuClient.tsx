
"use client"

/* eslint-disable @next/next/no-img-element */

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import useSWR from 'swr'
import { MenuResponse, MenuItem } from '@/types/api'
import { smsCheckoutUiEnabled } from '@/lib/notifications/sms-ui-enabled'

type TenantStyleFlags = {
  flags?: Record<string, boolean>
  accentSecondary?: string
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

type ThemeCSSVariables = React.CSSProperties & Record<'--bg' | '--text' | '--ink' | '--card' | '--muted' | '--accent' | '--primary', string | undefined>

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// Decorative light-blue bubbles, matching the shop's real cardboard-sign artwork.
const BUBBLES: Array<{ top: string; left: string; size: number; opacity: number }> = [
  { top: '6%', left: '4%', size: 26, opacity: 0.55 },
  { top: '14%', left: '92%', size: 18, opacity: 0.4 },
  { top: '40%', left: '88%', size: 34, opacity: 0.35 },
  { top: '62%', left: '6%', size: 22, opacity: 0.45 },
  { top: '82%', left: '20%', size: 14, opacity: 0.5 },
  { top: '88%', left: '78%', size: 28, opacity: 0.4 },
]

export default function TimmysBrownBagMenuClient() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedDietaryFilters, setSelectedDietaryFilters] = useState<string[]>([])
  const [cart, setCart] = useState<Array<{ item: MenuItem; quantity: number; addOns: Array<{ name: string; priceDeltaCents: number }>; note: string }>>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [assistantMessage, setAssistantMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; message: string }>>([])
  const [isAssistantOpen, setIsAssistantOpen] = useState(false)
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const [cartBump, setCartBump] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const isBrowser = typeof window !== 'undefined'
  const searchParams = isBrowser ? new URLSearchParams(window.location.search) : null
  const pathTenant = isBrowser ? window.location.pathname.split('/').filter(Boolean)[0] : null
  const tenant = isBrowser
    ? (searchParams!.get('tenant') || pathTenant || 'timmysbrownbag')
    : 'timmysbrownbag'
  const isAdmin = isBrowser ? searchParams!.get('admin') === '1' : false

  const plateButtonRef = useRef<HTMLButtonElement | null>(null)
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

  const { data: cfg } = useSWR<TenantConfig>(`/api/tenant/config?tenant=${tenant}`, fetcher)
  const brand = cfg?.brand
  const theme = cfg?.theme ?? null
  const imageMap = useMemo(() => cfg?.images ?? {}, [cfg?.images])
  const copy = cfg?.copy as Record<string, unknown> | undefined
  const orderingCfg = cfg?.ordering
  const categoryIntros = (copy?.categoryIntros as Record<string, string | undefined>) || {}
  const brandLogoUrl = brand?.header?.logoUrl || brand?.logoUrl || ''
  const brandName = brand?.name || "Timmy's Brown Bag"
  const brandTagline = brand?.tagline || ''

  const effectiveTheme = useMemo(() => theme ?? null, [theme])

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

  const [editableMenu, setEditableMenu] = useState<MenuResponse | null>(null)
  useEffect(() => {
    if (!isAdmin) return
    if (menuData) setEditableMenu(JSON.parse(JSON.stringify(menuData)))
  }, [isAdmin, menuData])

  const baseMenu: MenuResponse | null = isAdmin ? (editableMenu || null) : (menuData || null)

  const filteredCategories = useMemo(() => {
    if (!baseMenu?.categories) return []
    return baseMenu.categories
      .map(category => ({
        ...category,
        items: category.items.filter(item => {
          if (selectedCategory && category.name !== selectedCategory) return false
          if (searchQuery) {
            const searchLower = searchQuery.toLowerCase()
            const matchesName = item.name.toLowerCase().includes(searchLower)
            const matchesTags = (item.tags || []).some(tag => tag.toLowerCase().includes(searchLower))
            if (!matchesName && !matchesTags) return false
          }
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

  const saveAllEdits = async () => {
    if (!isAdmin || !editableMenu) return
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (adminToken && adminToken.trim() !== '') headers['X-Admin-Token'] = adminToken
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

  const orderingEnabled = orderingCfg?.enabled === true
  const orderingPaused = (orderingCfg as unknown as { paused?: boolean } | undefined)?.paused === true
  const orderingPauseMessage = (orderingCfg as unknown as { pauseMessage?: unknown } | undefined)?.pauseMessage
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
  const [scheduledForIso, setScheduledForIso] = useState<string>('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [smsOptIn, setSmsOptIn] = useState(false)
  const [marketingSmsOptIn, setMarketingSmsOptIn] = useState(false)
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
    } catch {}
  }, [contactStorageKey])
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(contactStorageKey, JSON.stringify({ email: customerEmail, name: customerName, phone: customerPhone }))
    } catch {}
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
    const todayKey = dateKeyInTz(now, orderingTimezone)
    return slots.filter((iso) => dateKeyInTz(Date.parse(iso), orderingTimezone) === todayKey)
  }, [orderingEnabled, schedulingEnabled, slotMinutes, leadTimeMinutes, orderingTimezone])

  const formatSlot = (iso: string) => {
    try {
      const d = new Date(iso)
      const t = d.toLocaleTimeString(undefined, { timeZone: orderingTimezone, hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
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
      ghost.style.background = 'radial-gradient(circle, rgba(223,240,250,0.95), rgba(31,122,61,0.55))'
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
  }, [imageMap])

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.item.id === item.id)
      if (existing) {
        return prev.map(cartItem =>
          cartItem.item.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
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
      if (orderingEnabled && smsCheckoutUiEnabled && smsOptIn && !customerPhone.trim()) {
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
        scheduledFor: (orderingEnabled && schedulingEnabled && pickupWhen === 'scheduled' && scheduledForIso) ? scheduledForIso : null,
        tableNumber: (orderingEnabled && dineInEnabled && fulfillmentMode === 'dinein') ? (tableNumber.trim() || null) : null,
        customerEmail: customerEmail.trim(),
        customerName: customerName.trim() || null,
        customerPhone: customerPhone.trim() || null,
        smsOptIn: Boolean(smsOptIn),
        marketingSmsOptIn: Boolean(marketingSmsOptIn),
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

  const categories = useMemo(() => menuData?.categories ?? [], [menuData])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const sectionIds = categories.map(c => `cat-${c.id}`)
    const elements = sectionIds.map(id => document.getElementById(id)).filter((el): el is HTMLElement => !!el)
    if (elements.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]) setActiveCategoryId(visible[0].target.id.replace('cat-', ''))
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] }
    )
    elements.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [categories])

  useEffect(() => {
    if (!cartBump) return
    const t = setTimeout(() => setCartBump(false), 300)
    return () => clearTimeout(t)
  }, [cartBump])

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
    '--primary': effectiveTheme?.primary,
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={rootStyle}>
      {/* Decorative bubbles, lifted from the shop's own sign artwork */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        {BUBBLES.map((b, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              top: b.top,
              left: b.left,
              width: b.size,
              height: b.size,
              background: 'var(--muted)',
              opacity: b.opacity,
            }}
          />
        ))}
      </div>

      {error && (
        <div className="flex items-center justify-center min-h-screen text-red-600 relative z-10">Failed to load menu</div>
      )}
      {(!error && isLoading) && (
        <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
          <div className="lux-skeleton h-8 w-64 mb-6 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-2xl overflow-hidden">
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
        <div className="relative z-10">
          {/* Header */}
          <div className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b-4" style={{ borderColor: 'var(--primary)' }}>
            <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col items-center text-center gap-1">
              {brandLogoUrl ? (
                <img src={brandLogoUrl} alt={brandName} className="h-16 w-auto" loading="eager" decoding="async" />
              ) : (
                <h1 className="text-2xl font-extrabold" style={{ color: 'var(--accent)' }}>{brandName}</h1>
              )}
              {brandTagline && (
                <p className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>{brandTagline}</p>
              )}
            </div>
          </div>

          {/* Admin Edit Bar */}
          {isAdmin && (
            <div className="sticky top-0 z-40 bg-yellow-50 border-b border-yellow-200">
              <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3">
                <span className="text-sm text-yellow-900 font-medium">Inline Edit Mode</span>
                <button onClick={saveAllEdits} className="px-3 py-1 rounded text-sm text-white" style={{ background: 'var(--primary)' }}>Save All</button>
                <a href={`/menu?tenant=${encodeURIComponent(tenant)}`} className="text-sm text-yellow-900 underline">Exit</a>
              </div>
            </div>
          )}

          {/* Search & Category chips */}
          <div className="max-w-5xl mx-auto px-4 py-4">
            <div className="mb-3 flex items-center gap-2 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search the menu..."
                  className="w-full px-3 py-2 pr-9 rounded-full text-sm text-black bg-white placeholder-gray-500"
                  style={{ border: '2px solid var(--muted)' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" />
                    <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <button
                onClick={() => setFiltersOpen(o => !o)}
                className="px-3 py-2 rounded-full text-sm font-semibold"
                style={{ background: '#fff', color: 'var(--primary)', border: '2px solid var(--primary)' }}
              >
                {filtersOpen ? 'Hide Filters' : 'Filters'}
              </button>
            </div>

            <div className="flex gap-2 justify-center flex-wrap mb-3">
              <button
                onClick={() => setSelectedCategory(null)}
                className="px-4 py-2 rounded-full text-sm font-bold transition-all"
                style={selectedCategory === null
                  ? { background: 'var(--primary)', color: '#fff' }
                  : { background: '#fff', color: 'var(--primary)', border: '2px solid var(--primary)' }
                }
              >
                All Categories
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.name === selectedCategory ? null : cat.name)
                    scrollTo(`cat-${cat.id}`)
                  }}
                  className="px-4 py-2 rounded-full text-sm font-bold transition-all"
                  style={selectedCategory === cat.name
                    ? { background: 'var(--accent)', color: '#fff' }
                    : { background: '#fff', color: 'var(--accent)', border: '2px solid var(--accent)' }
                  }
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {filtersOpen && (
              <div className="flex gap-2 justify-center flex-wrap">
                {dietaryOptions.map(option => (
                  <button
                    key={option}
                    onClick={() => setSelectedDietaryFilters(prev => prev.includes(option) ? prev.filter(f => f !== option) : [...prev, option])}
                    className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                    style={selectedDietaryFilters.includes(option)
                      ? { background: 'var(--primary)', color: '#fff' }
                      : { background: '#fff', color: 'var(--primary)', border: '1px solid var(--primary)' }
                    }
                  >
                    {option}
                  </button>
                ))}
                {(searchQuery || selectedDietaryFilters.length > 0 || selectedCategory) && (
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedCategory(null); setSelectedDietaryFilters([]) }}
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ background: '#fff', color: 'var(--ink)', border: '1px solid var(--muted)' }}
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Menu */}
          <div className="max-w-5xl mx-auto px-4 pb-24" id="top">
            <div className="space-y-12">
              {filteredCategories.map((category) => (
                <div key={category.id} id={`cat-${category.id}`} className="scroll-mt-24">
                  <div className="flex items-center gap-3 mb-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full transition-transform"
                      style={{ background: 'var(--accent)', transform: activeCategoryId === category.id ? 'scale(1.4)' : 'scale(1)' }}
                    />
                    <h2 className="text-2xl font-extrabold" style={{ color: 'var(--primary)' }}>{category.name}</h2>
                    <div className="flex-1 h-1 rounded-full" style={{ background: 'var(--primary)', opacity: activeCategoryId === category.id ? 0.35 : 0.18 }} />
                  </div>
                  {typeof categoryIntros[category.name] === 'string' && (
                    <p className="text-sm mb-4 italic" style={{ color: 'var(--ink)', opacity: 0.7 }}>{categoryIntros[category.name]}</p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                    {category.items.map(item => {
                      const src = imageMap[item.id] || item.imageUrl || ''
                      return (
                        <div
                          key={item.id}
                          className="bg-white border-2 overflow-hidden transition-all duration-200 hover:-translate-y-1"
                          style={{ borderColor: 'var(--muted)', borderRadius: 'var(--radius)', boxShadow: '0 6px 18px rgba(31,122,61,0.06)' }}
                        >
                          {src && (
                            <img src={src} alt={item.name} className="w-full h-40 object-cover" loading="lazy" decoding="async" />
                          )}
                          <div className="p-5">
                            <div className="flex justify-between items-start gap-3 mb-2">
                              <h3 className="text-lg font-bold leading-tight" style={{ color: 'var(--ink)' }}>
                                {highlightText(item.name, searchQuery)}
                              </h3>
                              <span
                                className="text-sm font-extrabold px-3 py-1 rounded-full whitespace-nowrap text-white"
                                style={{ background: 'var(--accent)' }}
                              >
                                ${Number(item.price ?? 0).toFixed(2)}
                              </span>
                            </div>
                            {typeof item.description === 'string' && item.description.trim() !== '' && (
                              <p className="text-sm text-gray-600 mb-3">{item.description.trim()}</p>
                            )}
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex-1 min-w-0 flex flex-wrap gap-1">
                                {visibleTags(item.tags).map(tag => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                                    style={{ color: 'var(--primary)', border: '1px solid var(--primary)' }}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              <div className="shrink-0 flex items-center gap-2">
                                <button
                                  onClick={() => { setIsAssistantOpen(true); void sendAssistantMessage(`Tell me about ${item.name}`) }}
                                  className="px-3 py-2 rounded-full text-sm font-semibold border-2"
                                  style={{ borderColor: 'var(--primary)', color: 'var(--primary)', background: '#fff' }}
                                >
                                  Ask
                                </button>
                                <button
                                  onClick={(e) => {
                                    addToCart(item)
                                    flyToPlate(e.currentTarget as unknown as HTMLElement, item)
                                  }}
                                  className="px-4 py-2 rounded-full text-sm font-bold text-white"
                                  style={{ background: 'var(--primary)' }}
                                >
                                  Add to Bag
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <p className="text-xs text-gray-500 italic">
                2,000 calories a day is used for general nutrition advice, but calorie needs vary. Calorie values are
                estimates and may differ based on preparation or ingredient changes.
              </p>
              <p className="mt-2 text-xs text-gray-500">
                AI answers may be inaccurate. For allergies and dietary needs, please confirm with staff.
              </p>
            </div>
          </div>

          {/* Floating buttons */}
          <button
            onClick={() => setIsAssistantOpen(true)}
            className="fixed bottom-6 left-6 p-3 rounded-full shadow-lg z-50 text-white"
            style={{ background: 'var(--primary)' }}
            aria-label="Open assistant"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M3 12 C 7 6, 17 6, 21 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 12 C 7 18, 17 18, 21 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="1.6" fill="currentColor" />
            </svg>
          </button>
          <button
            ref={plateButtonRef}
            onClick={() => setIsCartOpen(true)}
            className={`fixed bottom-6 right-6 z-50 rounded-full px-5 py-3 text-sm font-extrabold shadow-lg text-white ${cartBump ? 'animate-bump' : ''}`}
            style={{ background: 'var(--accent)' }}
            aria-label="Open bag"
          >
            Your Bag ({cart.reduce((n, ci) => n + ci.quantity, 0)})
          </button>

          {/* Cart Drawer */}
          {isCartOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex">
              <div className="ml-auto w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
                <div className="p-6 border-b" style={{ borderColor: 'var(--muted)' }}>
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-extrabold" style={{ color: 'var(--primary)' }}>Your Bag</h2>
                    <button onClick={() => setIsCartOpen(false)} className="text-gray-500 hover:text-black">✕</button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-6">
                  {cart.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                      <div className="text-4xl mb-4">🥪</div>
                      <p>Your bag is empty</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {dineInEnabled && orderingEnabled && (
                        <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--muted)' }}>
                          <div className="text-sm font-bold" style={{ color: 'var(--primary)' }}>Order type</div>
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => setFulfillmentMode('pickup')}
                              className="px-4 py-2 rounded-xl text-sm font-bold border-2"
                              style={fulfillmentMode === 'pickup' ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' } : { background: '#fff', color: 'var(--primary)', borderColor: 'var(--muted)' }}
                            >
                              To-go pickup
                            </button>
                            <button
                              type="button"
                              onClick={() => setFulfillmentMode('dinein')}
                              className="px-4 py-2 rounded-xl text-sm font-bold border-2"
                              style={fulfillmentMode === 'dinein' ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' } : { background: '#fff', color: 'var(--primary)', borderColor: 'var(--muted)' }}
                            >
                              Dine-in
                            </button>
                          </div>
                          {fulfillmentMode === 'dinein' && (
                            <input
                              inputMode="numeric"
                              value={tableNumber}
                              onChange={(e) => setTableNumber(e.target.value)}
                              placeholder={dineInLabel}
                              className="mt-3 w-full rounded-xl border px-3 py-2 text-[16px] text-black"
                              style={{ borderColor: 'var(--muted)' }}
                            />
                          )}
                        </div>
                      )}

                      {cart.map(cartItem => {
                        const defs = parseAddOnDefs(cartItem.item.tags)
                        const base = Math.round(Number(cartItem.item.price ?? 0) * 100)
                        const addOnCents = (cartItem.addOns || []).reduce((s, a) => s + (a.priceDeltaCents || 0), 0)
                        const unitCents = base + addOnCents
                        const lineCents = unitCents * cartItem.quantity
                        return (
                          <div key={cartItem.item.id} className="rounded-2xl border p-4" style={{ borderColor: 'var(--muted)' }}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-black truncate">{cartItem.item.name}</div>
                                {defs.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {defs.map((opt) => {
                                      const checked = (cartItem.addOns || []).some(a => a.name === opt.name && a.priceDeltaCents === opt.priceDeltaCents)
                                      return (
                                        <label key={`${opt.name}:${opt.priceDeltaCents}`} className="flex items-center gap-2 text-sm text-gray-700">
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={(e) => {
                                              const nextChecked = e.target.checked
                                              setCart(prev => prev.map(ci => {
                                                if (ci.item.id !== cartItem.item.id) return ci
                                                const existing = ci.addOns || []
                                                const without = existing.filter(a => !(a.name === opt.name && a.priceDeltaCents === opt.priceDeltaCents))
                                                return { ...ci, addOns: nextChecked ? [...without, opt] : without }
                                              }))
                                            }}
                                            className="h-4 w-4"
                                          />
                                          <span className="flex-1">{opt.name}</span>
                                          <span className="font-mono text-gray-500">+${(opt.priceDeltaCents / 100).toFixed(2)}</span>
                                        </label>
                                      )
                                    })}
                                  </div>
                                )}
                                <input
                                  value={cartItem.note || ''}
                                  onChange={(e) => {
                                    const v = e.target.value
                                    setCart(prev => prev.map(ci => ci.item.id === cartItem.item.id ? { ...ci, note: v } : ci))
                                  }}
                                  placeholder="Add a note (optional)"
                                  className="mt-3 w-full rounded-lg border px-3 py-1.5 text-sm text-black"
                                  style={{ borderColor: 'var(--muted)' }}
                                />
                              </div>
                              <div className="shrink-0 flex flex-col items-end gap-2">
                                <div className="inline-flex items-center rounded-full border overflow-hidden" style={{ borderColor: 'var(--muted)' }}>
                                  <button onClick={() => updateCartQuantity(cartItem.item.id, cartItem.quantity - 1)} className="h-9 w-9 font-bold text-black">−</button>
                                  <div className="h-9 w-9 flex items-center justify-center font-bold text-black">{cartItem.quantity}</div>
                                  <button onClick={() => updateCartQuantity(cartItem.item.id, cartItem.quantity + 1)} className="h-9 w-9 font-bold text-black">+</button>
                                </div>
                                <div className="text-base font-extrabold" style={{ color: 'var(--accent)' }}>${(lineCents / 100).toFixed(2)}</div>
                              </div>
                            </div>
                          </div>
                        )
                      })}

                      {orderingEnabled && (
                        <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--muted)' }}>
                          <div className="text-sm font-bold" style={{ color: 'var(--primary)' }}>Order-wide notes</div>
                          <textarea
                            value={orderNote}
                            onChange={(e) => setOrderNote(e.target.value)}
                            placeholder="Anything the kitchen should know for the whole order"
                            className="mt-3 w-full rounded-xl border px-3 py-2 text-[16px] text-black"
                            style={{ borderColor: 'var(--muted)' }}
                            rows={2}
                          />
                        </div>
                      )}

                      {orderingEnabled && (
                        <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--muted)' }}>
                          <div className="text-sm font-bold" style={{ color: 'var(--primary)' }}>Contact Info</div>
                          <div className="mt-3 grid grid-cols-1 gap-2">
                            <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="Email (required)" className="w-full rounded-xl border px-3 py-2 text-[16px] text-black" style={{ borderColor: 'var(--muted)' }} />
                            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Name (optional)" className="w-full rounded-xl border px-3 py-2 text-[16px] text-black" style={{ borderColor: 'var(--muted)' }} />
                            <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone (optional)" className="w-full rounded-xl border px-3 py-2 text-[16px] text-black" style={{ borderColor: 'var(--muted)' }} />
                          </div>
                          {smsCheckoutUiEnabled && (
                            <label className="mt-3 flex items-start gap-3 rounded-xl border p-3" style={{ borderColor: 'var(--muted)' }}>
                              <input type="checkbox" className="mt-1 h-4 w-4" checked={smsOptIn} onChange={(e) => setSmsOptIn(e.target.checked)} />
                              <div className="text-xs text-gray-600">
                                By checking this box, you agree to receive SMS/text messages from {brandName} about this order. Optional. Msg &amp; data rates may apply. Reply STOP to opt out. See our <a href="/sms-terms" className="underline">SMS Terms</a>.
                              </div>
                            </label>
                          )}
                          <label className="mt-3 flex items-start gap-3 rounded-xl border p-3" style={{ borderColor: 'var(--muted)' }}>
                            <input type="checkbox" className="mt-1 h-4 w-4" checked={marketingSmsOptIn} onChange={(e) => setMarketingSmsOptIn(e.target.checked)} />
                            <div className="text-xs text-gray-600">Optional: I agree to receive marketing messages from {brandName}.</div>
                          </label>
                          {!emailOk && <div className="mt-3 text-sm font-semibold text-amber-700">Please enter a valid email to place your order.</div>}
                        </div>
                      )}

                      {orderingEnabled && (
                        <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--muted)' }}>
                          <div className="text-sm font-bold" style={{ color: 'var(--primary)' }}>Tip</div>
                          <div className="mt-3 grid grid-cols-4 gap-2">
                            {[0, 10, 15, 20].map((pct) => (
                              <button key={pct} type="button" onClick={() => { setTipPercent(pct); setCustomTip('') }} className="rounded-xl px-3 py-2 text-sm font-bold border-2" style={customTip.trim() === '' && tipPercent === pct ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' } : { background: '#fff', color: '#111', borderColor: 'var(--muted)' }}>
                                {pct === 0 ? 'No' : `${pct}%`}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {orderingEnabled && schedulingEnabled && fulfillmentMode === 'pickup' && (
                        <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--muted)' }}>
                          <div className="text-sm font-bold" style={{ color: 'var(--primary)' }}>Pickup Time</div>
                          <div className="mt-3 flex gap-2">
                            <button type="button" onClick={() => setPickupWhen('asap')} className="px-4 py-2 rounded-xl text-sm font-bold border-2" style={pickupWhen === 'asap' ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' } : { background: '#fff', color: '#111', borderColor: 'var(--muted)' }}>ASAP</button>
                            <button type="button" disabled={!canScheduleToday} onClick={() => { if (!canScheduleToday) return; setPickupWhen('scheduled'); if (!scheduledForIso && availableSlots[0]) setScheduledForIso(availableSlots[0]) }} className="px-4 py-2 rounded-xl text-sm font-bold border-2" style={pickupWhen === 'scheduled' ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)', opacity: canScheduleToday ? 1 : 0.5 } : { background: '#fff', color: '#111', borderColor: 'var(--muted)', opacity: canScheduleToday ? 1 : 0.5 }}>Schedule today</button>
                          </div>
                          {pickupWhen === 'scheduled' && (
                            <select className="mt-3 w-full rounded-xl border px-3 py-2 text-[16px] text-black" style={{ borderColor: 'var(--muted)' }} value={scheduledForIso} onChange={(e) => setScheduledForIso(e.target.value)}>
                              {availableSlots.map((iso) => <option key={iso} value={iso}>{formatSlot(iso)}</option>)}
                            </select>
                          )}
                        </div>
                      )}

                      {orderingEnabled && orderingPaused && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{orderingPauseText}</div>
                      )}
                    </div>
                  )}
                </div>
                {cart.length > 0 && (
                  <div className="p-5 border-t" style={{ borderColor: 'var(--muted)' }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-gray-500">Order total</div>
                        <div className="text-2xl font-extrabold" style={{ color: 'var(--ink)' }}>${Number(orderTotal ?? 0).toFixed(2)}</div>
                      </div>
                      <button
                        onClick={() => { if (orderingEnabled) { void startCheckout() } else { setToast('Demo mode — ordering is not enabled for this tenant yet.') } }}
                        className="rounded-full px-5 py-3 text-sm font-extrabold text-white disabled:opacity-60"
                        style={{ background: 'var(--accent)' }}
                        disabled={cart.length === 0 || (orderingEnabled && (!emailOk || orderingPaused || (smsCheckoutUiEnabled && smsOptIn && !customerPhone.trim()) || (dineInEnabled && fulfillmentMode === 'dinein' && !tableNumber.trim())))}
                      >
                        {orderingEnabled ? 'Place order' : 'Proceed with Bag'}
                      </button>
                    </div>
                    {!orderingEnabled && <p className="text-xs text-gray-500 text-center mt-2">Demo mode — no actual payment processed</p>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assistant Drawer */}
          {isAssistantOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex">
              <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
                <div className="p-6 border-b" style={{ borderColor: 'var(--muted)' }}>
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-extrabold" style={{ color: 'var(--primary)' }}>Menu Assistant</h2>
                    <button onClick={() => setIsAssistantOpen(false)} className="text-gray-500 hover:text-black">✕</button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Ask about ingredients, allergens, or recommendations</p>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  {chatHistory.length === 0 ? (
                    <div className="text-center text-gray-500 mt-8">
                      <div className="text-4xl mb-4">🤖</div>
                      <p>Start a conversation!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chatHistory.map((msg, i) => (
                        <div key={i} className={`p-3 rounded-2xl ${msg.role === 'user' ? 'bg-gray-100 text-black ml-8' : 'text-white mr-8'}`} style={msg.role === 'assistant' ? { background: 'var(--primary)' } : undefined}>
                          <div className="font-semibold text-xs mb-1 opacity-70">{msg.role === 'user' ? 'You' : 'Assistant'}</div>
                          <div className="text-sm">{msg.message}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-6 border-t" style={{ borderColor: 'var(--muted)' }}>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ask about our menu..."
                      className="flex-1 px-4 py-2 border rounded-full text-sm text-black bg-white"
                      style={{ borderColor: 'var(--muted)' }}
                      value={assistantMessage}
                      onChange={(e) => setAssistantMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendAssistantMessage()}
                    />
                    <button onClick={() => { void sendAssistantMessage() }} className="px-4 py-2 rounded-full text-white text-sm font-bold" style={{ background: 'var(--primary)' }}>Send</button>
                  </div>
                  <div className="mt-3 text-xs text-gray-500">AI answers may be inaccurate. For allergies and dietary needs, please confirm with staff.</div>
                </div>
              </div>
            </div>
          )}

          {toast && (
            <div className="fixed bottom-24 right-6 z-50 px-4 py-2 rounded-full shadow text-white" style={{ background: 'var(--primary)' }}>
              {toast}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

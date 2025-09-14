
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

  // Get tenant from URL params or use default
  const tenant = typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search).get('tenant') || process.env.NEXT_PUBLIC_DEFAULT_TENANT || 'demo'
    : 'demo'

  const { data: menuData, error, isLoading } = useSWR<MenuResponse>(
    `/api/menu?tenant=${tenant}`,
    fetcher
  )

  // Filter logic matching your Canvas app exactly (client-side now to avoid API refiring per keystroke)
  const filteredCategories = useMemo(() => {
    if (!menuData?.categories) return []
    
    return menuData.categories
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
              item.tags.some(tag => tag.toLowerCase() === dietFilter.toLowerCase())
            )
            if (!hasAllDietaryFilters) return false
          }
          
          return true
        })
      }))
      .filter(category => category.items.length > 0)
  }, [menuData, searchQuery, selectedCategory, selectedDietaryFilters])

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

  return (
    <div className="min-h-screen lux-gradient">
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
      {/* Fixed Header with Logo */}
      <div className="fixed top-0 left-0 right-0 z-50 shadow-sm" style={{ background: 'var(--header)' }}>
        <div
          className="px-4 py-2"
          style={{
            backgroundColor: 'var(--header)',
            borderBottom: '1px solid rgba(255,255,255,0.08)'
          }}
        >
          {/* Restaurant Header */}
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center">🍽️</div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white tracking-wide elegant-cursive">Demo Menu</h1>
              <p className="text-gray-300 text-xs">Refined flavors. Elevated experience.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer to offset fixed header height */}
      <div className="h-20" />

      {/* Search & Filters (scroll with page) */}
      <div className="max-w-7xl mx-auto px-4 py-2">
        
        {/* Search Bar */}
        <div className="mb-3">
          <div className="flex items-center gap-2 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search menu items, tags, or categories..."
                className="w-full px-3 py-2 pr-9 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-black transition-colors text-sm bg-white text-black"
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
              className="px-3 py-2 rounded-md text-sm font-medium border border-gray-300 bg-white hover:bg-gray-100 text-black"
            >
              {filtersOpen ? 'Hide Filters' : 'Filters'}
            </button>
          </div>
        </div>
        
        {/* Category Filters */}
        <div className="flex gap-2 justify-center flex-wrap mb-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              selectedCategory === null
                ? 'text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={selectedCategory===null?{background:'var(--primary)'}:undefined}
          >
            All Categories
          </button>
          {allCategories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
                selectedCategory === category
                  ? 'text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={selectedCategory===category?{background:'var(--accent)'}:undefined}
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
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 ${
                  selectedDietaryFilters.includes(option)
                    ? 'text-white shadow-md'
                    : 'bg-gray-50 text-gray-800 border-gray-300 hover:border-gray-400'
                }`}
                style={selectedDietaryFilters.includes(option)?{background:'var(--primary)', borderColor:'var(--primary)'}:undefined}
              >
                {option}
              </button>
            ))}
            {(searchQuery || selectedDietaryFilters.length>0 || selectedCategory) && (
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory(null); setSelectedDietaryFilters([]) }}
                className="px-3 py-1 rounded-full text-xs font-medium border border-gray-300 text-black hover:bg-gray-100"
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 lg:grid lg:grid-cols-12 lg:gap-8" style={{ color: '#ffffff' }}>
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
            <div key={category.id} id={`cat-${category.id}`} className={`category-section scroll-mt-24 ${idx > 0 ? 'pt-8 border-t border-white/10' : ''}`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-extrabold text-white font-serif tracking-widest uppercase inline-flex items-center gap-3">
                  {getCategoryIcon(category.name)}
                  <span>{category.name}</span>
                </h2>
                <div className="flex-1 ml-6 lux-divider"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {category.items.map(item => (
                  <div 
                    key={item.id} 
                    className="menu-item bg-gray-50 border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                    style={{ borderRadius: 'var(--radius)' }}
                  >
                    <div className="bg-gray-100">
                      <img 
                        id={`img-${item.id}`}
                        src={item.imageUrl || `https://via.placeholder.com/800x480/cccccc/333333?text=${encodeURIComponent(item.name)}`}
                        alt={item.name}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                    
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-semibold text-black leading-tight">
                          {highlightText(item.name, searchQuery)}
                        </h3>
                        <span className="text-xl font-bold text-black ml-4">
                          ${item.price.toFixed(2)}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 text-sm leading-relaxed italic mb-4">
                        {highlightText(item.description, searchQuery)}
                      </p>
                      
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0 flex flex-wrap gap-1">
                          {item.calories && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-normal text-gray-500 border border-gray-300 bg-transparent">
                              {item.calories} cal
                            </span>
                          )}
                          {item.tags.map(tag => (
                            <span 
                              key={tag} 
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-normal text-gray-500 border border-gray-300 bg-transparent"
                            >
                              {tag}
                            </span>
                          ))}
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
                          className={`text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-1 justify-center whitespace-nowrap min-w-[120px] ${recentlyAddedId===item.id ? 'animate-bump ring-2 ring-yellow-300' : ''}`}
                          style={{background:'var(--accent)'}}
                        >
                          {recentlyAddedId===item.id ? '✓ Added' : 'Add to Plate'}
                        </button>
                        <button
                          onClick={() => { setIsAssistantOpen(true); sendAssistantMessage(`Tell me about ${item.name}`) }}
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
        style={{background:'var(--accent)', color:'#0b0b0b'}}
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
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors text-sm"
                  value={assistantMessage}
                  onChange={(e) => setAssistantMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendAssistantMessage()}
                />
                <button
                  onClick={sendAssistantMessage}
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


"use client"

import { useState, useMemo, useEffect } from 'react'
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

  const sendAssistantMessage = async () => {
    if (!assistantMessage.trim()) return

    const userMessage = assistantMessage.trim()
    setAssistantMessage('')
    setChatHistory(prev => [...prev, { role: 'user', message: userMessage }])

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant,
          message: userMessage
        })
      })

      const data = await response.json()
      setChatHistory(prev => [...prev, { role: 'assistant', message: data.response }])
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
    <div className="min-h-screen">
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
      {/* Sticky Header with Search and Filters */}
      <div className="sticky top-0 z-40 shadow-sm" style={{ background: 'var(--header)' }}>
        <div
          className="px-4 py-6 pb-[96px]"
          style={{
            backgroundColor: 'var(--header)',
            backgroundImage: firstImageUrl
              ? `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url('${firstImageUrl}')`
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: firstImageUrl ? 'fixed' : undefined,
          }}
        >
          {/* Restaurant Header */}
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-white mb-1 tracking-wide">Digital Menu</h1>
            <p className="text-gray-300 text-sm">Refined flavors. Elevated experience.</p>
          </div>
          <div className="gold-sheen h-[2px] opacity-60 mt-4"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-4" style={{ background: 'var(--bg)' }}>

          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative max-w-lg mx-auto">
              <input
                type="text"
                placeholder="Search menu items, tags, or categories..."
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </div>
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
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? 'text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={selectedCategory===category?{background:'var(--accent)'}:undefined}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Dietary Filters */}
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
                    : 'bg-gray-50 text-gray-600 border-gray-300 hover:border-gray-400'
                }`}
                style={selectedDietaryFilters.includes(option)?{background:'var(--primary)', borderColor:'var(--primary)'}:undefined}
              >
                {option}
              </button>
            ))}
            {(searchQuery || selectedDietaryFilters.length>0 || selectedCategory) && (
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory(null); setSelectedDietaryFilters([]) }}
                className="px-3 py-1 rounded-full text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 lg:grid lg:grid-cols-12 lg:gap-8" style={{ color: '#ffffff' }}>
        {/* Current Category Chip */}
        {activeCategoryId && (
          <div className="lg:col-span-12 mb-4">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium" style={{ background: '#2a2a2a', color: '#f5f5f5' }}>
              Browsing: {categories.find(c => c.id === activeCategoryId)?.name || 'All'}
            </span>
          </div>
        )}
        {/* Category Sidebar */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-24 lux-card rounded-xl p-4" style={{ background: '#1a1a1a', borderRadius: 'var(--radius)' }}>
            <h3 className="text-sm font-semibold text-gray-200 mb-3">Categories</h3>
            <nav className="space-y-1">
              <button
                onClick={() => scrollTo('top')}
                className="w-full text-left px-3 py-2 rounded-md text-sm transition"
                style={{ color: '#ffffff', background: '#1f1f1f' }}
              >
                All Categories
              </button>
              {filteredCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => scrollTo(`cat-${category.id}`)}
                  className="w-full text-left px-3 py-2 rounded-md text-sm transition"
                  style={activeCategoryId===category.id?{ color: '#0b0b0b', background: 'var(--accent)' }:{ color: '#e5e5e5', background: '#1a1a1a' }}
                >
                  {category.name}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Menu Grid */}
        <div className="space-y-12 lg:col-span-9" id="top">
          {filteredCategories.map(category => (
            <div key={category.id} id={`cat-${category.id}`} className="category-section scroll-mt-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">{category.name}</h2>
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
                      
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        {highlightText(item.description, searchQuery)}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {item.calories && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {item.calories} cal
                            </span>
                          )}
                          {item.tags.map(tag => (
                            <span 
                              key={tag} 
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        
                        <button
                          onClick={() => {
                            addToCart(item)
                            setRecentlyAddedId(item.id)
                            setCartBump(true)
                            setToast(`Added ${item.name}`)
                            setTimeout(() => setRecentlyAddedId(prev => (prev===item.id?null:prev)), 1000)
                          }}
                          className="text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-1"
                          style={{background:'var(--accent)'}}
                        >
                          {recentlyAddedId===item.id ? '✓ Added' : 'Add to Cart'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Cart Button */}
      <button
        onClick={() => setIsCartOpen(true)}
        className={`fixed bottom-6 right-6 text-white px-6 py-3 rounded-full shadow-lg transition-all duration-200 z-50 flex items-center gap-2 ${cartBump ? 'animate-bump' : ''}`}
        style={{background:'var(--accent)', color:'#0b0b0b'}}
      >
        🛒
        <span className="font-medium">Cart ({cartItemCount})</span>
        {cartItemCount > 0 && (
          <span className="font-bold">${cartTotal.toFixed(2)}</span>
        )}
      </button>

      {/* AI Assistant Button */}
      <button
        onClick={() => setIsAssistantOpen(true)}
        className="fixed bottom-6 left-6 p-3 rounded-full shadow-lg transition-all duration-200 z-50"
        style={{background:'var(--accent)', color:'#0b0b0b'}}
      >
        🤖
      </button>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
          <div className="ml-auto w-full max-w-md bg-gray-50 h-full shadow-xl flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-black">Your Cart</h2>
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
                  <p>Your cart is empty</p>
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
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-medium">{cartItem.quantity}</span>
                          <button
                            onClick={() => updateCartQuantity(cartItem.item.id, cartItem.quantity + 1)}
                            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors"
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
                  Proceed to Checkout
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

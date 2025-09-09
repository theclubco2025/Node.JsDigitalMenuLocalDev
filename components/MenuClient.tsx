
"use client"

import { useState, useMemo } from 'react'
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

  // Get tenant from URL params or use default
  const tenant = typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search).get('tenant') || process.env.NEXT_PUBLIC_DEFAULT_TENANT || 'demo'
    : 'demo'

  const { data: menuData, error, isLoading } = useSWR<MenuResponse>(
    `/api/menu?tenant=${tenant}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}`,
    fetcher
  )

  // Filter logic matching your Canvas app exactly
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
            const matchesDescription = item.description.toLowerCase().includes(searchLower)
            const matchesTags = item.tags.some(tag => tag.toLowerCase().includes(searchLower))
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

  const highlightText = (text: string, query: string) => {
    if (!query) return text
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
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
  
  if (error) return <div className="flex items-center justify-center min-h-screen text-red-600">Failed to load menu</div>
  if (isLoading) return <div className="flex items-center justify-center min-h-screen">Loading menu...</div>

  const categories = menuData?.categories || []
  const allCategories = categories.map(cat => cat.name)

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Sticky Header with Search and Filters */}
      <div className="sticky top-0 z-40 border-b border-gray-200 shadow-sm">
        <div
          className="px-4 py-6"
          style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
          }}
        >
          {/* Restaurant Header */}
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-white mb-1">Digital Menu</h1>
            <p className="text-white/80 text-sm">Browse categories, search, and add to cart</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-4 bg-white">

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
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                }`}
                style={selectedDietaryFilters.includes(option)?{background:'var(--primary)', borderColor:'var(--primary)'}:undefined}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 lg:grid lg:grid-cols-12 lg:gap-8">
        {/* Category Sidebar */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-24 bg-white border border-gray-200 rounded-xl p-4" style={{ borderRadius: 'var(--radius)' }}>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Categories</h3>
            <nav className="space-y-1">
              <button
                onClick={() => scrollTo('top')}
                className="w-full text-left px-3 py-2 rounded-md text-sm transition hover:bg-gray-100"
              >
                All Categories
              </button>
              {filteredCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => scrollTo(`cat-${category.id}`)}
                  className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 transition hover:bg-gray-100"
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
                <h2 className="text-2xl font-bold text-black">{category.name}</h2>
                <div className="h-px flex-1 bg-gray-200 ml-6"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {category.items.map(item => (
                  <div 
                    key={item.id} 
                    className="menu-item bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                    style={{ borderRadius: 'var(--radius)' }}
                  >
                    {item.imageUrl && (
                      <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                        <img 
                          src={item.imageUrl} 
                          alt={item.name}
                          className="w-full h-48 object-cover"
                        />
                      </div>
                    )}
                    
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
                          onClick={() => addToCart(item)}
                          className="text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-1"
                          style={{background:'var(--accent)'}}
                        >
                          Add to Cart
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
        className="fixed bottom-6 right-6 text-white px-6 py-3 rounded-full shadow-lg transition-all duration-200 z-50 flex items-center gap-2"
        style={{background:'var(--primary)'}}
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
        className="fixed bottom-6 left-6 text-white p-3 rounded-full shadow-lg transition-all duration-200 z-50"
        style={{background:'var(--accent)'}}
      >
        🤖
      </button>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
          <div className="ml-auto w-full max-w-md bg-white h-full shadow-xl flex flex-col">
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
          <div className="w-full max-w-md bg-white h-full shadow-xl flex flex-col">
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
    </div>
  )
}

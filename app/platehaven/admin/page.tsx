/* eslint-disable @next/next/no-img-element */
"use client"

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import type { MenuResponse } from '@/types/api'

type DraftMenu = MenuResponse

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(2, 6)}`
}

function parseTags(raw: string): string[] {
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

export default function PlateHavenAdminPage() {
  const tenant = 'demo'
  const [menu, setMenu] = useState<DraftMenu | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'menu' | 'catering' | 'analytics' | 'settings'>('menu')

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2000)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      setDirty(false)
      try {
        const res = await fetch(`/api/menu?tenant=${encodeURIComponent(tenant)}`, { cache: 'no-store' })
        const json = await res.json().catch(() => null)
        if (!res.ok) throw new Error(json?.error || `Load failed (${res.status})`)
        if (!cancelled) setMenu(deepClone(json as DraftMenu))
      } catch (e) {
        if (!cancelled) setError((e as Error)?.message || 'Load error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  const save = async () => {
    setToast('Demo mode — changes are not saved')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/assets/platehaven-logo.png" alt="PlateHaven" className="h-9 w-auto" />
            <div>
              <div className="text-lg font-semibold text-gray-900">PlateHaven</div>
              <div className="text-xs text-gray-500">Admin Panel</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/menu?tenant=demo"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              View Menu →
            </Link>
            <Link
              href="/demo"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to Demo
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Demo Banner */}
        <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-amber-600">ℹ️</span>
            <span className="text-sm text-amber-800">
              <strong>Demo Mode</strong> — Changes are not saved. This shows how your admin panel will work.
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'menu'
                ? 'text-[#C4A76A] border-b-2 border-[#C4A76A]'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Menu Editor
          </button>
          <button
            onClick={() => setActiveTab('catering')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'catering'
                ? 'text-[#C4A76A] border-b-2 border-[#C4A76A]'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Catering Orders
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'text-[#C4A76A] border-b-2 border-[#C4A76A]'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'text-[#C4A76A] border-b-2 border-[#C4A76A]'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Settings
          </button>
        </div>

        {activeTab === 'menu' && (
          <>
            {/* Action Bar */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Menu Editor</h1>
                <p className="text-sm text-gray-500 mt-1">Add, edit, and organize your menu items</p>
              </div>
              <div className="flex items-center gap-2">
                {dirty && (
                  <span className="text-xs font-medium text-amber-700 bg-amber-100 border border-amber-200 rounded px-2 py-1">
                    Unsaved changes
                  </span>
                )}
                <button
                  type="button"
                  onClick={save}
                  disabled={saving || loading || !menu}
                  className="px-4 py-2 bg-[#C4A76A] text-white text-sm font-semibold rounded-lg hover:bg-[#b3965d] disabled:opacity-50 transition-colors shadow-sm"
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="mb-6">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search items..."
                className="w-full max-w-md rounded-lg bg-white border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#C4A76A]/50 focus:border-[#C4A76A]"
              />
            </div>

            {error && (
              <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {loading && (
              <div className="rounded-lg bg-white border border-gray-200 p-8 text-center text-gray-500 shadow-sm">
                Loading menu...
              </div>
            )}

            {!loading && menu && (
              <div className="space-y-6">
                {/* Add Category Button */}
                <button
                  type="button"
                  onClick={() => {
                    setMenu(prev => {
                      if (!prev) return prev
                      const next = deepClone(prev)
                      next.categories = next.categories || []
                      next.categories.push({ id: newId('c'), name: 'New Category', items: [] })
                      setDirty(true)
                      return next
                    })
                  }}
                  className="w-full rounded-lg border-2 border-dashed border-gray-300 py-4 text-sm text-gray-500 hover:border-[#C4A76A] hover:text-[#C4A76A] transition-colors bg-white"
                >
                  + Add Category
                </button>

                {/* Categories */}
                {(menu.categories || []).map((cat, catIdx) => (
                  <div key={cat.id || catIdx} className="rounded-xl bg-white border border-gray-200 overflow-hidden shadow-sm">
                    {/* Category Header */}
                    <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center justify-between gap-4">
                        <input
                          value={cat.name || ''}
                          onChange={(e) => {
                            const v = e.target.value
                            setMenu(prev => {
                              if (!prev) return prev
                              const next = deepClone(prev)
                              next.categories[catIdx].name = v
                              setDirty(true)
                              return next
                            })
                          }}
                          className="flex-1 bg-transparent text-lg font-semibold text-gray-900 border-none focus:outline-none"
                          placeholder="Category name"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setMenu(prev => {
                                if (!prev) return prev
                                const next = deepClone(prev)
                                next.categories[catIdx].items = next.categories[catIdx].items || []
                                next.categories[catIdx].items.push({
                                  id: newId('i'),
                                  name: 'New Item',
                                  description: '',
                                  price: 0,
                                  tags: [],
                                })
                                setDirty(true)
                                return next
                              })
                            }}
                            className="px-3 py-1.5 bg-[#C4A76A] text-white text-xs font-semibold rounded-lg hover:bg-[#b3965d] transition-colors shadow-sm"
                          >
                            + Add Item
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMenu(prev => {
                                if (!prev) return prev
                                const next = deepClone(prev)
                                next.categories.splice(catIdx, 1)
                                setDirty(true)
                                return next
                              })
                            }}
                            className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors border border-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="divide-y divide-gray-100">
                      {(cat.items || [])
                        .filter((it) => {
                          const q = query.trim().toLowerCase()
                          if (!q) return true
                          return `${it.name || ''} ${(it.tags || []).join(' ')}`.toLowerCase().includes(q)
                        })
                        .map((it) => {
                          const itemIdx = (cat.items || []).findIndex((x) => x.id === it.id)
                          if (itemIdx < 0) return null
                          return (
                            <div key={it.id || itemIdx} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                              <div className="grid grid-cols-1 md:grid-cols-[1fr,120px] gap-4">
                                <div className="space-y-3">
                                  <input
                                    value={it.name || ''}
                                    onChange={(e) => {
                                      const v = e.target.value
                                      setMenu(prev => {
                                        if (!prev) return prev
                                        const next = deepClone(prev)
                                        next.categories[catIdx].items[itemIdx].name = v
                                        setDirty(true)
                                        return next
                                      })
                                    }}
                                    className="w-full bg-transparent text-gray-900 font-medium border-none focus:outline-none"
                                    placeholder="Item name"
                                  />
                                  <textarea
                                    value={it.description || ''}
                                    onChange={(e) => {
                                      const v = e.target.value
                                      setMenu(prev => {
                                        if (!prev) return prev
                                        const next = deepClone(prev)
                                        next.categories[catIdx].items[itemIdx].description = v
                                        setDirty(true)
                                        return next
                                      })
                                    }}
                                    className="w-full bg-gray-50 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-[#C4A76A]/50 focus:border-[#C4A76A]"
                                    rows={2}
                                    placeholder="Description"
                                  />
                                  <div className="flex gap-3">
                                    <input
                                      value={(it.tags || []).join(', ')}
                                      onChange={(e) => {
                                        const v = e.target.value
                                        setMenu(prev => {
                                          if (!prev) return prev
                                          const next = deepClone(prev)
                                          next.categories[catIdx].items[itemIdx].tags = parseTags(v)
                                          setDirty(true)
                                          return next
                                        })
                                      }}
                                      className="flex-1 bg-gray-50 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#C4A76A]/50 focus:border-[#C4A76A]"
                                      placeholder="Tags (comma-separated)"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMenu(prev => {
                                          if (!prev) return prev
                                          const next = deepClone(prev)
                                          next.categories[catIdx].items.splice(itemIdx, 1)
                                          setDirty(true)
                                          return next
                                        })
                                      }}
                                      className="px-2 py-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-500 mb-1">Price</label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={typeof it.price === 'number' ? it.price : Number(it.price || 0)}
                                      onChange={(e) => {
                                        const v = Number(e.target.value)
                                        setMenu(prev => {
                                          if (!prev) return prev
                                          const next = deepClone(prev)
                                          next.categories[catIdx].items[itemIdx].price = Number.isFinite(v) ? v : 0
                                          setDirty(true)
                                          return next
                                        })
                                      }}
                                      className="w-full bg-white rounded-lg border border-gray-200 pl-7 pr-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C4A76A]/50 focus:border-[#C4A76A]"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      {(cat.items || []).length === 0 && (
                        <div className="px-5 py-8 text-center text-sm text-gray-400">
                          No items in this category yet
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'catering' && (
          <CateringPipelineTab tenant={tenant} />
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
              <p className="text-sm text-gray-500 mt-1">Track your catering performance and customer insights</p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Orders', value: '47', change: '+12%', icon: '📦' },
                { label: 'Revenue', value: '$8,420', change: '+18%', icon: '💰' },
                { label: 'Avg Order Size', value: '$179', change: '+5%', icon: '📊' },
                { label: 'Repeat Customers', value: '23%', change: '+8%', icon: '🔄' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{stat.icon}</span>
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{stat.change}</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Top Items */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Top Selling Items</h3>
                <div className="space-y-3">
                  {[
                    { name: 'BBQ Pulled Pork Platter', orders: 32, revenue: '$1,280' },
                    { name: 'Smoked Brisket Tray', orders: 28, revenue: '$1,680' },
                    { name: 'Grilled Chicken Wings (50 pc)', orders: 24, revenue: '$720' },
                    { name: 'Mac & Cheese Family Style', orders: 22, revenue: '$440' },
                    { name: 'Cornbread Basket', orders: 18, revenue: '$180' },
                  ].map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#C4A76A]/20 text-[#C4A76A] text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.orders} orders</div>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">{item.revenue}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Event Types</h3>
                <div className="space-y-3">
                  {[
                    { type: 'Corporate Lunch', count: 18, pct: 38 },
                    { type: 'Birthday Party', count: 12, pct: 26 },
                    { type: 'Wedding', count: 8, pct: 17 },
                    { type: 'Community Event', count: 5, pct: 11 },
                    { type: 'Other', count: 4, pct: 8 },
                  ].map((event) => (
                    <div key={event.type}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-900">{event.type}</span>
                        <span className="text-xs text-gray-500">{event.count} orders ({event.pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#C4A76A] rounded-full transition-all"
                          style={{ width: `${event.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Orders by Hour */}
            <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Orders by Hour</h3>
              <div className="h-40 flex items-end gap-1">
                {[2, 3, 5, 8, 12, 18, 22, 20, 15, 10, 6, 4].map((val, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <div 
                      className="w-full bg-[#C4A76A]/80 rounded-t"
                      style={{ height: `${(val / 22) * 100}%` }}
                    />
                    <span className="text-[10px] text-gray-400">{8 + idx}:00</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Questions */}
            <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Common Customer Questions (AI Assistant)</h3>
              <div className="space-y-2">
                {[
                  { question: 'What dietary accommodations do you offer?', count: 28, category: 'dietary' },
                  { question: 'How far in advance should I order?', count: 22, category: 'logistics' },
                  { question: 'Do you deliver to [location]?', count: 18, category: 'delivery' },
                  { question: 'Can you handle nut allergies?', count: 15, category: 'dietary' },
                  { question: 'What is your minimum order size?', count: 12, category: 'pricing' },
                ].map((q) => (
                  <div key={q.question} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-gray-50">
                    <span className="text-xs px-2 py-0.5 rounded bg-[#C4A76A]/20 text-[#C4A76A] font-medium">{q.category}</span>
                    <span className="flex-1 text-sm text-gray-700">{q.question}</span>
                    <span className="text-xs text-gray-500">{q.count}x</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-500 mt-1">Configure your ordering preferences</p>
            </div>

            {/* Business Info */}
            <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Business Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Business Name</label>
                  <input
                    type="text"
                    defaultValue="Your Business Name"
                    className="w-full bg-gray-50 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C4A76A]/50 focus:border-[#C4A76A]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Contact Email</label>
                  <input
                    type="email"
                    defaultValue="orders@yourbusiness.com"
                    className="w-full bg-gray-50 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#C4A76A]/50 focus:border-[#C4A76A]"
                  />
                </div>
              </div>
            </div>

            {/* Ordering Mode */}
            <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Ordering Mode</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <input type="radio" name="mode" defaultChecked className="accent-[#C4A76A] w-4 h-4" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Catering Mode</div>
                    <div className="text-xs text-gray-500">Event details, serving sizes, and delivery options</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <input type="radio" name="mode" className="accent-[#C4A76A] w-4 h-4" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Food Truck Mode</div>
                    <div className="text-xs text-gray-500">Quick pickup orders with name only</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Notifications */}
            <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Order Notifications</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <input type="checkbox" defaultChecked className="accent-[#C4A76A] w-4 h-4" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Email notifications</div>
                    <div className="text-xs text-gray-500">Receive order details via email</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <input type="checkbox" className="accent-[#C4A76A] w-4 h-4" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">SMS notifications</div>
                    <div className="text-xs text-gray-500">Get text alerts for new orders</div>
                  </div>
                </label>
              </div>
            </div>

            <button
              onClick={() => setToast('Demo mode — settings are not saved')}
              className="px-4 py-2 bg-[#C4A76A] text-white text-sm font-semibold rounded-lg hover:bg-[#b3965d] transition-colors shadow-sm"
            >
              Save Settings
            </button>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-xl">
            {toast}
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// CATERING PIPELINE TAB COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface CateringOrder {
  id: string
  quoteNumber: string
  status: string
  quoteStatus: string | null
  customerName: string
  customerEmail: string
  customerPhone: string
  companyName: string | null
  eventDate: string | null
  eventTime: string | null
  eventType: string | null
  guestCount: number | null
  deliveryAddress: string | null
  totalCents: number
  depositCents: number | null
  depositPaidAt: string | null
  balanceCents: number | null
  balancePaidAt: string | null
  createdAt: string
}

function formatMoney(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function CateringPipelineTab({ tenant }: { tenant: string }) {
  const [orders, setOrders] = useState<CateringOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<CateringOrder | null>(null)
  const [sendingQuote, setSendingQuote] = useState(false)

  const loadOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/catering/orders?tenant=${encodeURIComponent(tenant)}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      }
    } catch (e) {
      console.error('Failed to load orders:', e)
    } finally {
      setLoading(false)
    }
  }, [tenant])
  
  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const sendQuote = async (orderId: string) => {
    setSendingQuote(true)
    try {
      const res = await fetch(`/api/admin/catering/orders/${orderId}/send-quote`, {
        method: 'POST',
      })
      if (res.ok) {
        loadOrders()
        setSelectedOrder(null)
      }
    } catch (e) {
      console.error('Failed to send quote:', e)
    } finally {
      setSendingQuote(false)
    }
  }

  const columns = [
    { key: 'INQUIRY', label: 'Inquiries', color: 'bg-blue-500' },
    { key: 'QUOTED', label: 'Quoted', color: 'bg-amber-500' },
    { key: 'DEPOSIT_PAID', label: 'Confirmed', color: 'bg-green-500' },
    { key: 'COMPLETED', label: 'Completed', color: 'bg-gray-400' },
  ]

  // Demo data for the pipeline
  const demoOrders: CateringOrder[] = [
    {
      id: 'demo-1',
      quoteNumber: 'QT-2026-0042',
      status: 'INQUIRY',
      quoteStatus: 'DRAFT',
      customerName: 'Sarah Johnson',
      customerEmail: 'sarah@example.com',
      customerPhone: '(555) 123-4567',
      companyName: null,
      eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      eventTime: '4:00 PM - 8:00 PM',
      eventType: 'Wedding Reception',
      guestCount: 75,
      deliveryAddress: '123 Venue Dr, San Francisco, CA',
      totalCents: 245000,
      depositCents: null,
      depositPaidAt: null,
      balanceCents: null,
      balancePaidAt: null,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo-2',
      quoteNumber: 'QT-2026-0041',
      status: 'INQUIRY',
      quoteStatus: 'DRAFT',
      customerName: 'Mike Chen',
      customerEmail: 'mike@techcorp.com',
      customerPhone: '(555) 987-6543',
      companyName: 'TechCorp Inc',
      eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      eventTime: '12:00 PM - 2:00 PM',
      eventType: 'Corporate Lunch',
      guestCount: 30,
      deliveryAddress: '500 Market St, Suite 400',
      totalCents: 89000,
      depositCents: null,
      depositPaidAt: null,
      balanceCents: null,
      balancePaidAt: null,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo-3',
      quoteNumber: 'QT-2026-0039',
      status: 'QUOTED',
      quoteStatus: 'SENT',
      customerName: 'Lisa Park',
      customerEmail: 'lisa@email.com',
      customerPhone: '(555) 456-7890',
      companyName: null,
      eventDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      eventTime: '6:00 PM - 10:00 PM',
      eventType: 'Birthday Party',
      guestCount: 45,
      deliveryAddress: '789 Party Lane',
      totalCents: 156000,
      depositCents: 78000,
      depositPaidAt: null,
      balanceCents: 78000,
      balancePaidAt: null,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo-4',
      quoteNumber: 'QT-2026-0035',
      status: 'DEPOSIT_PAID',
      quoteStatus: 'ACCEPTED',
      customerName: 'David Williams',
      customerEmail: 'david@company.com',
      customerPhone: '(555) 321-0987',
      companyName: 'Williams & Co',
      eventDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      eventTime: '11:30 AM - 1:30 PM',
      eventType: 'Corporate Meeting',
      guestCount: 25,
      deliveryAddress: '200 Business Blvd',
      totalCents: 67500,
      depositCents: 33750,
      depositPaidAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      balanceCents: 33750,
      balancePaidAt: null,
      createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo-5',
      quoteNumber: 'QT-2026-0030',
      status: 'COMPLETED',
      quoteStatus: 'ACCEPTED',
      customerName: 'Green Valley HOA',
      customerEmail: 'events@greenvalley.org',
      customerPhone: '(555) 111-2222',
      companyName: 'Green Valley HOA',
      eventDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      eventTime: '2:00 PM - 5:00 PM',
      eventType: 'Community Event',
      guestCount: 120,
      deliveryAddress: '100 Community Center Blvd',
      totalCents: 312000,
      depositCents: 156000,
      depositPaidAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      balanceCents: 156000,
      balancePaidAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]

  const displayOrders = orders.length > 0 ? orders : demoOrders

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Catering Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Manage inquiries, quotes, and confirmed events</p>
        </div>
        <button
          onClick={loadOrders}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading orders...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {columns.map((col) => {
            const colOrders = displayOrders.filter(o => {
              if (col.key === 'INQUIRY') return o.status === 'INQUIRY' || (o.status === 'NEW' && o.quoteStatus === 'DRAFT')
              if (col.key === 'QUOTED') return o.quoteStatus === 'SENT' || o.status === 'QUOTED'
              if (col.key === 'DEPOSIT_PAID') return o.status === 'DEPOSIT_PAID' || o.status === 'BALANCE_DUE' || o.status === 'PAID_IN_FULL'
              if (col.key === 'COMPLETED') return o.status === 'COMPLETED'
              return false
            })
            
            return (
              <div key={col.key} className="bg-gray-100 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className={`w-2 h-2 rounded-full ${col.color}`} />
                  <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                  <span className="ml-auto text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
                    {colOrders.length}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {colOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md hover:border-[#C4A76A]/30 transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500">{order.quoteNumber}</span>
                        {order.depositPaidAt && !order.balancePaidAt && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Balance Due</span>
                        )}
                      </div>
                      <div className="font-medium text-gray-900 text-sm mb-1">
                        {order.customerName}
                        {order.companyName && (
                          <span className="text-gray-500 font-normal"> • {order.companyName}</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 space-y-0.5">
                        {order.eventDate && (
                          <div className="flex items-center gap-1">
                            <span>📅</span>
                            <span>{formatShortDate(order.eventDate)}</span>
                            {order.eventType && <span>• {order.eventType}</span>}
                          </div>
                        )}
                        {order.guestCount && (
                          <div className="flex items-center gap-1">
                            <span>👥</span>
                            <span>{order.guestCount} guests</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 font-medium text-gray-700">
                          <span>💰</span>
                          <span>{formatMoney(order.totalCents)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {colOrders.length === 0 && (
                    <div className="text-center py-6 text-xs text-gray-400">
                      No orders
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedOrder.quoteNumber}</h2>
                <p className="text-sm text-gray-500">{selectedOrder.eventType || 'Catering Order'}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Customer</h3>
                  <p className="font-medium text-gray-900">{selectedOrder.customerName}</p>
                  {selectedOrder.companyName && (
                    <p className="text-sm text-gray-600">{selectedOrder.companyName}</p>
                  )}
                  <p className="text-sm text-gray-600">{selectedOrder.customerEmail}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.customerPhone}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Event</h3>
                  {selectedOrder.eventDate && (
                    <p className="text-sm text-gray-900">
                      {new Date(selectedOrder.eventDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                  {selectedOrder.eventTime && (
                    <p className="text-sm text-gray-600">{selectedOrder.eventTime}</p>
                  )}
                  {selectedOrder.guestCount && (
                    <p className="text-sm text-gray-600">{selectedOrder.guestCount} guests</p>
                  )}
                  {selectedOrder.deliveryAddress && (
                    <p className="text-sm text-gray-600 mt-2">{selectedOrder.deliveryAddress}</p>
                  )}
                </div>
              </div>
              
              {/* Payment Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Payment</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total</span>
                    <span className="font-bold text-gray-900">{formatMoney(selectedOrder.totalCents)}</span>
                  </div>
                  {selectedOrder.depositCents && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Deposit (50%)</span>
                        <span className={selectedOrder.depositPaidAt ? 'text-green-600' : 'text-gray-900'}>
                          {formatMoney(selectedOrder.depositCents)}
                          {selectedOrder.depositPaidAt && ' ✓'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Balance</span>
                        <span className={selectedOrder.balancePaidAt ? 'text-green-600' : 'text-gray-900'}>
                          {formatMoney(selectedOrder.balanceCents || 0)}
                          {selectedOrder.balancePaidAt && ' ✓'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {(selectedOrder.status === 'INQUIRY' || selectedOrder.quoteStatus === 'DRAFT') && (
                  <>
                    <button
                      onClick={() => sendQuote(selectedOrder.id)}
                      disabled={sendingQuote}
                      className="flex-1 px-4 py-2.5 bg-[#C4A76A] text-white font-semibold rounded-lg hover:bg-[#b3965d] disabled:opacity-50 transition-colors"
                    >
                      {sendingQuote ? 'Sending...' : 'Send Quote to Customer'}
                    </button>
                    <a
                      href={`/quote/${selectedOrder.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Preview Quote
                    </a>
                  </>
                )}
                {selectedOrder.quoteStatus === 'SENT' && (
                  <a
                    href={`/quote/${selectedOrder.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-2.5 bg-[#C4A76A] text-white font-semibold rounded-lg hover:bg-[#b3965d] transition-colors text-center"
                  >
                    View Quote Page
                  </a>
                )}
                {selectedOrder.depositPaidAt && !selectedOrder.balancePaidAt && (
                  <div className="flex-1 text-center py-2.5 text-amber-700 bg-amber-50 rounded-lg font-medium">
                    Awaiting Balance Payment
                  </div>
                )}
                {selectedOrder.balancePaidAt && (
                  <div className="flex-1 text-center py-2.5 text-green-700 bg-green-50 rounded-lg font-medium">
                    ✓ Fully Paid
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

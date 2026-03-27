/* eslint-disable @next/next/no-img-element */
"use client"

import { useEffect, useState } from 'react'
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
  const tenant = 'platehaven-demo'
  const [menu, setMenu] = useState<DraftMenu | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'menu' | 'settings'>('menu')

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
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#111]">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/assets/platepilot-logo.png" alt="PlateHaven" className="h-9 w-auto" />
            <div>
              <div className="text-lg font-semibold text-[#C4A76A]">PlateHaven</div>
              <div className="text-xs text-white/50">Admin Panel</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/menu?tenant=platehaven-demo"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              View Menu →
            </Link>
            <Link
              href="/demo"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              ← Back to Demo
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Demo Banner */}
        <div className="mb-6 rounded-lg bg-[#C4A76A]/10 border border-[#C4A76A]/20 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-[#C4A76A]">ℹ️</span>
            <span className="text-sm text-[#C4A76A]">
              Demo Mode — Changes are not saved. This shows how your admin panel will work.
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-white/10">
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'menu'
                ? 'text-[#C4A76A] border-b-2 border-[#C4A76A]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Menu Editor
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'text-[#C4A76A] border-b-2 border-[#C4A76A]'
                : 'text-white/60 hover:text-white'
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
                <h1 className="text-xl font-bold">Menu Editor</h1>
                <p className="text-sm text-white/50 mt-1">Add, edit, and organize your menu items</p>
              </div>
              <div className="flex items-center gap-2">
                {dirty && (
                  <span className="text-xs font-medium text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded px-2 py-1">
                    Unsaved changes
                  </span>
                )}
                <button
                  type="button"
                  onClick={save}
                  disabled={saving || loading || !menu}
                  className="px-4 py-2 bg-[#C4A76A] text-[#111] text-sm font-semibold rounded hover:bg-[#d4b87a] disabled:opacity-50 transition-colors"
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
                className="w-full max-w-md rounded-lg bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#C4A76A]/50"
              />
            </div>

            {error && (
              <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {loading && (
              <div className="rounded-lg bg-white/5 border border-white/10 p-8 text-center text-white/60">
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
                  className="w-full rounded-lg border-2 border-dashed border-white/20 py-4 text-sm text-white/60 hover:border-[#C4A76A]/50 hover:text-[#C4A76A] transition-colors"
                >
                  + Add Category
                </button>

                {/* Categories */}
                {(menu.categories || []).map((cat, catIdx) => (
                  <div key={cat.id || catIdx} className="rounded-xl bg-[#161616] border border-white/10 overflow-hidden">
                    {/* Category Header */}
                    <div className="px-5 py-4 bg-[#1a1a1a] border-b border-white/10">
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
                          className="flex-1 bg-transparent text-lg font-semibold text-white border-none focus:outline-none"
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
                            className="px-3 py-1.5 bg-[#C4A76A] text-[#111] text-xs font-semibold rounded hover:bg-[#d4b87a] transition-colors"
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
                            className="px-3 py-1.5 bg-red-500/10 text-red-400 text-xs font-semibold rounded hover:bg-red-500/20 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="divide-y divide-white/5">
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
                            <div key={it.id || itemIdx} className="px-5 py-4">
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
                                    className="w-full bg-transparent text-white font-medium border-none focus:outline-none"
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
                                    className="w-full bg-white/5 rounded border border-white/10 px-3 py-2 text-sm text-white/70 resize-none focus:outline-none focus:border-[#C4A76A]/50"
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
                                      className="flex-1 bg-white/5 rounded border border-white/10 px-3 py-1.5 text-xs text-white/70 focus:outline-none focus:border-[#C4A76A]/50"
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
                                      className="px-2 py-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs text-white/50 mb-1">Price</label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">$</span>
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
                                      className="w-full bg-white/5 rounded border border-white/10 pl-7 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#C4A76A]/50"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      {(cat.items || []).length === 0 && (
                        <div className="px-5 py-8 text-center text-sm text-white/40">
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

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold">Settings</h1>
              <p className="text-sm text-white/50 mt-1">Configure your ordering preferences</p>
            </div>

            {/* Business Info */}
            <div className="rounded-xl bg-[#161616] border border-white/10 p-5">
              <h3 className="font-semibold mb-4">Business Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1">Business Name</label>
                  <input
                    type="text"
                    defaultValue="Your Business Name"
                    className="w-full bg-white/5 rounded border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C4A76A]/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">Contact Email</label>
                  <input
                    type="email"
                    defaultValue="orders@yourbusiness.com"
                    className="w-full bg-white/5 rounded border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C4A76A]/50"
                  />
                </div>
              </div>
            </div>

            {/* Ordering Mode */}
            <div className="rounded-xl bg-[#161616] border border-white/10 p-5">
              <h3 className="font-semibold mb-4">Ordering Mode</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="mode" defaultChecked className="accent-[#C4A76A]" />
                  <div>
                    <div className="text-sm font-medium">Catering Mode</div>
                    <div className="text-xs text-white/50">Event details, serving sizes, and delivery options</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="mode" className="accent-[#C4A76A]" />
                  <div>
                    <div className="text-sm font-medium">Food Truck Mode</div>
                    <div className="text-xs text-white/50">Quick pickup orders with name only</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Notifications */}
            <div className="rounded-xl bg-[#161616] border border-white/10 p-5">
              <h3 className="font-semibold mb-4">Order Notifications</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-[#C4A76A] w-4 h-4" />
                  <div>
                    <div className="text-sm font-medium">Email notifications</div>
                    <div className="text-xs text-white/50">Receive order details via email</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="accent-[#C4A76A] w-4 h-4" />
                  <div>
                    <div className="text-sm font-medium">SMS notifications</div>
                    <div className="text-xs text-white/50">Get text alerts for new orders</div>
                  </div>
                </label>
              </div>
            </div>

            <button
              onClick={() => setToast('Demo mode — settings are not saved')}
              className="px-4 py-2 bg-[#C4A76A] text-[#111] text-sm font-semibold rounded hover:bg-[#d4b87a] transition-colors"
            >
              Save Settings
            </button>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#222] text-white text-sm font-medium px-4 py-2 rounded-lg shadow-xl border border-white/10">
            {toast}
          </div>
        )}
      </div>
    </div>
  )
}

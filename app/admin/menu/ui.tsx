"use client"

import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
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

export default function AdminMenuClient({ tenant }: { tenant: string }) {
  const editorUrl = useMemo(() => `/menu?tenant=${encodeURIComponent(tenant)}&admin=1`, [tenant])
  const [menu, setMenu] = useState<DraftMenu | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [query, setQuery] = useState('')

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
  }, [tenant])

  const save = async () => {
    if (!menu) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/tenant/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant, menu }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) throw new Error(json?.error || `Save failed (${res.status})`)
      setToast('Saved')
      setDirty(false)
    } catch (e) {
      setError((e as Error)?.message || 'Save error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout requiredRole="RESTAURANT_OWNER">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900">Menu Editor</h2>
        <p className="mt-2 text-gray-600">
          Tenant: <span className="font-mono">{tenant}</span>
        </p>

        <div className="mt-3 text-sm text-gray-600">
          Edit your menu here, then click <span className="font-semibold">Save</span>. Changes show up on the customer menu instantly (no redeploy).
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={save}
            disabled={saving || loading || !menu}
            className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          {dirty && (
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
              Unsaved changes
            </span>
          )}
          <a
            href={editorUrl}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-900 hover:bg-gray-50"
          >
            View customer menu
          </a>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
            Loading menu…
          </div>
        )}

        {!loading && menu && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">Categories</div>
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
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-bold hover:bg-gray-50"
              >
                + Add category
              </button>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <label className="block text-xs font-semibold text-gray-700">Search items</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or description…"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            {(menu.categories || []).map((cat, catIdx) => (
              <div key={cat.id || catIdx} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-700">Category name</label>
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
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
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
                      className="rounded-lg bg-black px-3 py-2 text-xs font-bold text-white hover:bg-gray-800"
                    >
                      + Add item
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
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                    >
                      Delete category
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {(cat.items || [])
                    .filter((it) => {
                      const q = query.trim().toLowerCase()
                      if (!q) return true
                      return `${it.name || ''} ${it.description || ''}`.toLowerCase().includes(q)
                    })
                    .map((it, itemIdx) => (
                    <div key={it.id || itemIdx} className="rounded-lg border border-gray-200 p-3">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-gray-700">Item name</label>
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
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="w-full sm:w-40">
                          <label className="block text-xs font-semibold text-gray-700">Price</label>
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
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className="block text-xs font-semibold text-gray-700">Description</label>
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
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          rows={2}
                        />
                      </div>

                      <div className="mt-3 flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-gray-700">Tags (comma-separated)</label>
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
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="w-full sm:w-40">
                          <label className="block text-xs font-semibold text-gray-700">Calories (optional)</label>
                          <input
                            type="number"
                            value={typeof it.calories === 'number' ? it.calories : ''}
                            onChange={(e) => {
                              const v = e.target.value === '' ? undefined : Number(e.target.value)
                              setMenu(prev => {
                                if (!prev) return prev
                                const next = deepClone(prev)
                                next.categories[catIdx].items[itemIdx].calories = (v !== undefined && Number.isFinite(v)) ? Math.round(v) : undefined
                              setDirty(true)
                                return next
                              })
                            }}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>

                      <div className="mt-3 flex justify-end">
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
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                        >
                          Delete item
                        </button>
                      </div>
                    </div>
                  ))}
                  {(cat.items || []).length === 0 && (
                    <div className="text-sm text-gray-500">
                      No items yet.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}


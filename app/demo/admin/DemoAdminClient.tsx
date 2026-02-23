"use client"

import { useEffect, useMemo, useState } from 'react'

type MenuItem = {
  id: string
  name: string
  description?: string
  price?: number
  tags?: string[]
}

type MenuCategory = {
  id: string
  name: string
  items: MenuItem[]
}

type MenuResponse = {
  categories: MenuCategory[]
}

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then((r) => r.json())

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

function money(n: number) {
  return `$${Number.isFinite(n) ? n.toFixed(2) : '0.00'}`
}

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(2, 6)}`
}

function parseTags(raw: string) {
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

export default function DemoAdminClient() {
  const tenant = 'demo'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [menu, setMenu] = useState<MenuResponse | null>(null)
  const [draft, setDraft] = useState<MenuResponse | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const json = await fetcher(`/api/menu?tenant=${encodeURIComponent(tenant)}`)
        if (!cancelled) {
          setMenu(json as MenuResponse)
          setDraft(deepClone(json as MenuResponse))
        }
      } catch (e) {
        if (!cancelled) setError((e as Error)?.message || 'Failed to load menu')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 1800)
    return () => clearTimeout(t)
  }, [toast])

  const filtered = useMemo(() => {
    const base = draft?.categories ?? []
    const q = query.trim().toLowerCase()
    if (!q) return base
    return base
      .map((c) => ({
        ...c,
        items: (c.items || []).filter((it) => {
          const name = String(it.name || '').toLowerCase()
          const desc = String(it.description || '').toLowerCase()
          return name.includes(q) || desc.includes(q) || String(it.id || '').toLowerCase().includes(q)
        })
      }))
      .filter((c) => c.items.length > 0)
  }, [draft, query])

  const resetDraft = () => {
    if (!menu) return
    setDraft(deepClone(menu))
    setToast('Reset (demo only)')
  }

  const fakeSave = () => {
    setToast('Demo only — changes are not saved')
  }

  const addCategory = () => {
    setDraft((prev) => {
      if (!prev) return prev
      const next = deepClone(prev)
      next.categories = Array.isArray(next.categories) ? next.categories : []
      next.categories.push({ id: newId('c'), name: 'New category', items: [] })
      return next
    })
    setToast('Added category (demo only)')
  }

  const deleteCategory = (catId: string) => {
    setDraft((prev) => {
      if (!prev) return prev
      const next = deepClone(prev)
      next.categories = (next.categories || []).filter((c) => c.id !== catId)
      return next
    })
    setToast('Deleted category (demo only)')
  }

  const updateCategory = (catId: string, patch: Partial<MenuCategory>) => {
    setDraft((prev) => {
      if (!prev) return prev
      const next = deepClone(prev)
      const cat = next.categories.find((c) => c.id === catId)
      if (!cat) return prev
      Object.assign(cat, patch)
      return next
    })
  }

  const addItem = (catId: string) => {
    setDraft((prev) => {
      if (!prev) return prev
      const next = deepClone(prev)
      const cat = next.categories.find((c) => c.id === catId)
      if (!cat) return prev
      cat.items = Array.isArray(cat.items) ? cat.items : []
      cat.items.push({
        id: newId('i'),
        name: 'New item',
        description: '',
        price: 0,
        tags: [],
      })
      return next
    })
    setToast('Added item (demo only)')
  }

  const deleteItem = (catId: string, itemId: string) => {
    setDraft((prev) => {
      if (!prev) return prev
      const next = deepClone(prev)
      const cat = next.categories.find((c) => c.id === catId)
      if (!cat) return prev
      cat.items = (cat.items || []).filter((x) => x.id !== itemId)
      return next
    })
    setToast('Deleted item (demo only)')
  }

  const updateItem = (catId: string, itemId: string, patch: Partial<MenuItem>) => {
    setDraft((prev) => {
      if (!prev) return prev
      const next = deepClone(prev)
      const cat = next.categories.find((c) => c.id === catId)
      if (!cat) return prev
      const it = (cat.items || []).find((x) => x.id === itemId)
      if (!it) return prev
      Object.assign(it, patch)
      return next
    })
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="text-xs font-semibold tracking-widest text-gray-500 uppercase">Demo Admin</div>
            <h1 className="mt-2 text-3xl font-extrabold text-gray-900">Menu Editor (Preview)</h1>
            <p className="mt-2 text-sm text-gray-600">
              This is a public demo editor. You can edit anything, but nothing is saved.
            </p>
          </div>
          <div className="shrink-0 flex flex-wrap gap-2">
            <a
              href="/demo"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-900 hover:bg-gray-50"
            >
              Back to demo
            </a>
            <a
              href="/demo/menu"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-900 hover:bg-gray-50"
            >
              View menu
            </a>
            <a
              href="/demo/kitchen"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-900 hover:bg-gray-50"
            >
              View kitchen
            </a>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-extrabold text-gray-900">Search</div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search items, descriptions, or IDs..."
              className="mt-3 w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-base text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-extrabold text-gray-900">Actions</div>
            <div className="mt-3 grid gap-2">
              <button
                type="button"
                onClick={fakeSave}
                className="w-full rounded-xl bg-black px-4 py-3 text-sm font-extrabold text-white hover:bg-gray-800"
              >
                Save changes (demo)
              </button>
              <button
                type="button"
                onClick={resetDraft}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-extrabold text-gray-900 hover:bg-gray-50"
              >
                Reset demo edits
              </button>
              <button
                type="button"
                onClick={addCategory}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-extrabold text-gray-900 hover:bg-gray-50"
              >
                Add category
              </button>
            </div>

            <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
              Demo editor only — no changes are saved.
            </div>
          </div>
        </div>

        <div className="mt-8">
          {loading && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 text-gray-700 shadow-sm">
              Loading demo menu…
            </div>
          )}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-6">
              {(filtered || []).map((cat) => (
                <section key={cat.id} className="rounded-3xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                      <div className="min-w-0">
                        <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Category</label>
                        <input
                          value={cat.name}
                          onChange={(e) => updateCategory(cat.id, { name: e.target.value })}
                          className="mt-2 w-full md:w-[520px] max-w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-base font-extrabold text-gray-900 outline-none"
                        />
                        <div className="mt-2 text-xs text-gray-600">{cat.items.length} items</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => addItem(cat.id)}
                          className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-bold text-white hover:bg-gray-800"
                        >
                          Add item
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCategory(cat.id)}
                          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-900 hover:bg-gray-50"
                        >
                          Delete category
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {(cat.items || []).map((it) => (
                      <div key={it.id} className="px-5 py-4">
                        <div className="grid gap-3 md:grid-cols-12 md:items-start">
                          <div className="md:col-span-6">
                            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Item name</label>
                            <input
                              value={it.name}
                              onChange={(e) => updateItem(cat.id, it.id, { name: e.target.value })}
                              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-base text-gray-900 outline-none"
                            />
                            <label className="mt-3 block text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Description</label>
                            <textarea
                              value={it.description || ''}
                              onChange={(e) => updateItem(cat.id, it.id, { description: e.target.value })}
                              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none"
                              rows={2}
                            />
                          </div>

                          <div className="md:col-span-3">
                            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Price</label>
                            <input
                              inputMode="decimal"
                              value={typeof it.price === 'number' ? String(it.price) : ''}
                              onChange={(e) => {
                                const n = Number(e.target.value)
                                updateItem(cat.id, it.id, { price: Number.isFinite(n) ? n : 0 })
                              }}
                              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-base text-gray-900 outline-none"
                            />
                            <div className="mt-2 text-xs text-gray-600">Shown: {money(Number(it.price ?? 0))}</div>
                          </div>

                          <div className="md:col-span-3">
                            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Tags</label>
                            <input
                              value={Array.isArray(it.tags) ? it.tags.join(', ') : ''}
                              onChange={(e) => updateItem(cat.id, it.id, { tags: parseTags(e.target.value) })}
                              placeholder="Example: spicy, vegan"
                              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none"
                            />
                            <div className="mt-3 grid gap-2">
                              <button
                                type="button"
                                onClick={() => deleteItem(cat.id, it.id)}
                                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-extrabold text-gray-900 hover:bg-gray-50"
                              >
                                Delete item
                              </button>
                            </div>
                            <div className="mt-2 text-[11px] text-gray-500 font-mono truncate">id: {it.id}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(cat.items || []).length === 0 && (
                      <div className="px-5 py-10 text-center">
                        <div className="text-sm font-extrabold text-gray-900">No items in this category</div>
                        <div className="mt-1 text-xs text-gray-600">Add a sample item to show how editing works.</div>
                        <div className="mt-4 flex justify-center">
                          <button
                            type="button"
                            onClick={() => addItem(cat.id)}
                            className="rounded-xl bg-black px-4 py-2 text-sm font-extrabold text-white hover:bg-gray-800"
                          >
                            Add item
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}
    </main>
  )
}


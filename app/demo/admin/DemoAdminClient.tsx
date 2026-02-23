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
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold tracking-widest text-neutral-400 uppercase">Demo Admin</div>
            <h1 className="mt-2 text-3xl font-extrabold">Menu Editor (Preview)</h1>
            <p className="mt-2 text-sm text-neutral-300">
              This is a public demo editor. You can click around and “edit”, but nothing is persisted.
            </p>
          </div>
          <div className="shrink-0 flex flex-col sm:flex-row gap-2">
            <a
              href="/demo/menu"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-extrabold hover:bg-white/10"
            >
              View menu
            </a>
            <a
              href="/demo/kitchen"
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-extrabold hover:bg-white/10"
            >
              View kitchen
            </a>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-extrabold">Search</div>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search items..."
              className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-base text-white placeholder-white/40 outline-none"
            />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-extrabold">Actions</div>
            <div className="mt-3 grid gap-2">
              <button
                type="button"
                onClick={fakeSave}
                className="w-full rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-black hover:bg-neutral-200"
              >
                Save changes (demo)
              </button>
              <button
                type="button"
                onClick={resetDraft}
                className="w-full rounded-xl border border-white/15 bg-transparent px-4 py-3 text-sm font-extrabold text-white hover:bg-white/10"
              >
                Reset demo edits
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8">
          {loading && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-neutral-200">
              Loading demo menu…
            </div>
          )}
          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-100">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-6">
              {(filtered || []).map((cat) => (
                <section key={cat.id} className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/10 bg-black/20">
                    <div className="text-lg font-extrabold">{cat.name}</div>
                    <div className="text-xs text-neutral-400">{cat.items.length} items</div>
                  </div>

                  <div className="divide-y divide-white/10">
                    {(cat.items || []).map((it) => (
                      <div key={it.id} className="px-5 py-4">
                        <div className="grid gap-3 md:grid-cols-12 md:items-start">
                          <div className="md:col-span-6">
                            <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wide">Item name</label>
                            <input
                              value={it.name}
                              onChange={(e) => updateItem(cat.id, it.id, { name: e.target.value })}
                              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-base text-white outline-none"
                            />
                            <label className="mt-3 block text-[11px] font-semibold text-neutral-400 uppercase tracking-wide">Description</label>
                            <textarea
                              value={it.description || ''}
                              onChange={(e) => updateItem(cat.id, it.id, { description: e.target.value })}
                              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none"
                              rows={2}
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wide">Price</label>
                            <input
                              inputMode="decimal"
                              value={typeof it.price === 'number' ? String(it.price) : ''}
                              onChange={(e) => {
                                const n = Number(e.target.value)
                                updateItem(cat.id, it.id, { price: Number.isFinite(n) ? n : 0 })
                              }}
                              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-base text-white outline-none"
                            />
                            <div className="mt-2 text-xs text-neutral-400">Shown: {money(Number(it.price ?? 0))}</div>
                          </div>
                          <div className="md:col-span-3">
                            <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide">Demo</div>
                            <div className="mt-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-neutral-300">
                              This editor is a POC. No changes are saved.
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl bg-black/80 border border-white/10 px-4 py-2 text-sm">
          {toast}
        </div>
      )}
    </main>
  )
}


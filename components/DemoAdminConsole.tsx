"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminLayout from './AdminLayout'

type MenuItem = {
  id: string
  name: string
  description?: string
  price: number
  tags?: string[]
  available?: boolean
}

type MenuCategory = {
  id: string
  name: string
  items: MenuItem[]
}

type MenuResponse = {
  categories: MenuCategory[]
}

type SaveState = 'idle' | 'saving' | 'success' | 'error'

type PromoteState = 'idle' | 'working' | 'success' | 'error'

interface DemoAdminConsoleProps {
  tenantSlug: string
}

export default function DemoAdminConsole({ tenantSlug }: DemoAdminConsoleProps) {
  const [menu, setMenu] = useState<MenuCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [savingItemId, setSavingItemId] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [saveError, setSaveError] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [promoteState, setPromoteState] = useState<PromoteState>('idle')
  const [promoteDetail, setPromoteDetail] = useState('')
  const [menuLoading, setMenuLoading] = useState(true)
  const [menuError, setMenuError] = useState('')

  const fetchMenu = useCallback(async () => {
    setMenuLoading(true)
    setMenuError('')
    try {
      const response = await fetch(`/api/menu?tenant=${tenantSlug}`, { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('Failed to load menu')
      }
      const data = (await response.json()) as MenuResponse
      setMenu(data.categories || [])
    } catch (error) {
      setMenuError(error instanceof Error ? error.message : 'Unable to load menu')
    } finally {
      setMenuLoading(false)
    }
  }, [tenantSlug])

  useEffect(() => {
    fetchMenu()
  }, [fetchMenu])

  const categories = useMemo(() => menu.map((c) => ({ id: c.id, name: c.name })), [menu])

  const filteredCategories = useMemo(() => {
    if (selectedCategory === 'all') return menu
    return menu.filter((category) => category.id === selectedCategory)
  }, [menu, selectedCategory])

  const handleItemSave = async (itemId: string, updates: Partial<MenuItem>) => {
    setSavingItemId(itemId)
    setSaveState('saving')
    setSaveError('')
    try {
      const response = await fetch('/api/admin/items/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant: tenantSlug,
          itemId,
          ...('name' in updates ? { name: updates.name } : {}),
          ...('description' in updates ? { description: updates.description } : {}),
          ...('price' in updates ? { price: updates.price } : {}),
          ...('tags' in updates ? { tags: updates.tags } : {}),
          ...('available' in updates ? { available: updates.available } : {}),
        }),
      })

      if (!response.ok) {
        const detail = await response.json().catch(() => ({}))
        throw new Error(detail?.error || 'Unable to save item')
      }

      const payload = await response.json().catch(() => null)
      const updatedItem = payload?.item as MenuItem | undefined

      setMenu((prev) =>
        prev.map((category) => ({
          ...category,
          items: category.items.map((item) => {
            if (item.id !== itemId) return item
            return {
              ...item,
              ...updates,
              ...(updatedItem ? { price: updatedItem.price, tags: updatedItem.tags } : {}),
            }
          }),
        }))
      )

      setSaveState('success')
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to save item')
      setSaveState('error')
    } finally {
      setSavingItemId(null)
      setTimeout(() => setSaveState('idle'), 2500)
    }
  }

  const handlePromote = async () => {
    setPromoteState('working')
    setPromoteDetail('')
    try {
      const response = await fetch('/api/admin/demo/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: tenantSlug, to: 'demo', accessCode }),
      })

      if (!response.ok) {
        const detail = await response.json().catch(() => ({}))
        throw new Error(detail?.error || 'Promotion failed')
      }

      setPromoteState('success')
      setPromoteDetail('Draft successfully promoted to live. Refresh the live menu to confirm changes.')
    } catch (error) {
      setPromoteState('error')
      setPromoteDetail(error instanceof Error ? error.message : 'Promotion failed')
    }
  }

  return (
    <AdminLayout>
      <div className="bg-slate-950 text-white min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/50 p-8">
            <h1 className="text-2xl font-semibold">Demo Menu Command Center</h1>
            <p className="mt-3 text-sm text-slate-300 max-w-2xl">
              Review the demo draft menu in real time, polish copy or pricing, and push the approved experience live. All edits here update the draft tenant first; promoting publishes the demo instantly.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                { step: '01', title: 'Claim credentials', description: 'Use the secure setup link to assign email + password for your stakeholders.' },
                { step: '02', title: 'Polish draft', description: 'Update copy, price, availability and dietary tags. Save cards individually as you go.' },
                { step: '03', title: 'Push live', description: 'When ready, enter your access code to mirror draft onto the live demo path.' },
              ].map((card) => (
                <div key={card.step} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                  <span className="text-xs uppercase tracking-[0.4em] text-emerald-400">{card.step}</span>
                  <p className="mt-3 font-semibold text-white">{card.title}</p>
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed">{card.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Draft Menu Items</h2>
                <p className="text-sm text-slate-300">Changes save instantly to the draft tenant. They only reach the live demo after you promote.</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-slate-300" htmlFor="categoryFilter">Category</label>
                <select
                  id="categoryFilter"
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                >
                  <option value="all">All categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {menuLoading ? (
              <div className="py-10 text-center text-sm text-slate-300">Loading draft menu…</div>
            ) : menuError ? (
              <div className="rounded-xl border border-red-400 bg-red-500/10 px-4 py-3 text-sm text-red-200">{menuError}</div>
            ) : filteredCategories.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-300">No menu data available yet.</div>
            ) : (
              <div className="space-y-6">
                {filteredCategories.map((category) => (
                  <div key={category.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{category.name}</h3>
                        <p className="text-xs text-slate-400">Draft tenant: {tenantSlug}</p>
                      </div>
                    </div>

                    <div className="mt-5 space-y-5">
                      {category.items.map((item) => (
                        <article key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 shadow-inner">
                          <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                              <h4 className="text-base font-semibold text-white">{item.name}</h4>
                              <p className="text-xs text-slate-400">Item ID: {item.id}</p>
                            </div>
                            {savingItemId === item.id && saveState === 'saving' ? (
                              <span className="text-xs text-emerald-300">Saving…</span>
                            ) : null}
                          </header>

                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <label className="text-xs uppercase tracking-[0.3em] text-slate-400" htmlFor={`name-${item.id}`}>
                                Name
                              </label>
                              <input
                                id={`name-${item.id}`}
                                defaultValue={item.name}
                                onBlur={(event) => {
                                  const value = event.target.value.trim()
                                  if (value && value !== item.name) {
                                    handleItemSave(item.id, { name: value })
                                  }
                                }}
                                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs uppercase tracking-[0.3em] text-slate-400" htmlFor={`price-${item.id}`}>
                                Price ($)
                              </label>
                              <input
                                id={`price-${item.id}`}
                                type="number"
                                step="0.01"
                                defaultValue={item.price.toFixed(2)}
                                onBlur={(event) => {
                                  const value = Number(event.target.value)
                                  if (!Number.isNaN(value) && value !== item.price) {
                                    handleItemSave(item.id, { price: value })
                                  }
                                }}
                                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="mt-4 space-y-2">
                            <label className="text-xs uppercase tracking-[0.3em] text-slate-400" htmlFor={`description-${item.id}`}>
                              Description
                            </label>
                            <textarea
                              id={`description-${item.id}`}
                              rows={3}
                              defaultValue={item.description || ''}
                              onBlur={(event) => {
                                const value = event.target.value
                                if (value !== item.description) {
                                  handleItemSave(item.id, { description: value })
                                }
                              }}
                              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                            />
                          </div>

                          <div className="mt-4 space-y-2">
                            <label className="text-xs uppercase tracking-[0.3em] text-slate-400" htmlFor={`tags-${item.id}`}>
                              Dietary tags
                            </label>
                            <input
                              id={`tags-${item.id}`}
                              defaultValue={(item.tags || []).join(', ')}
                              onBlur={(event) => {
                                const raw = event.target.value
                                const tags = raw.split(',').map((tag) => tag.trim()).filter(Boolean)
                                const current = (item.tags || []).join(', ')
                                if (tags.join(', ') !== current) {
                                  handleItemSave(item.id, { tags })
                                }
                              }}
                              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                              placeholder="vegetarian, gluten-free, dairy-free"
                            />
                            <p className="text-xs text-slate-400">Press enter or click away to save changes to tags.</p>
                          </div>

                          {saveState === 'error' && savingItemId === null && saveError && (
                            <div className="mt-3 rounded-lg border border-red-400 bg-red-500/10 px-4 py-2 text-xs text-red-200">{saveError}</div>
                          )}

                          {saveState === 'success' && (
                            <div className="mt-3 rounded-lg border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-200">
                              Changes saved to draft.
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Promote Draft to Live</h2>
              <p className="text-sm text-slate-300">
                Enter the secure deployment code to mirror your approved draft onto the live demo path. This runs the same promote workflow agents use during onboarding.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-400" htmlFor="promoteCode">Deployment code</label>
                <input
                  id="promoteCode"
                  type="password"
                  value={accessCode}
                  onChange={(event) => setAccessCode(event.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm focus:border-emerald-400 focus:outline-none"
                  placeholder="Provided by TCC"
                />
              </div>
              <button
                type="button"
                onClick={handlePromote}
                disabled={!accessCode || promoteState === 'working'}
                className="self-end rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {promoteState === 'working' ? 'Promoting…' : 'Push draft to live'}
              </button>
            </div>

            {promoteDetail && (
              <div
                className={`rounded-lg border px-4 py-3 text-sm ${
                  promoteState === 'success'
                    ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
                    : promoteState === 'error'
                    ? 'border-red-400 bg-red-500/10 text-red-200'
                    : 'border-slate-700 bg-slate-900 text-slate-200'
                }`}
              >
                {promoteDetail}
              </div>
            )}

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-5 py-4 text-xs text-slate-300">
              <p className="font-semibold text-slate-100">Need a reset?</p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Use the refresh icon in the browser after saving to re-sync latest draft data.</li>
                <li>To revert live back to the default demo, promote from <code>demo</code> to <code>demo</code> with the original JSON package.</li>
                <li>Admins can update their credentials anytime from the <a className="text-emerald-300 underline" href="/demo-admin/setup">demo admin setup portal</a>.</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  )
}



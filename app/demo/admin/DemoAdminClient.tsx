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

type DemoOrder = {
  id: string
  code: string
  status: 'NEW' | 'PREPARING' | 'READY' | 'COMPLETED'
  type: 'dine-in' | 'pickup'
  table?: string
  items: { name: string; qty: number; price: number }[]
  total: number
  createdAt: string
}

const DEMO_ORDERS: DemoOrder[] = [
  {
    id: 'ord-001',
    code: '4821',
    status: 'COMPLETED',
    type: 'dine-in',
    table: '12',
    items: [
      { name: 'Fettuccine Bolognese', qty: 2, price: 23 },
      { name: 'Margherita Pizza 14"', qty: 1, price: 25 },
      { name: 'Tiramisu', qty: 2, price: 9 },
    ],
    total: 89,
    createdAt: '2025-03-02T18:45:00Z',
  },
  {
    id: 'ord-002',
    code: '4822',
    status: 'READY',
    type: 'pickup',
    items: [
      { name: 'Chicken Fettuccine Alfredo', qty: 1, price: 22 },
      { name: 'Caesar Salad', qty: 1, price: 14 },
    ],
    total: 36,
    createdAt: '2025-03-02T19:12:00Z',
  },
  {
    id: 'ord-003',
    code: '4823',
    status: 'PREPARING',
    type: 'dine-in',
    table: '7',
    items: [
      { name: 'Carnivoro Pizza 14"', qty: 1, price: 27 },
      { name: 'Linguine and Clams', qty: 1, price: 23 },
      { name: 'Italian Soda', qty: 2, price: 4 },
    ],
    total: 58,
    createdAt: '2025-03-02T19:28:00Z',
  },
  {
    id: 'ord-004',
    code: '4824',
    status: 'NEW',
    type: 'pickup',
    items: [
      { name: 'Spaghetti and Meatballs', qty: 2, price: 20 },
      { name: 'Garlic Bread', qty: 1, price: 8 },
    ],
    total: 48,
    createdAt: '2025-03-02T19:35:00Z',
  },
  {
    id: 'ord-005',
    code: '4825',
    status: 'NEW',
    type: 'dine-in',
    table: '3',
    items: [
      { name: 'Prosciutto & Arugula 10"', qty: 1, price: 22 },
      { name: 'Cappuccino', qty: 2, price: 5 },
    ],
    total: 32,
    createdAt: '2025-03-02T19:42:00Z',
  },
]

const DEMO_ANALYTICS = {
  todayOrders: 47,
  todayRevenue: 2847,
  avgOrderValue: 60.57,
  topItems: [
    { name: 'Fettuccine Bolognese', orders: 18 },
    { name: 'Margherita Pizza 14"', orders: 14 },
    { name: 'Spaghetti and Meatballs', orders: 12 },
    { name: 'Tiramisu', orders: 11 },
    { name: 'Chicken Fettuccine Alfredo', orders: 9 },
  ],
  ordersByHour: [
    { hour: '11am', orders: 3 },
    { hour: '12pm', orders: 8 },
    { hour: '1pm', orders: 6 },
    { hour: '5pm', orders: 4 },
    { hour: '6pm', orders: 11 },
    { hour: '7pm', orders: 9 },
    { hour: '8pm', orders: 6 },
  ],
}

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then((r) => r.json())

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(2, 6)}`
}

type Tab = 'menu' | 'orders' | 'analytics'

export default function DemoAdminClient() {
  const tenant = 'demo'
  const [tab, setTab] = useState<Tab>('menu')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<MenuResponse | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [orders, setOrders] = useState<DemoOrder[]>(DEMO_ORDERS)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const json = await fetcher(`/api/menu?tenant=${encodeURIComponent(tenant)}`)
        if (!cancelled) {
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

  const fakeSave = () => setToast('Demo only — changes are not saved')

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
      cat.items.push({ id: newId('i'), name: 'New item', description: '', price: 0, tags: [] })
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

  const updateOrderStatus = (orderId: string, status: DemoOrder['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    setToast(`Order status updated (demo only)`)
  }

  const statusColor = (status: DemoOrder['status']) => {
    switch (status) {
      case 'NEW': return 'bg-blue-100 text-blue-800'
      case 'PREPARING': return 'bg-amber-100 text-amber-800'
      case 'READY': return 'bg-green-100 text-green-800'
      case 'COMPLETED': return 'bg-neutral-100 text-neutral-600'
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-semibold tracking-widest text-neutral-500 uppercase">Demo Admin</div>
            <h1 className="mt-2 text-3xl font-bold text-neutral-900">Restaurant Dashboard</h1>
            <p className="mt-2 text-sm text-neutral-600">
              This is a demo dashboard. All data is sample data for demonstration purposes.
            </p>
          </div>
          <div className="shrink-0 flex flex-wrap gap-2">
            <a href="/demo" className="inline-flex items-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-50">
              ← Back to demo
            </a>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-neutral-200 rounded-xl mb-8 max-w-md">
          {(['menu', 'orders', 'analytics'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === t ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {t === 'menu' ? '📋 Menu' : t === 'orders' ? '📦 Orders' : '📊 Analytics'}
            </button>
          ))}
        </div>

        {/* Menu Tab */}
        {tab === 'menu' && (
          <>
            <div className="grid gap-3 md:grid-cols-3 mb-8">
              <div className="md:col-span-2 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="text-sm font-semibold text-neutral-900">Search</div>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search items..."
                  className="mt-3 w-full rounded-xl border border-neutral-300 bg-white px-3 py-3 text-base outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="text-sm font-semibold text-neutral-900">Actions</div>
                <div className="mt-3 grid gap-2">
                  <button onClick={fakeSave} className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700">
                    Save changes (demo)
                  </button>
                  <button onClick={addCategory} className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold hover:bg-neutral-50">
                    Add category
                  </button>
                </div>
              </div>
            </div>

            {loading && <div className="rounded-2xl border border-neutral-200 bg-white p-6">Loading...</div>}
            {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900">{error}</div>}

            {!loading && !error && (
              <div className="space-y-6">
                {filtered.map((cat) => (
                  <section key={cat.id} className="rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
                      <input
                        value={cat.name}
                        onChange={(e) => updateCategory(cat.id, { name: e.target.value })}
                        className="text-lg font-semibold bg-transparent border-none outline-none"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => addItem(cat.id)} className="text-sm text-emerald-600 font-semibold hover:underline">+ Add item</button>
                        <button onClick={() => deleteCategory(cat.id)} className="text-sm text-red-600 font-semibold hover:underline">Delete</button>
                      </div>
                    </div>
                    <div className="divide-y divide-neutral-100">
                      {cat.items.map((it) => (
                        <div key={it.id} className="px-5 py-4 flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <input value={it.name} onChange={(e) => updateItem(cat.id, it.id, { name: e.target.value })} className="font-semibold bg-transparent border-none outline-none w-full" />
                            <input value={it.description || ''} onChange={(e) => updateItem(cat.id, it.id, { description: e.target.value })} className="text-sm text-neutral-600 bg-transparent border-none outline-none w-full mt-1" placeholder="Description..." />
                          </div>
                          <div className="text-right">
                            <input value={it.price || ''} onChange={(e) => updateItem(cat.id, it.id, { price: parseFloat(e.target.value) || 0 })} className="w-20 text-right font-semibold bg-transparent border-none outline-none" />
                            <button onClick={() => deleteItem(cat.id, it.id)} className="block text-xs text-red-600 mt-1">Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </>
        )}

        {/* Orders Tab */}
        {tab === 'orders' && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{orders.filter(o => o.status === 'NEW').length}</div>
                <div className="text-sm text-neutral-600">New Orders</div>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="text-2xl font-bold text-amber-600">{orders.filter(o => o.status === 'PREPARING').length}</div>
                <div className="text-sm text-neutral-600">Preparing</div>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="text-2xl font-bold text-green-600">{orders.filter(o => o.status === 'READY').length}</div>
                <div className="text-sm text-neutral-600">Ready</div>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="text-2xl font-bold text-neutral-600">{orders.filter(o => o.status === 'COMPLETED').length}</div>
                <div className="text-sm text-neutral-600">Completed Today</div>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-200 bg-neutral-50">
                <h2 className="text-lg font-semibold">Recent Orders</h2>
              </div>
              <div className="divide-y divide-neutral-100">
                {orders.map((order) => (
                  <div key={order.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold">#{order.code}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColor(order.status)}`}>
                            {order.status}
                          </span>
                          <span className="text-sm text-neutral-500">
                            {order.type === 'dine-in' ? `Table ${order.table}` : 'Pickup'}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-neutral-600">
                          {order.items.map((item, i) => (
                            <span key={i}>{item.qty}× {item.name}{i < order.items.length - 1 ? ', ' : ''}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">${order.total.toFixed(2)}</div>
                        <div className="mt-2 flex gap-2">
                          {order.status === 'NEW' && (
                            <button onClick={() => updateOrderStatus(order.id, 'PREPARING')} className="text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-semibold hover:bg-amber-200">
                              Start Preparing
                            </button>
                          )}
                          {order.status === 'PREPARING' && (
                            <button onClick={() => updateOrderStatus(order.id, 'READY')} className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-semibold hover:bg-green-200">
                              Mark Ready
                            </button>
                          )}
                          {order.status === 'READY' && (
                            <button onClick={() => updateOrderStatus(order.id, 'COMPLETED')} className="text-xs bg-neutral-100 text-neutral-800 px-3 py-1 rounded-full font-semibold hover:bg-neutral-200">
                              Complete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {tab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="text-3xl font-bold text-emerald-600">{DEMO_ANALYTICS.todayOrders}</div>
                <div className="text-sm text-neutral-600 mt-1">Orders Today</div>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="text-3xl font-bold text-emerald-600">${DEMO_ANALYTICS.todayRevenue.toLocaleString()}</div>
                <div className="text-sm text-neutral-600 mt-1">Revenue Today</div>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="text-3xl font-bold text-emerald-600">${DEMO_ANALYTICS.avgOrderValue.toFixed(2)}</div>
                <div className="text-sm text-neutral-600 mt-1">Avg Order Value</div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Top Selling Items</h3>
                <div className="space-y-3">
                  {DEMO_ANALYTICS.topItems.map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <span className="text-sm text-neutral-600">{item.orders} orders</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Orders by Hour</h3>
                <div className="space-y-2">
                  {DEMO_ANALYTICS.ordersByHour.map((h) => (
                    <div key={h.hour} className="flex items-center gap-3">
                      <span className="w-12 text-sm text-neutral-600">{h.hour}</span>
                      <div className="flex-1 h-6 bg-neutral-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${(h.orders / 12) * 100}%` }}
                        />
                      </div>
                      <span className="w-8 text-sm font-medium text-right">{h.orders}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              📊 This is sample analytics data for demonstration. Your actual dashboard will show real-time data from your restaurant.
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      )}
    </main>
  )
}

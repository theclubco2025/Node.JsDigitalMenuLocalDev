"use client"

import { useEffect, useMemo, useState } from 'react'

type MenuItem = { id: string; name: string; price?: number; description?: string }
type MenuCategory = { id: string; name: string; items: MenuItem[] }
type MenuResponse = { categories: MenuCategory[] }

type DemoLine = { id: string; name: string; qty: number; note?: string }
type DemoOrder = {
  id: string
  status: 'NEW' | 'PREPARING' | 'READY' | 'COMPLETED'
  createdAt: number
  pickupCode: string
  items: DemoLine[]
}

function pad4(n: number) {
  return String(Math.floor(Math.abs(n)) % 10000).padStart(4, '0')
}

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(2, 6)}`
}

function formatElapsed(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then((r) => r.json())

export default function DemoKitchenClient() {
  const [menu, setMenu] = useState<MenuResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(() => Date.now())
  const [orders, setOrders] = useState<DemoOrder[]>([])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const json = await fetcher('/api/menu?tenant=demo')
        if (!cancelled) setMenu(json as MenuResponse)
      } catch {
        if (!cancelled) setMenu(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  const itemPool = useMemo(() => {
    const cats = menu?.categories ?? []
    const items: MenuItem[] = []
    for (const c of cats) for (const it of c.items || []) items.push(it)
    return items
  }, [menu])

  const seedOrders = useMemo(() => {
    const pick = (i: number) => itemPool[i % Math.max(1, itemPool.length)]
    const mk = (seed: number, status: DemoOrder['status'], minsAgo: number, lines: Array<{ idx: number; qty: number; note?: string }>): DemoOrder => ({
      id: `demo-${seed}`,
      status,
      createdAt: Date.now() - minsAgo * 60_000,
      pickupCode: pad4(1000 + seed * 73),
      items: lines.map((l, j) => ({
        id: `${seed}:${j}`,
        name: pick(seed + l.idx)?.name || `Item ${l.idx}`,
        qty: l.qty,
        ...(l.note ? { note: l.note } : {}),
      })),
    })

    return [
      mk(1, 'NEW', 3, [
        { idx: 2, qty: 1 },
        { idx: 7, qty: 2, note: 'No spice' },
      ]),
      mk(2, 'NEW', 7, [
        { idx: 4, qty: 1, note: 'Allergy: dairy' },
      ]),
      mk(3, 'PREPARING', 9, [
        { idx: 1, qty: 1 },
        { idx: 5, qty: 1 },
      ]),
      mk(4, 'READY', 12, [
        { idx: 3, qty: 2 },
      ]),
    ]
  }, [itemPool])

  useEffect(() => {
    if (orders.length > 0) return
    setOrders(seedOrders)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedOrders])

  const orderNumberById = useMemo(() => {
    const sorted = [...orders].sort((a, b) => a.createdAt - b.createdAt)
    const m = new Map<string, number>()
    sorted.forEach((o, i) => m.set(o.id, i + 1))
    return m
  }, [orders])

  const columns = useMemo(() => {
    const out = { NEW: [] as DemoOrder[], PREPARING: [] as DemoOrder[], READY: [] as DemoOrder[], COMPLETED: [] as DemoOrder[] }
    for (const o of orders) out[o.status].push(o)
    for (const k of Object.keys(out) as Array<keyof typeof out>) out[k].sort((a, b) => a.createdAt - b.createdAt)
    return out
  }, [orders])

  const moveStatus = (orderId: string, status: DemoOrder['status']) => {
    setOrders((prev) => prev.map(o => o.id === orderId ? { ...o, status } : o))
  }

  const addSampleOrder = () => {
    const safePool = itemPool.length ? itemPool : [{ id: 'x', name: 'Sample item' }]
    const pick = (i: number) => safePool[i % safePool.length]
    const base = Date.now()
    const seed = Math.floor(Math.random() * 9999)
    const next: DemoOrder = {
      id: newId('demo'),
      status: 'NEW',
      createdAt: base,
      pickupCode: pad4(1000 + seed),
      items: [
        { id: newId('l'), name: pick(seed + 1).name, qty: 1 },
        { id: newId('l'), name: pick(seed + 4).name, qty: 2, note: seed % 3 === 0 ? 'Extra sauce' : undefined },
      ].filter(Boolean) as DemoLine[],
    }
    setOrders((prev) => [next, ...prev])
  }

  const resetTickets = () => setOrders(seedOrders)

  return (
    <main className="min-h-screen text-white" style={{ background: '#070707' }}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="sticky top-0 z-40 rounded-2xl border border-white/10 bg-black/40 backdrop-blur px-4 py-3" style={{ boxShadow: '0 12px 28px rgba(0,0,0,0.22)' }}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-lg font-extrabold truncate">Kitchen Display (Demo)</div>
              <div className="text-xs text-neutral-300">This board is a POC with sample tickets (always visible).</div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={addSampleOrder}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-extrabold hover:bg-white/10"
              >
                Add sample order
              </button>
              <button
                type="button"
                onClick={resetTickets}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-extrabold hover:bg-white/10"
              >
                Reset tickets
              </button>
              <a
                href="/demo"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-extrabold hover:bg-white/10"
              >
                Back to demo
              </a>
              <a
                href="/demo/admin"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-extrabold hover:bg-white/10"
              >
                View admin
              </a>
            </div>
          </div>
        </div>

        {loading && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-neutral-200">
            Loading sample menu items…
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {([
            { key: 'NEW' as const, title: 'New Orders', hint: 'Start preparing.' },
            { key: 'PREPARING' as const, title: 'Preparing', hint: 'Mark ready when finished.' },
            { key: 'READY' as const, title: 'Ready', hint: 'Hand off at pickup.' },
          ]).map((col) => {
            const orders = columns[col.key]
            const border =
              col.key === 'NEW' ? 'border-sky-400/60'
                : col.key === 'PREPARING' ? 'border-amber-400/60'
                  : 'border-emerald-400/60'
            return (
              <section key={col.key} className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10 bg-black/20">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-extrabold">{col.title}</div>
                    <div className="text-xs text-neutral-300">{orders.length}</div>
                  </div>
                  <div className="mt-1 text-xs text-neutral-400">{col.hint}</div>
                </div>
                <div className="p-3 space-y-3">
                  {orders.map((o) => (
                    <div key={o.id} className={`rounded-2xl border border-white/10 bg-black/30 ${border} border-l-4 overflow-hidden`}>
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-base font-extrabold">#{orderNumberById.get(o.id) || 0}</div>
                            <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-neutral-300">
                              <span className="rounded-full bg-white/10 px-2 py-1">Code {o.pickupCode}</span>
                              <span className="rounded-full bg-white/10 px-2 py-1">{formatElapsed(now - o.createdAt)} elapsed</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 rounded-xl border border-white/10 bg-black/20">
                          {o.items.map((it) => (
                            <div key={it.id} className="px-3 py-2 border-b border-white/5 last:border-b-0">
                              <div className="text-[12px] font-semibold">
                                <span className="mr-2 rounded-lg bg-white/10 px-2 py-0.5 text-[10px] font-extrabold">x{it.qty}</span>
                                {it.name}
                              </div>
                              {it.note && (
                                <div className="mt-1 text-[11px] text-amber-200 whitespace-pre-wrap">{it.note}</div>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {col.key === 'NEW' && (
                            <button
                              type="button"
                              onClick={() => moveStatus(o.id, 'PREPARING')}
                              className="col-span-2 rounded-2xl px-3 py-2 text-xs font-extrabold border border-sky-300/40 bg-sky-500/20 hover:bg-sky-500/30"
                            >
                              Start Preparing
                            </button>
                          )}
                          {col.key === 'PREPARING' && (
                            <button
                              type="button"
                              onClick={() => moveStatus(o.id, 'READY')}
                              className="col-span-2 rounded-2xl px-3 py-2 text-xs font-extrabold border border-amber-300/40 bg-amber-500/20 hover:bg-amber-500/30"
                            >
                              Mark Ready
                            </button>
                          )}
                          {col.key === 'READY' && (
                            <button
                              type="button"
                              onClick={() => moveStatus(o.id, 'COMPLETED')}
                              className="col-span-2 rounded-2xl px-3 py-2 text-xs font-extrabold border border-emerald-300/40 bg-emerald-500/20 hover:bg-emerald-500/30"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {!orders.length && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                      <div className="text-sm font-extrabold">No tickets in this column</div>
                      <div className="mt-1 text-xs text-neutral-300">This is just a demo board.</div>
                    </div>
                  )}
                </div>
              </section>
            )
          })}
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 bg-black/20">
            <div className="flex items-center justify-between">
              <div className="text-sm font-extrabold">Completed</div>
              <div className="text-xs text-neutral-300">{columns.COMPLETED.length}</div>
            </div>
            <div className="mt-1 text-xs text-neutral-400">Demo-only: completed tickets stay visible here.</div>
          </div>
          <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {columns.COMPLETED.map((o) => (
              <div key={o.id} className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
                <div className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-base font-extrabold">#{orderNumberById.get(o.id) || 0}</div>
                      <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-neutral-300">
                        <span className="rounded-full bg-white/10 px-2 py-1">Code {o.pickupCode}</span>
                        <span className="rounded-full bg-white/10 px-2 py-1">{formatElapsed(now - o.createdAt)} total</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-neutral-300">
                    {o.items.slice(0, 2).map((it) => (
                      <div key={it.id} className="truncate">
                        <span className="mr-2 font-extrabold">x{it.qty}</span>
                        {it.name}
                      </div>
                    ))}
                    {o.items.length > 2 && (
                      <div className="text-neutral-400">+{o.items.length - 2} more</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {columns.COMPLETED.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center md:col-span-2 lg:col-span-3">
                <div className="text-sm font-extrabold">No completed tickets yet</div>
                <div className="mt-1 text-xs text-neutral-300">Complete a ticket to see it here.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}


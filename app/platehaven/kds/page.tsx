"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type DemoLine = { id: string; name: string; qty: number; note?: string }
type DemoOrder = {
  id: string
  status: 'NEW' | 'PREPARING' | 'READY' | 'COMPLETED'
  createdAt: number
  pickupCode: string
  customerName?: string
  eventDate?: string
  guestCount?: number
  eventType?: string
  deliveryAddress?: string
  items: DemoLine[]
  isCatering?: boolean
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

const CATERING_ITEMS = [
  'BBQ Pulled Pork Platter (Serves 20)',
  'Smoked Brisket Tray (Serves 15)',
  'Grilled Chicken Wings (50 pc)',
  'Mac & Cheese Family Style',
  'Coleslaw (Gallon)',
  'Cornbread Basket (24 pc)',
  'Garden Salad Tray',
  'Loaded Potato Salad',
  'Baked Beans (Gallon)',
  'Sweet Tea (3 Gallons)',
]

const FOOD_TRUCK_ITEMS = [
  'Classic Burger',
  'BBQ Bacon Burger',
  'Loaded Fries',
  'Chicken Tenders',
  'Pulled Pork Sandwich',
  'Hot Dog',
  'Nachos Supreme',
  'Onion Rings',
]

export default function PlateHavenKDSPage() {
  const [now, setNow] = useState(() => Date.now())
  const [orders, setOrders] = useState<DemoOrder[]>([])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const seedOrders = useMemo(() => {
    const pickCatering = (i: number) => CATERING_ITEMS[i % CATERING_ITEMS.length]
    const pickTruck = (i: number) => FOOD_TRUCK_ITEMS[i % FOOD_TRUCK_ITEMS.length]
    
    const mk = (
      seed: number,
      status: DemoOrder['status'],
      minsAgo: number,
      lines: Array<{ idx: number; qty: number; note?: string }>,
      opts: { isCatering?: boolean; customerName?: string; eventDate?: string; guestCount?: number; eventType?: string; deliveryAddress?: string }
    ): DemoOrder => ({
      id: `demo-${seed}`,
      status,
      createdAt: Date.now() - minsAgo * 60_000,
      pickupCode: pad4(1000 + seed * 73),
      customerName: opts.customerName,
      eventDate: opts.eventDate,
      guestCount: opts.guestCount,
      eventType: opts.eventType,
      deliveryAddress: opts.deliveryAddress,
      isCatering: opts.isCatering,
      items: lines.map((l, j) => ({
        id: `${seed}:${j}`,
        name: opts.isCatering ? pickCatering(seed + l.idx) : pickTruck(seed + l.idx),
        qty: l.qty,
        ...(l.note ? { note: l.note } : {}),
      })),
    })

    return [
      mk(1, 'NEW', 5, [
        { idx: 0, qty: 2 },
        { idx: 1, qty: 1 },
        { idx: 4, qty: 2, note: 'Extra napkins' },
      ], {
        isCatering: true,
        customerName: 'Sarah Johnson',
        eventDate: 'March 28, 2026',
        guestCount: 75,
        eventType: 'Corporate Lunch',
        deliveryAddress: '123 Business Park Dr, Suite 400',
      }),
      mk(2, 'NEW', 8, [
        { idx: 2, qty: 3 },
        { idx: 5, qty: 2, note: 'Gluten-free buns needed' },
      ], {
        isCatering: true,
        customerName: 'Mike Chen',
        eventDate: 'March 29, 2026',
        guestCount: 50,
        eventType: 'Birthday Party',
        deliveryAddress: '456 Oak Lane',
      }),
      mk(3, 'PREPARING', 15, [
        { idx: 0, qty: 1 },
        { idx: 3, qty: 1 },
      ], {
        isCatering: false,
        customerName: 'Tom',
      }),
      mk(4, 'PREPARING', 12, [
        { idx: 1, qty: 2 },
        { idx: 6, qty: 1 },
        { idx: 7, qty: 1, note: 'Extra crispy' },
      ], {
        isCatering: false,
        customerName: 'Jessica',
      }),
      mk(5, 'READY', 20, [
        { idx: 3, qty: 1 },
        { idx: 8, qty: 2 },
        { idx: 9, qty: 4 },
      ], {
        isCatering: true,
        customerName: 'Green Valley HOA',
        eventDate: 'March 27, 2026',
        guestCount: 120,
        eventType: 'Community Event',
        deliveryAddress: '789 Community Center Blvd',
      }),
      mk(6, 'READY', 18, [
        { idx: 4, qty: 1 },
        { idx: 5, qty: 2 },
      ], {
        isCatering: false,
        customerName: 'Alex',
      }),
    ]
  }, [])

  useEffect(() => {
    setOrders(seedOrders)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  const addSampleOrder = (isCatering: boolean) => {
    const items = isCatering ? CATERING_ITEMS : FOOD_TRUCK_ITEMS
    const pick = (i: number) => items[i % items.length]
    const base = Date.now()
    const seed = Math.floor(Math.random() * 9999)
    const next: DemoOrder = {
      id: newId('demo'),
      status: 'NEW',
      createdAt: base,
      pickupCode: pad4(1000 + seed),
      customerName: isCatering ? 'New Catering Client' : ['John', 'Emma', 'Chris', 'Lisa'][seed % 4],
      isCatering,
      eventDate: isCatering ? 'April 1, 2026' : undefined,
      guestCount: isCatering ? 30 + (seed % 70) : undefined,
      eventType: isCatering ? ['Wedding', 'Corporate', 'Birthday', 'Graduation'][seed % 4] : undefined,
      deliveryAddress: isCatering ? '123 Sample Address' : undefined,
      items: [
        { id: newId('l'), name: pick(seed + 1), qty: isCatering ? 2 : 1 },
        { id: newId('l'), name: pick(seed + 4), qty: isCatering ? 1 : 2, note: seed % 3 === 0 ? 'Special request' : undefined },
      ].filter(Boolean) as DemoLine[],
    }
    setOrders((prev) => [next, ...prev])
  }

  const resetTickets = () => setOrders(seedOrders)

  return (
    <main className="min-h-screen text-white" style={{ background: '#070707' }}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <div className="sticky top-0 z-40 rounded-2xl border border-white/10 bg-black/40 backdrop-blur px-4 py-3" style={{ boxShadow: '0 12px 28px rgba(0,0,0,0.22)' }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/platehaven-logo.png" alt="PlateHaven" className="h-9 w-auto" />
              <div className="min-w-0">
                <div className="text-lg font-extrabold truncate">Kitchen Display</div>
                <div className="text-xs text-neutral-300">Demo — Catering &amp; Food Truck Orders</div>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <button
                type="button"
                onClick={() => addSampleOrder(true)}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-[#C4A76A]/30 bg-[#C4A76A]/10 px-3 text-xs font-extrabold text-[#C4A76A] hover:bg-[#C4A76A]/20"
              >
                + Catering Order
              </button>
              <button
                type="button"
                onClick={() => addSampleOrder(false)}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-extrabold hover:bg-white/10"
              >
                + Pickup Order
              </button>
              <button
                type="button"
                onClick={resetTickets}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-extrabold hover:bg-white/10"
              >
                Reset
              </button>
              <Link
                href="/demo"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-extrabold hover:bg-white/10"
              >
                Back to Demo
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {([
            { key: 'NEW' as const, title: 'New Orders', hint: 'Start preparing.' },
            { key: 'PREPARING' as const, title: 'Preparing', hint: 'Mark ready when finished.' },
            { key: 'READY' as const, title: 'Ready', hint: 'Hand off to customer.' },
          ]).map((col) => {
            const colOrders = columns[col.key]
            const border =
              col.key === 'NEW' ? 'border-sky-400/60'
                : col.key === 'PREPARING' ? 'border-amber-400/60'
                  : 'border-emerald-400/60'
            return (
              <section key={col.key} className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10 bg-black/20">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-extrabold">{col.title}</div>
                    <div className="text-xs text-neutral-300">{colOrders.length}</div>
                  </div>
                  <div className="mt-1 text-xs text-neutral-400">{col.hint}</div>
                </div>
                <div className="p-3 space-y-3">
                  {colOrders.map((o) => (
                    <div key={o.id} className={`rounded-2xl border border-white/10 bg-black/30 ${border} border-l-4 overflow-hidden`}>
                      <div className="p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="text-base font-extrabold">#{orderNumberById.get(o.id) || 0}</div>
                              {o.isCatering && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C4A76A]/20 text-[#C4A76A] font-bold">CATERING</span>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-neutral-300">
                              <span className="rounded-full bg-white/10 px-2 py-1">
                                {o.customerName || `Code ${o.pickupCode}`}
                              </span>
                              <span className="rounded-full bg-white/10 px-2 py-1">{formatElapsed(now - o.createdAt)} elapsed</span>
                            </div>
                            {o.isCatering && (
                              <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-neutral-400">
                                {o.eventDate && <span className="rounded bg-white/5 px-2 py-0.5">📅 {o.eventDate}</span>}
                                {o.guestCount && <span className="rounded bg-white/5 px-2 py-0.5">👥 {o.guestCount} guests</span>}
                                {o.eventType && <span className="rounded bg-white/5 px-2 py-0.5">{o.eventType}</span>}
                              </div>
                            )}
                            {o.deliveryAddress && (
                              <div className="mt-1 text-[10px] text-neutral-400">
                                📍 {o.deliveryAddress}
                              </div>
                            )}
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
                  {!colOrders.length && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                      <div className="text-sm font-extrabold">No tickets</div>
                      <div className="mt-1 text-xs text-neutral-300">Orders will appear here.</div>
                    </div>
                  )}
                </div>
              </section>
            )
          })}
        </div>

        {/* Completed Section */}
        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 bg-black/20">
            <div className="flex items-center justify-between">
              <div className="text-sm font-extrabold">Completed</div>
              <div className="text-xs text-neutral-300">{columns.COMPLETED.length}</div>
            </div>
            <div className="mt-1 text-xs text-neutral-400">Completed tickets stay visible here.</div>
          </div>
          <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {columns.COMPLETED.map((o) => (
              <div key={o.id} className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
                <div className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-base font-extrabold">#{orderNumberById.get(o.id) || 0}</div>
                        {o.isCatering && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C4A76A]/20 text-[#C4A76A] font-bold">CATERING</span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-neutral-300">
                        <span className="rounded-full bg-white/10 px-2 py-1">{o.customerName || `Code ${o.pickupCode}`}</span>
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

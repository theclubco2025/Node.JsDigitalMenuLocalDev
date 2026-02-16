"use client"

import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

type TenantBrand = { name?: string; header?: { logoUrl?: string }; logoUrl?: string }
type TenantTheme = { bg?: string; text?: string; ink?: string; card?: string; muted?: string; accent?: string; primary?: string }
type TenantConfig = { brand?: TenantBrand; theme?: TenantTheme }

type AddOn = { name: string; priceDeltaCents: number }
type OrderItem = { id: string; name: string; quantity: number; unitPriceCents: number; note?: string | null; addOns?: AddOn[] | null }
type KitchenOrder = {
  id: string
  status: string
  totalCents: number
  scheduledFor: string | null
  timezone: string
  paidAt: string | null
  createdAt: string
  pickupCode: string
  tableNumber?: string | null
  note?: string | null
  items: OrderItem[]
}

type KitchenResponse = {
  ok: boolean
  error?: string
  tenant?: { slug: string; name: string }
  view?: string
  orders?: KitchenOrder[]
}

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

function formatElapsed(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  if (m >= 60) {
    const h = Math.floor(m / 60)
    const mm = m % 60
    return `${h}:${String(mm).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatTime(iso: string | null, tz: string) {
  if (!iso) return 'ASAP'
  try {
    return new Date(iso).toLocaleString(undefined, { timeZone: tz })
  } catch {
    return iso
  }
}

function resolveKitchenTenant(raw: string) {
  const t = (raw || '').trim().toLowerCase()
  if (t === 'independent-kitchen-draft') return 'independent-draft'
  return t || 'independent-draft'
}

export default function KitchenPage() {
  const isBrowser = typeof window !== 'undefined'
  const searchParams = isBrowser ? new URLSearchParams(window.location.search) : null
  const rawTenant = isBrowser ? (searchParams!.get('tenant') || 'independent-draft') : 'independent-draft'
  const tenant = resolveKitchenTenant(rawTenant)

  const [pin, setPin] = useState('')
  const [pinReady, setPinReady] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [view, setView] = useState<'active' | 'history'>('active')

  useEffect(() => {
    if (!isBrowser) return
    try {
      const saved = localStorage.getItem(`kitchen_pin:${tenant}`) || ''
      if (saved) setPin(saved)
    } catch {}
    setPinReady(true)
  }, [isBrowser, tenant])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2500)
    return () => clearTimeout(t)
  }, [toast])

  const fetcher = async (url: string): Promise<KitchenResponse> => {
    const res = await fetch(url, {
      headers: { 'X-Kitchen-Pin': pin },
      cache: 'no-store',
    })
    const json = await res.json().catch(() => null)
    if (!res.ok) return { ok: false, error: json?.error || `Error (${res.status})` }
    return json as KitchenResponse
  }

  const shouldFetch = pinReady && pin.trim().length > 0
  const { data: cfg } = useSWR<TenantConfig>(`/api/tenant/config?tenant=${encodeURIComponent(tenant)}`, (u: string) => fetch(u).then(r => r.json()))

  // Apply theme (match tenant branding)
  useEffect(() => {
    const theme = cfg?.theme
    if (!theme) return
    const bg = theme.bg || theme.primary
    if (bg) document.body.style.setProperty('--bg', bg)
    if (theme.text) document.body.style.setProperty('--text', theme.text)
    if (theme.ink) document.body.style.setProperty('--ink', theme.ink)
    if (theme.card) document.body.style.setProperty('--card', theme.card)
    if (theme.muted) document.body.style.setProperty('--muted', theme.muted)
    if (theme.accent) document.body.style.setProperty('--accent', theme.accent)
  }, [cfg?.theme])

  const { data, mutate } = useSWR<KitchenResponse>(
    shouldFetch ? `/api/kitchen/orders?tenant=${encodeURIComponent(tenant)}&view=${encodeURIComponent(view)}` : null,
    fetcher,
    { refreshInterval: 2000 }
  )

  const orders = useMemo(() => data?.orders || [], [data?.orders])

  // Note: preview-only debug actions removed to keep KDS kitchen-focused.
  const [nowTick, setNowTick] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const activeCount = useMemo(() => {
    return orders.filter(o => ['NEW', 'PREPARING', 'READY'].includes(String(o.status || '').toUpperCase())).length
  }, [orders])

  const orderNumberById = useMemo(() => {
    const sorted = [...orders].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
    const m = new Map<string, number>()
    sorted.forEach((o, i) => m.set(o.id, i + 1))
    return m
  }, [orders])

  const activeColumns = useMemo(() => {
    const byStatus = {
      NEW: [] as KitchenOrder[],
      PREPARING: [] as KitchenOrder[],
      READY: [] as KitchenOrder[],
    }
    for (const o of orders) {
      const s = String(o.status || '').toUpperCase()
      if (s === 'NEW') byStatus.NEW.push(o)
      else if (s === 'PREPARING') byStatus.PREPARING.push(o)
      else if (s === 'READY') byStatus.READY.push(o)
    }
    for (const k of Object.keys(byStatus) as Array<keyof typeof byStatus>) {
      byStatus[k].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
    }
    return byStatus
  }, [orders])

  const [dragX, setDragX] = useState<Record<string, number>>({})
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const dragStartXRef = useMemo(() => ({ x: 0, id: '' }), [])
  const isInteractiveTarget = (target: EventTarget | null) => {
    const el = target as HTMLElement | null
    if (!el) return false
    return !!el.closest('button, a, input, textarea, select, [role="button"], [data-no-drag="true"]')
  }

  const allergyRegex = useMemo(() => /allergy|allergic|gluten|celiac|nut|peanut|tree nut|shellfish|dairy|lactose/i, [])
  const hasAllergyFlag = (o: KitchenOrder) => {
    const parts: string[] = []
    if (o.note) parts.push(String(o.note))
    for (const it of o.items || []) {
      if (it.note) parts.push(String(it.note))
      if (Array.isArray(it.addOns)) parts.push(it.addOns.map(a => a.name).join(' '))
    }
    return allergyRegex.test(parts.join(' • '))
  }

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsOrderId, setDetailsOrderId] = useState<string | null>(null)
  const detailsOrder = useMemo(() => {
    if (!detailsOrderId) return null
    return orders.find(o => o.id === detailsOrderId) || null
  }, [detailsOrderId, orders])

  const updateStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/kitchen/orders?tenant=${encodeURIComponent(tenant)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Kitchen-Pin': pin,
        },
        body: JSON.stringify({ orderId, status }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) throw new Error(json?.error || `Update failed (${res.status})`)
      if (String(status).toUpperCase() === 'READY' && json?.sms) {
        const s = json.sms as { status?: string; error?: string; sid?: string; twilioStatus?: string }
        if (s.status === 'queued') setToast(`Updated: READY • SMS ${String(s.twilioStatus || 'queued')}`)
        else if (s.status === 'failed') setToast(`Updated: READY • SMS failed: ${String(s.error || 'unknown')}`)
        else setToast('Updated: READY')
        if (s.status === 'queued' && s.sid) {
          setTimeout(() => {
            void (async () => {
              try {
                const url = `/api/kitchen/sms-status?tenant=${encodeURIComponent(tenant)}&sid=${encodeURIComponent(String(s.sid))}`
                const r = await fetch(url, { headers: { 'X-Kitchen-Pin': pin }, cache: 'no-store' })
                const j = await r.json().catch(() => null)
                const m = j?.message as { status?: string; errorCode?: number | null; errorMessage?: string | null } | undefined
                if (!r.ok || !j?.ok || !m) return
                const st = String(m.status || '').toLowerCase()
                if (st === 'delivered') setToast('SMS delivered')
                else if (st === 'failed' || st === 'undelivered') {
                  const code = m.errorCode != null ? ` (${m.errorCode})` : ''
                  const msg = m.errorMessage ? `: ${m.errorMessage}` : ''
                  setToast(`SMS ${st}${code}${msg}`)
                }
              } catch {
                // ignore
              }
            })()
          }, 2500)
        }
      } else {
        setToast(`Updated: ${status}`)
      }
      await mutate()
    } catch (e) {
      const msg = (e as Error)?.message || ''
      const isNetwork = msg.toLowerCase().includes('failed to fetch') || e instanceof TypeError
      if (isNetwork) {
        try {
          const url =
            `/api/kitchen/update-status?tenant=${encodeURIComponent(tenant)}&orderId=${encodeURIComponent(orderId)}&status=${encodeURIComponent(status)}`
          const res2 = await fetch(url, {
            method: 'GET',
            headers: { 'X-Kitchen-Pin': pin },
            cache: 'no-store',
          })
          const json2 = await res2.json().catch(() => null)
          if (!res2.ok || !json2?.ok) throw new Error(json2?.error || `Update failed (${res2.status})`)
          if (String(status).toUpperCase() === 'READY' && json2?.sms) {
            const s = json2.sms as { status?: string; error?: string; sid?: string; twilioStatus?: string }
            if (s.status === 'queued') setToast(`Updated: READY • SMS ${String(s.twilioStatus || 'queued')}`)
            else if (s.status === 'failed') setToast(`Updated: READY • SMS failed: ${String(s.error || 'unknown')}`)
            else setToast('Updated: READY')
            if (s.status === 'queued' && s.sid) {
              setTimeout(() => {
                void (async () => {
                  try {
                    const url = `/api/kitchen/sms-status?tenant=${encodeURIComponent(tenant)}&sid=${encodeURIComponent(String(s.sid))}`
                    const r = await fetch(url, { headers: { 'X-Kitchen-Pin': pin }, cache: 'no-store' })
                    const j = await r.json().catch(() => null)
                    const m = j?.message as { status?: string; errorCode?: number | null; errorMessage?: string | null } | undefined
                    if (!r.ok || !j?.ok || !m) return
                    const st = String(m.status || '').toLowerCase()
                    if (st === 'delivered') setToast('SMS delivered')
                    else if (st === 'failed' || st === 'undelivered') {
                      const code = m.errorCode != null ? ` (${m.errorCode})` : ''
                      const msg = m.errorMessage ? `: ${m.errorMessage}` : ''
                      setToast(`SMS ${st}${code}${msg}`)
                    }
                  } catch {
                    // ignore
                  }
                })()
              }, 2500)
            }
          } else {
            setToast(`Updated: ${status}`)
          }
          await mutate()
          return
        } catch (e2) {
          setToast((e2 as Error)?.message || 'Update error')
          return
        }
      }
      setToast(msg || 'Update error')
    }
  }

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: 'var(--bg, #070707)', color: 'var(--text, #f8fafc)' }}
    >
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Persistent top bar */}
        <div
          className="sticky top-0 z-40 rounded-2xl border border-white/10 bg-black/40 backdrop-blur px-4 py-3"
          style={{ boxShadow: '0 12px 28px rgba(0,0,0,0.22)' }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {(cfg?.brand?.header?.logoUrl || cfg?.brand?.logoUrl) ? (
                <div className="h-10 max-w-[160px] px-2 rounded-xl bg-white/5 border border-white/10 flex items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={(cfg?.brand?.header?.logoUrl || cfg?.brand?.logoUrl) as string}
                    alt={cfg?.brand?.name || tenant}
                    className="h-8 w-auto max-w-[140px] object-contain"
                  />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/10" />
              )}
              <div className="min-w-0">
                <div className="text-lg font-extrabold truncate">{cfg?.brand?.name || tenant}</div>
                <div className="text-xs text-neutral-300">Kitchen Display</div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Active</div>
                <div className="text-sm font-extrabold">{activeCount}</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-right">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Time</div>
                <div className="text-sm font-extrabold">
                  {new Date(nowTick).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                </div>
              </div>
              {view === 'history' && (
                <button
                  type="button"
                  className="ml-2 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-transparent text-white/80 hover:bg-white/10 hover:text-white"
                  aria-label="Settings"
                  title="Open admin"
                  onClick={() => {
                    const cb = '/admin/menu'
                    window.location.href = `/auth/login?tenant=${encodeURIComponent(tenant)}&callbackUrl=${encodeURIComponent(cb)}`
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="2" />
                    <path d="M19.4 15a8.6 8.6 0 0 0 .1-1 8.6 8.6 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a8.6 8.6 0 0 0-1.7-1l-.3-2.6H11l-.3 2.6a8.6 8.6 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a8.6 8.6 0 0 0-.1 1 8.6 8.6 0 0 0 .1 1l-2 1.5 2 3.5 2.4-1a8.6 8.6 0 0 0 1.7 1l.3 2.6h4l.3-2.6a8.6 8.6 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {!shouldFetch && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-lg font-extrabold">Enter kitchen PIN</div>
            <div className="mt-2 text-sm text-neutral-300">
              Open the KDS PIN page to access this kitchen screen.
            </div>
            <a
              href="/kds"
              className="mt-4 inline-flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-black hover:bg-neutral-200"
            >
              Go to PIN entry
            </a>
          </div>
        )}

        <div className="mt-6">
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setView('active')}
              className={`rounded-xl px-3 py-2 text-xs font-extrabold border ${view === 'active' ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/20 hover:bg-white/10'}`}
            >
              Active board
            </button>
            <button
              type="button"
              onClick={() => setView('history')}
              className={`rounded-xl px-3 py-2 text-xs font-extrabold border ${view === 'history' ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/20 hover:bg-white/10'}`}
            >
              History
            </button>
          </div>

          {view === 'active' ? (
            <div className="mt-4">
              {(activeColumns.NEW.length + activeColumns.PREPARING.length + activeColumns.READY.length) === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
                  <div className="mx-auto h-12 w-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M6 7h12v8a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                      <path d="M9 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="mt-4 text-2xl font-extrabold">No Active Orders</div>
                  <div className="mt-2 text-sm text-neutral-300">New orders will appear here automatically.</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {([
                    { key: 'NEW', title: 'New Orders', hint: 'Tap “Start” to begin.' },
                    { key: 'PREPARING', title: 'Preparing', hint: 'Tap “Ready” when finished.' },
                    { key: 'READY', title: 'Ready for Pickup', hint: 'Swipe or tap “Complete” at handoff.' },
                  ] as const).map((col) => {
                    const colOrders = activeColumns[col.key]
                    return (
                      <div key={col.key} className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/10 bg-black/20">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-extrabold">{col.title}</div>
                            <div className="text-xs text-neutral-300">{colOrders.length}</div>
                          </div>
                          <div className="mt-1 text-xs text-neutral-400">{col.hint}</div>
                        </div>

                        <div className="p-3 space-y-3">
                          {colOrders.map((o) => {
                            const n = orderNumberById.get(o.id) || 0
                            const elapsed = formatElapsed(nowTick - Date.parse(o.createdAt))
                            const runningLong = (nowTick - Date.parse(o.createdAt)) >= 10 * 60 * 1000
                            const allergy = hasAllergyFlag(o)
                            const isDineIn = !!(o.tableNumber && String(o.tableNumber).trim())
                            const pickupBadge = isDineIn
                              ? `DINE-IN • Table ${String(o.tableNumber).trim()}`
                              : (o.scheduledFor ? `Scheduled • ${formatTime(o.scheduledFor, o.timezone)}` : 'Pickup • ASAP')

                            const border =
                              col.key === 'NEW'
                                ? 'border-sky-400/60'
                                : col.key === 'PREPARING'
                                  ? 'border-amber-400/60'
                                  : 'border-emerald-400/60'

                            const swipeX = dragX[o.id] || 0
                            const isSwipeable = col.key === 'READY'

                            return (
                              <div
                                key={o.id}
                                className={`rounded-2xl border border-white/10 bg-black/30 ${border} border-l-4 overflow-hidden`}
                                style={{
                                  transform: isSwipeable ? `translateX(${swipeX}px)` : undefined,
                                  transition: (isSwipeable && draggingId === o.id) ? 'none' : 'transform 160ms ease',
                                }}
                                onPointerDown={(e) => {
                                  if (!isSwipeable) return
                                  if (isInteractiveTarget(e.target)) return
                                  setDraggingId(o.id)
                                  dragStartXRef.x = e.clientX
                                  dragStartXRef.id = o.id
                                  try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) } catch {}
                                }}
                                onPointerMove={(e) => {
                                  if (!isSwipeable) return
                                  if (draggingId !== o.id) return
                                  const dx = e.clientX - dragStartXRef.x
                                  const clamped = Math.max(0, Math.min(160, dx))
                                  setDragX(prev => ({ ...prev, [o.id]: clamped }))
                                }}
                                onPointerUp={async () => {
                                  if (!isSwipeable) return
                                  if (draggingId !== o.id) return
                                  const dx = dragX[o.id] || 0
                                  setDraggingId(null)
                                  if (dx >= 120) {
                                    setDragX(prev => ({ ...prev, [o.id]: 0 }))
                                    await updateStatus(o.id, 'COMPLETED')
                                    return
                                  }
                                  setDragX(prev => ({ ...prev, [o.id]: 0 }))
                                }}
                                onPointerCancel={() => {
                                  if (!isSwipeable) return
                                  setDraggingId(null)
                                  setDragX(prev => ({ ...prev, [o.id]: 0 }))
                                }}
                              >
                                <div className="p-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="flex items-baseline gap-2">
                                        <div className="text-lg font-extrabold">Order #{n}</div>
                                        <div className={`text-[11px] font-semibold ${runningLong ? 'text-amber-200 animate-pulse' : 'text-neutral-300'}`}>
                                          {elapsed} elapsed{runningLong ? ' • Running long' : ''}
                                        </div>
                                      </div>
                                      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                                        <span className="rounded-full bg-white/10 px-2 py-1">{pickupBadge}</span>
                                        <span className="rounded-full bg-white/10 px-2 py-1">Total {money(o.totalCents)}</span>
                                        <span className="rounded-full bg-emerald-500/20 text-emerald-200 px-2 py-1">PAID</span>
                                        {!isDineIn && (
                                          <span className="rounded-full bg-white/10 px-2 py-1">Code {o.pickupCode}</span>
                                        )}
                                        {allergy && (
                                          <span className="rounded-full bg-red-500/20 text-red-100 px-2 py-1 font-extrabold">ALLERGY</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="mt-3 rounded-xl border border-white/10 bg-black/20 max-h-[220px] overflow-auto">
                                    {(o.items || []).map((it) => (
                                      <div key={it.id} className="px-3 py-2 border-b border-white/5 last:border-b-0">
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="min-w-0">
                                            <div className="text-[13px] font-semibold">
                                              <span className="mr-2 rounded-lg bg-white/10 px-2 py-0.5 text-xs font-extrabold">x{it.quantity}</span>
                                              {it.name}
                                            </div>
                                            {Array.isArray(it.addOns) && it.addOns.length > 0 && (
                                              <div className="mt-1 text-[11px] text-neutral-300">
                                                {it.addOns.map(a => a.name).join(', ')}
                                              </div>
                                            )}
                                            {it.note && (
                                              <div className="mt-1 text-[11px] text-amber-200 whitespace-pre-wrap">
                                                {it.note}
                                              </div>
                                            )}
                                          </div>
                                          <div className="text-[13px] font-semibold">{money(it.unitPriceCents * it.quantity)}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  {o.note && (
                                    <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                                      <div className="text-xs font-extrabold uppercase tracking-wide text-amber-200">Order notes</div>
                                      <div className="mt-1 whitespace-pre-wrap">{o.note}</div>
                                    </div>
                                  )}

                                  <div className="mt-3 grid grid-cols-2 gap-2">
                                    {col.key === 'NEW' && (
                                      <>
                                        <button
                                          type="button"
                                          data-no-drag="true"
                                          onClick={(e) => { e.stopPropagation(); void updateStatus(o.id, 'PREPARING') }}
                                          className="col-span-2 rounded-2xl px-4 py-2.5 text-sm font-extrabold border border-sky-300/40 bg-sky-500/20 hover:bg-sky-500/30"
                                        >
                                          Start Preparing
                                        </button>
                                      </>
                                    )}
                                    {col.key === 'PREPARING' && (
                                      <>
                                        <button
                                          type="button"
                                          data-no-drag="true"
                                          onClick={(e) => { e.stopPropagation(); void updateStatus(o.id, 'READY') }}
                                          className="col-span-2 rounded-2xl px-4 py-2.5 text-sm font-extrabold border border-amber-300/40 bg-amber-500/20 hover:bg-amber-500/30"
                                        >
                                          Mark Ready
                                        </button>
                                      </>
                                    )}
                                    {col.key === 'READY' && (
                                      <>
                                        <button
                                          type="button"
                                          data-no-drag="true"
                                          onClick={(e) => { e.stopPropagation(); void updateStatus(o.id, 'COMPLETED') }}
                                          className="col-span-2 rounded-2xl px-4 py-2.5 text-sm font-extrabold border border-emerald-300/40 bg-emerald-500/20 hover:bg-emerald-500/30"
                                        >
                                          Complete
                                        </button>
                                      </>
                                    )}
                                  </div>

                                  {isSwipeable && (
                                    <div className="mt-3 text-xs text-neutral-400">
                                      Tip: swipe right to complete.
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {orders.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                  <div className="text-xl font-extrabold">No completed orders</div>
                  <div className="mt-2 text-sm text-neutral-300">History shows completed/canceled orders from the last 24 hours.</div>
                </div>
              ) : (
                orders.map((o) => (
                  <div key={o.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <button
                          type="button"
                          className="text-sm font-extrabold underline underline-offset-4 hover:opacity-90"
                          onClick={() => {
                            setDetailsOrderId(o.id)
                            setDetailsOpen(true)
                          }}
                        >
                          Order #{orderNumberById.get(o.id) || ''}
                        </button>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-white/10 px-2 py-1">Status: {o.status}</span>
                          <span className="rounded-full bg-white/10 px-2 py-1">Total: {money(o.totalCents)}</span>
                          {o.tableNumber
                            ? <span className="rounded-full bg-white/10 px-2 py-1">DINE-IN • Table {o.tableNumber}</span>
                            : <span className="rounded-full bg-white/10 px-2 py-1">Pickup: {formatTime(o.scheduledFor, o.timezone)}</span>
                          }
                          {!o.tableNumber && <span className="rounded-full bg-white/10 px-2 py-1">Code: {o.pickupCode}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* History order details modal */}
        {detailsOpen && detailsOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-neutral-950 text-white shadow-2xl">
              <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-white/10">
                <div className="min-w-0">
                  <div className="text-lg font-extrabold">
                    Order #{orderNumberById.get(detailsOrder.id) || ''}
                  </div>
                  <div className="mt-1 text-xs text-neutral-300">
                    {new Date(detailsOrder.createdAt).toLocaleString(undefined, { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' })}
                    {' • '}
                    {formatElapsed(nowTick - Date.parse(detailsOrder.createdAt))} elapsed
                  </div>
                </div>
                <button
                  type="button"
                  className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
                  onClick={() => { setDetailsOpen(false); setDetailsOrderId(null) }}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="px-5 py-4 space-y-3">
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-white/10 px-2 py-1">Status: {detailsOrder.status}</span>
                  <span className="rounded-full bg-white/10 px-2 py-1">Total: {money(detailsOrder.totalCents)}</span>
                  {detailsOrder.tableNumber
                    ? <span className="rounded-full bg-white/10 px-2 py-1">DINE-IN • Table {detailsOrder.tableNumber}</span>
                    : <span className="rounded-full bg-white/10 px-2 py-1">Pickup: {detailsOrder.scheduledFor ? formatTime(detailsOrder.scheduledFor, detailsOrder.timezone) : 'ASAP'}</span>
                  }
                  {!detailsOrder.tableNumber && (
                    <span className="rounded-full bg-white/10 px-2 py-1">Code: {detailsOrder.pickupCode}</span>
                  )}
                  {hasAllergyFlag(detailsOrder) && (
                    <span className="rounded-full bg-red-500/20 text-red-100 px-2 py-1 font-extrabold">ALLERGY</span>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
                  {(detailsOrder.items || []).map((it) => (
                    <div key={it.id} className="px-4 py-3 border-b border-white/5 last:border-b-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold">
                            <span className="mr-2 rounded-lg bg-white/10 px-2 py-0.5 text-xs font-extrabold">x{it.quantity}</span>
                            {it.name}
                          </div>
                          {Array.isArray(it.addOns) && it.addOns.length > 0 && (
                            <div className="mt-1 text-xs text-neutral-300">
                              {it.addOns.map(a => a.name).join(', ')}
                            </div>
                          )}
                          {it.note && (
                            <div className="mt-1 text-xs text-amber-200 whitespace-pre-wrap">{it.note}</div>
                          )}
                        </div>
                        <div className="text-sm font-semibold">{money(it.unitPriceCents * it.quantity)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {detailsOrder.note && (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                    <div className="text-xs font-extrabold uppercase tracking-wide text-amber-200">Order notes</div>
                    <div className="mt-1 whitespace-pre-wrap">{detailsOrder.note}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl bg-black/80 border border-white/10 px-4 py-2 text-sm">
            {toast}
          </div>
        )}
      </div>
    </div>
  )
}

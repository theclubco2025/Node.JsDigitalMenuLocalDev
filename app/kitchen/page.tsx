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

const STATUS_CHOICES = ['NEW', 'PREPARING', 'READY', 'COMPLETED', 'CANCELED'] as const

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
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

  const { data, isLoading, mutate } = useSWR<KitchenResponse>(
    shouldFetch ? `/api/kitchen/orders?tenant=${encodeURIComponent(tenant)}&view=${encodeURIComponent(view)}` : null,
    fetcher,
    { refreshInterval: 2000 }
  )

  const orders = useMemo(() => data?.orders || [], [data?.orders])

  // Note: preview-only debug actions removed to keep KDS kitchen-focused.

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
      setToast(`Updated: ${status}`)
      await mutate()
    } catch (e) {
      setToast((e as Error)?.message || 'Update error')
    }
  }

  return (
    <div
      className="min-h-screen text-white"
      style={{ background: 'var(--bg, #070707)', color: 'var(--text, #f8fafc)' }}
    >
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              {(cfg?.brand?.header?.logoUrl || cfg?.brand?.logoUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={(cfg?.brand?.header?.logoUrl || cfg?.brand?.logoUrl) as string}
                  alt={cfg?.brand?.name || tenant}
                  className="h-10 w-10 rounded-xl object-cover border border-white/10"
                />
              ) : null}
              <div>
                <h1 className="text-2xl font-extrabold">{cfg?.brand?.name || tenant}</h1>
                <p className="text-sm text-neutral-300 mt-1">Incoming orders</p>
              </div>
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
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-neutral-200">
              {view === 'active' ? 'Incoming orders' : 'Recent history'}
            </div>
            <div className="text-xs text-neutral-400">
              {isLoading ? 'Loading…' : `Showing ${orders.length}`}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setView('active')}
              className={`rounded-xl px-3 py-2 text-xs font-extrabold border ${view === 'active' ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/20 hover:bg-white/10'}`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setView('history')}
              className={`rounded-xl px-3 py-2 text-xs font-extrabold border ${view === 'history' ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/20 hover:bg-white/10'}`}
            >
              History
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {orders.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-neutral-300">
                {view === 'active' ? 'No active orders yet.' : 'No completed/canceled orders in the last 24 hours.'}
              </div>
            )}

            {orders.map((o, idx) => {
              return (
                <div key={o.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm text-neutral-300">Order #{idx + 1}</div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-white/10 px-2 py-1">Status: {o.status}</span>
                        <span className="rounded-full bg-white/10 px-2 py-1">Total: {money(o.totalCents)}</span>
                        {o.tableNumber
                          ? <span className="rounded-full bg-white/10 px-2 py-1">DINE-IN • Table {o.tableNumber}</span>
                          : <span className="rounded-full bg-white/10 px-2 py-1">Pickup: {formatTime(o.scheduledFor, o.timezone)}</span>
                        }
                        <span className="rounded-full px-2 py-1 bg-emerald-500/20 text-emerald-200">
                          PAID
                        </span>
                        <span className="rounded-full bg-white/10 px-2 py-1">Pickup code: {o.pickupCode}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {STATUS_CHOICES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => updateStatus(o.id, s)}
                          className={`rounded-xl px-3 py-2 text-xs font-extrabold border ${
                            o.status === s ? 'bg-white text-black border-white' : 'bg-transparent text-white border-white/20 hover:bg-white/10'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {o.note && (
                    <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                      <div className="text-xs font-extrabold uppercase tracking-wide text-amber-200">Special instructions</div>
                      <div className="mt-1 whitespace-pre-wrap">{o.note}</div>
                    </div>
                  )}

                  {o.items?.length ? (
                    <div className="mt-4 rounded-xl border border-white/10 bg-black/20">
                      {o.items.map((it) => (
                        <div key={it.id} className="flex items-center justify-between px-3 py-2 text-sm border-b border-white/5 last:border-b-0">
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{it.name}</div>
                            <div className="text-xs text-neutral-400">Qty {it.quantity}</div>
                            {Array.isArray(it.addOns) && it.addOns.length > 0 && (
                              <div className="mt-1 text-xs text-neutral-300">
                                Add-ons: {it.addOns.map(a => a.name).join(', ')}
                              </div>
                            )}
                            {it.note && (
                              <div className="mt-1 text-xs text-amber-200 whitespace-pre-wrap">
                                Note: {it.note}
                              </div>
                            )}
                          </div>
                          <div className="font-semibold">{money(it.unitPriceCents * it.quantity)}</div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>

        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl bg-black/80 border border-white/10 px-4 py-2 text-sm">
            {toast}
          </div>
        )}
      </div>
    </div>
  )
}

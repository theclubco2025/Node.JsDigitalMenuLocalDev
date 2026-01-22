"use client"

import { useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'

type OrderItem = { id: string; name: string; quantity: number; unitPriceCents: number }
type KitchenOrder = {
  id: string
  status: string
  totalCents: number
  scheduledFor: string | null
  timezone: string
  paidAt: string | null
  createdAt: string
  pickupCode: string
  items: OrderItem[]
}

type KitchenResponse = {
  ok: boolean
  error?: string
  tenant?: { slug: string; name: string }
  orders?: KitchenOrder[]
}

const STATUS_CHOICES = ['PENDING_PAYMENT', 'NEW', 'PREPARING', 'READY', 'COMPLETED', 'CANCELED'] as const

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

export default function KitchenPage() {
  const isBrowser = typeof window !== 'undefined'
  const searchParams = isBrowser ? new URLSearchParams(window.location.search) : null
  const tenant = isBrowser ? (searchParams!.get('tenant') || 'independent-draft') : 'independent-draft'

  const [pin, setPin] = useState('')
  const [pinReady, setPinReady] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

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
      headers: {
        'X-Kitchen-Pin': pin,
      },
      cache: 'no-store',
    })
    const json = await res.json().catch(() => null)
    if (!res.ok) return { ok: false, error: json?.error || `Error (${res.status})` }
    return json as KitchenResponse
  }

  const shouldFetch = pinReady && pin.trim().length > 0
  const { data, isLoading, mutate } = useSWR<KitchenResponse>(
    shouldFetch ? `/api/kitchen/orders?tenant=${encodeURIComponent(tenant)}` : null,
    fetcher,
    { refreshInterval: 2000 }
  )

  const orders = useMemo(() => data?.orders || [], [data?.orders])

  const savePin = () => {
    const p = pin.trim()
    if (!p) return
    try { localStorage.setItem(`kitchen_pin:${tenant}`, p) } catch {}
    setToast('PIN saved')
  }

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
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold">Kitchen</h1>
            <p className="text-sm text-neutral-300 mt-1">
              Live incoming orders for <span className="font-semibold">{tenant}</span>
            </p>
          </div>
          <a
            href={`/menu?tenant=${encodeURIComponent(tenant)}`}
            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/15"
          >
            Back to menu
          </a>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm font-semibold">Kitchen PIN</div>
          <div className="mt-2 flex flex-col sm:flex-row gap-2">
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter kitchen PIN"
              className="w-full sm:max-w-xs rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm outline-none"
            />
            <button
              type="button"
              onClick={savePin}
              className="rounded-xl bg-white text-black px-4 py-2 text-sm font-extrabold hover:bg-neutral-200"
            >
              Save
            </button>
          </div>
          <div className="mt-2 text-xs text-neutral-300">
            Tip: For the Independent kitchen draft preview, if you didn’t set a PIN yet, the temporary default is <span className="font-bold">1234</span>.
          </div>
          {data?.ok === false && (
            <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {data.error || 'Unauthorized'}
            </div>
          )}
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-neutral-200">Orders</div>
            <div className="text-xs text-neutral-400">
              {isLoading ? 'Loading…' : `Showing ${orders.length}`}
            </div>
          </div>

          <div className="mt-3 space-y-3">
            {orders.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-neutral-300">
                No orders yet.
              </div>
            )}

            {orders.map((o) => {
              const paid = !!o.paidAt && o.status !== 'PENDING_PAYMENT'
              return (
                <div key={o.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm text-neutral-300">Order</div>
                      <div className="font-mono text-sm break-all">{o.id}</div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-white/10 px-2 py-1">Status: {o.status}</span>
                        <span className="rounded-full bg-white/10 px-2 py-1">Total: {money(o.totalCents)}</span>
                        <span className="rounded-full bg-white/10 px-2 py-1">Pickup: {formatTime(o.scheduledFor, o.timezone)}</span>
                        <span className={`rounded-full px-2 py-1 ${paid ? 'bg-emerald-500/20 text-emerald-200' : 'bg-amber-500/20 text-amber-200'}`}>
                          {paid ? 'PAID' : 'NOT PAID'}
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

                  {o.items?.length ? (
                    <div className="mt-4 rounded-xl border border-white/10 bg-black/20">
                      {o.items.map((it) => (
                        <div key={it.id} className="flex items-center justify-between px-3 py-2 text-sm border-b border-white/5 last:border-b-0">
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{it.name}</div>
                            <div className="text-xs text-neutral-400">Qty {it.quantity}</div>
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


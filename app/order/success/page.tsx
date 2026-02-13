/* eslint-disable @next/next/no-img-element */
"use client"

import { useEffect, useMemo, useState } from 'react'

type Props = {
  searchParams?: Record<string, string | string[] | undefined>
}

type OrderItem = { id: string; name: string; quantity: number; unitPriceCents: number }
type Tenant = { slug: string; name: string }
type Order = {
  id: string
  status: string
  totalCents: number
  pickupCode?: string
  scheduledFor: string | null
  timezone: string
  tenant?: Tenant | null
  items: OrderItem[]
}

function firstString(v: string | string[] | undefined): string | undefined {
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return v[0]
  return undefined
}

function isCanceled(status: string | undefined | null) {
  return String(status || '').toUpperCase() === 'CANCELED'
}

function stepState(status: string | undefined | null) {
  const s = String(status || '').toUpperCase()
  const canceled = s === 'CANCELED'
  const received = !canceled && !!s
  const preparing = !canceled && (s === 'PREPARING' || s === 'READY' || s === 'COMPLETED')
  const ready = !canceled && (s === 'READY' || s === 'COMPLETED')
  return { received, preparing, ready, canceled }
}

function moneyCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export default function OrderSuccessPage({ searchParams }: Props) {
  const orderId = useMemo(() => firstString(searchParams?.order) || '', [searchParams])
  const sessionId = useMemo(() => firstString(searchParams?.session_id) || '', [searchParams])

  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmTried, setConfirmTried] = useState(false)

  useEffect(() => {
    if (!orderId) return
    let cancelled = false
    async function poll() {
      try {
        const res = await fetch(`/api/orders/status?order=${encodeURIComponent(orderId)}`, { cache: 'no-store' })
        const json = await res.json().catch(() => null)
        if (cancelled) return
        if (!res.ok || !json?.ok) {
          setError(json?.error || `Could not load order (${res.status})`)
          return
        }
        setOrder(json.order as Order)
      } catch (e) {
        if (!cancelled) setError((e as Error)?.message || 'Could not load order')
      }
    }
    void poll()
    const t = setInterval(poll, 1500)
    return () => { cancelled = true; clearInterval(t) }
  }, [orderId])

  // Confirm fallback if webhook isn't configured yet (mirrors billing success flow)
  useEffect(() => {
    if (!orderId || !sessionId) return
    if (confirmTried) return
    if (order?.status && order.status !== 'PENDING_PAYMENT') return
    setConfirmTried(true)
    ;(async () => {
      try {
        await fetch('/api/orders/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, session_id: sessionId }),
        })
      } catch {
        // ignore
      }
    })()
  }, [orderId, sessionId, confirmTried, order?.status])

  if (!orderId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold">Order</h1>
        <p className="mt-3 text-neutral-700">Missing order id.</p>
      </div>
    )
  }

  const total = order ? (order.totalCents / 100).toFixed(2) : ''
  const scheduled = order?.scheduledFor
    ? new Date(order.scheduledFor).toLocaleString(undefined, { timeZone: order.timezone })
    : null
  const tenantSlug = order?.tenant?.slug || ''
  const tenantName = order?.tenant?.name || tenantSlug || 'Restaurant'
  const steps = stepState(order?.status)
  const pickupCode = order?.pickupCode ? String(order.pickupCode) : ''

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M20 7L10.5 16.5L4 10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold text-neutral-900">Order Confirmed</h1>
            <p className="mt-1 text-sm text-neutral-600">Thanks for ordering from {tenantName}</p>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Status tracker */}
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-extrabold text-neutral-900">Order Status</div>
            {pickupCode && (
              <div className="text-right">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Code</div>
                <div className="font-mono text-lg font-extrabold text-neutral-900">{pickupCode}</div>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${steps.received ? 'bg-neutral-900' : 'bg-neutral-300'}`} />
              <div className="text-sm font-semibold text-neutral-900">Received</div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${steps.preparing ? 'bg-neutral-900' : 'bg-neutral-300'}`} />
              <div className="text-sm font-semibold text-neutral-900">Preparing</div>
            </div>
            <div className={`flex items-center gap-3 ${steps.ready ? 'animate-pulse' : ''}`}>
              <div className={`h-3 w-3 rounded-full ${steps.ready ? 'bg-emerald-600' : 'bg-neutral-300'}`} />
              <div className={`text-sm font-extrabold ${steps.ready ? 'text-emerald-700' : 'text-neutral-900'}`}>Ready for Pickup</div>
            </div>
          </div>

          <div className="mt-4 text-sm text-neutral-600">
            This page will update automatically.
          </div>

          {order && (
            <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-neutral-700">
              <div>
                <span className="font-semibold">Pickup time:</span>{' '}
                {scheduled ? `${scheduled} (${order.timezone})` : 'ASAP'}
              </div>
              {steps.ready && !isCanceled(order.status) && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 font-semibold text-emerald-800">
                  Your order is ready for pickup at the bar.
                </div>
              )}
            </div>
          )}
        </div>

        {order?.items?.length ? (
          <div className="mt-6">
            <div className="text-sm font-extrabold text-neutral-900">Your Items</div>
            <div className="mt-3 divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white">
              {order.items.map((it) => (
                <div key={it.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-semibold text-neutral-900 truncate">{it.name}</div>
                    <div className="text-neutral-600">
                      Qty {it.quantity} • {moneyCents(it.unitPriceCents)}
                    </div>
                  </div>
                  <div className="font-extrabold text-neutral-900">
                    {moneyCents(it.unitPriceCents * it.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Total Paid */}
        {order && (
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="text-sm font-extrabold text-neutral-900">Total Paid</div>
            <div className="mt-2 text-3xl font-extrabold text-neutral-900">${total}</div>
          </div>
        )}

        {/* What happens next */}
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
          <div className="text-sm font-extrabold text-neutral-900">What happens next</div>
          <ul className="mt-2 space-y-1 text-sm text-neutral-700">
            <li>Your order has been sent to the kitchen.</li>
            <li>This page will update automatically as your order is prepared.</li>
            <li>When it’s ready, the final step will highlight.</li>
          </ul>
        </div>

        <div className="mt-6">
          <a
            href={`/menu?tenant=${encodeURIComponent(tenantSlug)}`}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-black px-4 py-3 text-sm font-extrabold text-white hover:bg-neutral-800"
          >
            Return to Menu
          </a>
        </div>
      </div>
    </div>
  )
}


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

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-neutral-900">Order received</h1>
        <p className="mt-1 text-sm text-neutral-600">{order?.tenant?.name || tenantSlug || 'Restaurant'}</p>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-2 text-sm">
          <div><span className="font-semibold">Status:</span> {order?.status || 'LOADING'}</div>
          {order && <div><span className="font-semibold">Total:</span> ${total}</div>}
          {order && (
            <>
              {scheduled && <div><span className="font-semibold">Pickup time:</span> {scheduled} ({order.timezone})</div>}
              {!scheduled && <div><span className="font-semibold">Pickup time:</span> ASAP</div>}
            </>
          )}
        </div>

        {order?.items?.length ? (
          <div className="mt-6">
            <div className="text-sm font-semibold text-neutral-900">Items</div>
            <div className="mt-2 divide-y divide-neutral-200 rounded-xl border border-neutral-200">
              {order.items.map((it) => (
                <div key={it.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium text-neutral-900 truncate">{it.name}</div>
                    <div className="text-neutral-600">Qty {it.quantity}</div>
                  </div>
                  <div className="font-semibold text-neutral-900">
                    ${((it.unitPriceCents * it.quantity) / 100).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex gap-3">
          <a
            href={`/menu?tenant=${encodeURIComponent(tenantSlug)}`}
            className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-bold text-white hover:bg-neutral-800"
          >
            Back to menu
          </a>
          <a
            href="/admin/orders"
            className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-bold text-neutral-900 hover:bg-neutral-50"
          >
            Kitchen/Admin view
          </a>
        </div>
      </div>
    </div>
  )
}


"use client"

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import AdminLayout from '@/components/AdminLayout'

type OrderItem = {
  id: string
  name: string
  quantity: number
  unitPriceCents: number
  note: string | null
  addOns: unknown
}

type OrderRow = {
  id: string
  status: string
  currency: string
  subtotalCents: number
  totalCents: number
  scheduledFor: string | null
  timezone: string
  paidAt: string | null
  refundedAt: string | null
  refundAmountCents: number | null
  stripeRefundId: string | null
  stripeRefundStatus: string | null
  note: string | null
  customerEmail: string | null
  customerName: string | null
  customerPhone: string | null
  createdAt: string
  items: OrderItem[]
}

type ListResponse =
  | { ok: true; tenant: string; orders: OrderRow[] }
  | { ok: false; error: string }

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then((r) => r.json())

function formatMoney(cents: number) {
  return (cents / 100).toFixed(2)
}

export default function AdminOrdersClient({ tenant }: { tenant: string }) {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null)

  const url = useMemo(() => {
    const sp = new URLSearchParams()
    sp.set('tenant', tenant)
    if (q.trim()) sp.set('q', q.trim())
    if (status.trim()) sp.set('status', status.trim())
    sp.set('limit', '100')
    return `/api/orders/list?${sp.toString()}`
  }, [tenant, q, status])

  const { data, isLoading, mutate } = useSWR<ListResponse>(url, fetcher)

  const orders = (data && 'ok' in data && data.ok) ? data.orders : []
  const error = (data && 'ok' in data && !data.ok) ? data.error : null

  const refund = async (order: OrderRow) => {
    if (!order.paidAt) {
      setToast('Order is not paid.')
      return
    }
    if (order.refundedAt) {
      setToast('Order already refunded.')
      return
    }
    const ok = window.confirm(`Refund this order for $${formatMoney(order.totalCents)}?`)
    if (!ok) return

    try {
      setBusyOrderId(order.id)
      const res = await fetch('/api/orders/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) throw new Error(json?.error || `Refund failed (${res.status})`)
      setToast('Refund issued')
      await mutate()
    } catch (e) {
      setToast((e as Error)?.message || 'Refund error')
    } finally {
      setBusyOrderId(null)
    }
  }

  return (
    <AdminLayout requiredRole="RESTAURANT_OWNER">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
            <div className="mt-2 text-sm text-gray-600">
              Tenant: <span className="font-mono">{tenant}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void mutate()}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-900 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-xl border border-gray-200 bg-white p-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-700">Search</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Order ID, email, name…"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">All</option>
              <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
              <option value="NEW">NEW</option>
              <option value="PREPARING">PREPARING</option>
              <option value="READY">READY</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELED">CANCELED</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
            Loading orders…
          </div>
        )}

        {!isLoading && orders.length === 0 && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-700">
            No orders found.
          </div>
        )}

        {!isLoading && orders.length > 0 && (
          <div className="mt-6 space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {o.status}{' '}
                      {o.paidAt ? <span className="ml-2 text-xs font-bold text-emerald-700">PAID</span> : <span className="ml-2 text-xs font-bold text-amber-700">UNPAID</span>}
                      {o.refundedAt ? <span className="ml-2 text-xs font-bold text-blue-700">REFUNDED</span> : null}
                    </div>
                    <div className="mt-1 text-xs text-gray-600 font-mono break-all">
                      {o.id}
                    </div>
                    <div className="mt-2 text-sm text-gray-800">
                      <span className="font-semibold">${formatMoney(o.totalCents)}</span>{' '}
                      <span className="text-gray-500">({o.currency.toUpperCase()})</span>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      {o.customerEmail ? <span className="font-mono">{o.customerEmail}</span> : 'No email'}
                      {o.customerName ? <span> · {o.customerName}</span> : null}
                      {o.customerPhone ? <span> · {o.customerPhone}</span> : null}
                    </div>
                    {o.scheduledFor && (
                      <div className="mt-2 text-xs text-gray-600">
                        Scheduled: {new Date(o.scheduledFor).toLocaleString()} ({o.timezone})
                      </div>
                    )}
                    {o.note && (
                      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                        <div className="text-xs font-bold uppercase tracking-wide text-amber-800">Special instructions</div>
                        <div className="mt-1 whitespace-pre-wrap">{o.note}</div>
                      </div>
                    )}
                    <div className="mt-3 text-sm text-gray-900">
                      {o.items.map((it) => (
                        <div key={it.id} className="py-1">
                          <div className="flex justify-between gap-3">
                            <div className="truncate">{it.quantity}× {it.name}</div>
                            <div className="font-mono text-gray-700">${formatMoney(it.unitPriceCents * it.quantity)}</div>
                          </div>
                          {Array.isArray(it.addOns) && it.addOns.length > 0 && (
                            <div className="mt-1 text-xs text-gray-600">
                              Add-ons: {(it.addOns as Array<{ name?: unknown }>).map(a => String(a?.name || '')).filter(Boolean).join(', ')}
                            </div>
                          )}
                          {it.note && (
                            <div className="mt-1 text-xs text-amber-800 whitespace-pre-wrap">
                              Note: {it.note}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:items-end">
                    <button
                      type="button"
                      onClick={() => void refund(o)}
                      disabled={!o.paidAt || Boolean(o.refundedAt) || busyOrderId === o.id}
                      className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-900 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {busyOrderId === o.id ? 'Refunding…' : 'Refund'}
                    </button>
                    {o.stripeRefundId && (
                      <div className="text-xs text-gray-500 font-mono break-all">
                        Refund: {o.stripeRefundStatus || 'created'} · {o.stripeRefundId}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}


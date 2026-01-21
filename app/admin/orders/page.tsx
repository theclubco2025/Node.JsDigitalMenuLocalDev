"use client"

import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'

type OrderItem = {
  id: string
  name: string
  quantity: number
  unitPriceCents: number
}

type Tenant = { slug: string; name: string }

type Order = {
  id: string
  status: 'PENDING_PAYMENT' | 'NEW' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELED'
  fulfillment: 'PICKUP'
  totalCents: number
  scheduledFor: string | null
  timezone: string
  createdAt: string
  customerEmail: string | null
  tenant?: Tenant | null
  items: OrderItem[]
}

const STATUS_OPTIONS: Order['status'][] = ['PENDING_PAYMENT', 'NEW', 'PREPARING', 'READY', 'COMPLETED', 'CANCELED']

export default function AdminOrdersPage() {
  const [tenant, setTenant] = useState<string>('') // optional (super admin can filter)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (tenant.trim()) params.set('tenant', tenant.trim())
    return params.toString() ? `?${params.toString()}` : ''
  }, [tenant])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/orders/admin${queryString}`, { cache: 'no-store' })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Load failed (${res.status})`)
      }
      setOrders((data.orders || []) as Order[])
    } catch (e) {
      setError((e as Error)?.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString])

  const updateStatus = async (orderId: string, status: Order['status']) => {
    try {
      const res = await fetch('/api/orders/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.ok) throw new Error(data?.error || `Update failed (${res.status})`)
      setOrders((prev) => prev.map(o => (o.id === orderId ? { ...o, status } : o)))
      setToast(`Updated order ${orderId.slice(0, 6)}… → ${status}`)
    } catch (e) {
      setToast((e as Error)?.message || 'Update failed')
    }
  }

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 1600)
    return () => clearTimeout(t)
  }, [toast])

  return (
    <AdminLayout requiredRole="RESTAURANT_OWNER">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Orders</h2>
            <p className="mt-1 text-sm text-neutral-600">Newest first. Update statuses as the kitchen progresses.</p>
          </div>
          <button
            onClick={() => void load()}
            className="rounded-xl bg-black px-4 py-2 text-sm font-bold text-white hover:bg-neutral-800 disabled:opacity-60"
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="text-sm font-semibold text-neutral-900">Tenant filter (Super Admin only)</div>
          <div className="mt-2 flex gap-2">
            <input
              value={tenant}
              onChange={(e) => setTenant(e.target.value)}
              placeholder="tenant slug (optional)"
              className="w-full max-w-md rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
            <button
              onClick={() => setTenant('')}
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
            >
              Clear
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-4">
          {loading && (
            <div className="text-sm text-neutral-600">Loading…</div>
          )}

          {!loading && orders.length === 0 && (
            <div className="rounded-xl border border-neutral-200 bg-white px-4 py-6 text-sm text-neutral-600">
              No orders yet.
            </div>
          )}

          {orders.map((o) => {
            const total = (o.totalCents / 100).toFixed(2)
            const scheduled = o.scheduledFor ? new Date(o.scheduledFor).toLocaleString(undefined, { timeZone: o.timezone }) : null
            return (
              <div key={o.id} className="rounded-2xl border border-neutral-200 bg-white p-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm text-neutral-600">
                      <span className="font-semibold text-neutral-900">Order</span> {o.id}
                    </div>
                    <div className="mt-1 text-sm text-neutral-700">
                      <span className="font-semibold">Total:</span> ${total}{' '}
                      <span className="ml-3 font-semibold">Pickup:</span> {scheduled ? `${scheduled} (${o.timezone})` : 'ASAP'}
                    </div>
                    {o.customerEmail && (
                      <div className="mt-1 text-xs text-neutral-600">Customer: {o.customerEmail}</div>
                    )}
                    {o.tenant?.slug && (
                      <div className="mt-1 text-xs text-neutral-600">Tenant: {o.tenant.name || o.tenant.slug}</div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <div className="text-xs font-semibold text-neutral-700">Status</div>
                    <select
                      className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm"
                      value={o.status}
                      onChange={(e) => void updateStatus(o.id, e.target.value as Order['status'])}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-neutral-200">
                  <div className="px-3 py-2 text-xs font-semibold text-neutral-700 border-b border-neutral-200">Items</div>
                  <div className="divide-y divide-neutral-200">
                    {o.items.map((it) => (
                      <div key={it.id} className="flex items-center justify-between px-3 py-2 text-sm">
                        <div className="min-w-0">
                          <div className="font-medium text-neutral-900 truncate">{it.name}</div>
                          <div className="text-xs text-neutral-600">Qty {it.quantity}</div>
                        </div>
                        <div className="font-semibold text-neutral-900">
                          ${((it.unitPriceCents * it.quantity) / 100).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-black px-4 py-2 text-sm text-white shadow">
          {toast}
        </div>
      )}
    </AdminLayout>
  )
}


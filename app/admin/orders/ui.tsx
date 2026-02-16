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
  tableNumber?: string | null
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

type AnalyticsTopItem = { name: string; qty: number; revenueCents: number; customCount: number }
type AnalyticsCustomization = { name: string; count: number }
type AnalyticsKeyword = { keyword: string; count: number }
type AnalyticsCategory = { category: string; count: number }
type AnalyticsMatchedItem = { id: string; name: string | null; count: number }
type AnalyticsSampleQ = { createdAt: string; category: string | null; question: string; fallback: boolean }
type AnalyticsOk = {
  ok: true
  tenant: { slug: string; name: string }
  range: { start: string; end: string; days: number }
  orders: {
    totalPaidOrders: number
    dineInCount: number
    pickupCount: number
    topItemsByQty: AnalyticsTopItem[]
    topItemsByRevenue: AnalyticsTopItem[]
    topCustomizations: AnalyticsCustomization[]
    ordersByHour: number[]
  }
  assistant: {
    totalQuestions: number
    topCategories: AnalyticsCategory[]
    topKeywords: AnalyticsKeyword[]
    topMatchedItems: AnalyticsMatchedItem[]
    sampleQuestions: AnalyticsSampleQ[]
  }
}
type AnalyticsResponse = AnalyticsOk | { ok: false; error: string }

export default function AdminOrdersClient({ tenant }: { tenant: string }) {
  const [tab, setTab] = useState<'orders' | 'analytics'>('orders')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [days, setDays] = useState(30)
  const [toast, setToast] = useState<string | null>(null)
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insights, setInsights] = useState<null | {
    highlights?: string[]
    wasteRisks?: string[]
    menuFixes?: string[]
    upsellIdeas?: string[]
    trainingNotes?: string[]
  }>(null)
  const [insightsRaw, setInsightsRaw] = useState<string | null>(null)

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

  const analyticsUrl = useMemo(() => {
    const sp = new URLSearchParams()
    sp.set('tenant', tenant)
    sp.set('days', String(days))
    return `/api/admin/analytics?${sp.toString()}`
  }, [tenant, days])

  const { data: analytics, isLoading: analyticsLoading, mutate: mutateAnalytics } =
    useSWR<AnalyticsResponse>(tab === 'analytics' ? analyticsUrl : null, fetcher)

  const generateInsights = async () => {
    try {
      setInsightsLoading(true)
      setInsights(null)
      setInsightsRaw(null)
      const res = await fetch('/api/admin/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant, days }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) throw new Error(json?.error || `Insights failed (${res.status})`)
      setInsights(json?.insights || null)
      setInsightsRaw(json?.raw || null)
      setToast('Insights generated')
    } catch (e) {
      setToast((e as Error)?.message || 'Insights error')
    } finally {
      setInsightsLoading(false)
    }
  }

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
            onClick={() => { void mutate(); void mutateAnalytics() }}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-900 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab('orders')}
            className={`rounded-lg px-3 py-2 text-sm font-bold border ${tab === 'orders' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'}`}
          >
            Orders
          </button>
          <button
            type="button"
            onClick={() => setTab('analytics')}
            className={`rounded-lg px-3 py-2 text-sm font-bold border ${tab === 'analytics' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'}`}
          >
            Analytics
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

        {error && tab === 'orders' && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {isLoading && tab === 'orders' && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
            Loading orders…
          </div>
        )}

        {!isLoading && tab === 'orders' && orders.length === 0 && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-700">
            No orders found.
          </div>
        )}

        {!isLoading && tab === 'orders' && orders.length > 0 && (
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
                    {o.tableNumber && (
                      <div className="mt-2 text-xs font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 rounded-lg px-2 py-1 inline-flex">
                        DINE-IN • Table {o.tableNumber}
                      </div>
                    )}
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

        {tab === 'analytics' && (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-gray-900">Analytics</div>
                  <div className="mt-1 text-xs text-gray-600">Default range: last {days} days</div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-gray-700">Days</label>
                  <select
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm"
                  >
                    <option value={7}>7</option>
                    <option value={30}>30</option>
                    <option value={90}>90</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => void mutateAnalytics()}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-900 hover:bg-gray-50"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </div>

            {analyticsLoading && (
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
                Loading analytics…
              </div>
            )}

            {!analyticsLoading && analytics?.ok && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Paid orders</div>
                    <div className="mt-1 text-2xl font-extrabold text-gray-900">{analytics.orders?.totalPaidOrders ?? 0}</div>
                    <div className="mt-2 text-xs text-gray-600">
                      Pickup: {analytics.orders?.pickupCount ?? 0} · Dine-in: {analytics.orders?.dineInCount ?? 0}
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">AI questions</div>
                    <div className="mt-1 text-2xl font-extrabold text-gray-900">{analytics.assistant?.totalQuestions ?? 0}</div>
                    <div className="mt-2 text-xs text-gray-600">Last {days} days</div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Top customization</div>
                    <div className="mt-2 text-sm font-bold text-gray-900">
                      {analytics.orders?.topCustomizations?.[0]?.name || '—'}
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      {analytics.orders?.topCustomizations?.[0]?.count ? `${analytics.orders.topCustomizations[0].count} times` : ''}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="text-sm font-bold text-gray-900">Top items (qty)</div>
                    <div className="mt-3 space-y-2">
                      {(analytics.orders?.topItemsByQty || []).slice(0, 8).map((it) => (
                        <div key={it.name} className="flex items-center justify-between gap-3 text-sm">
                          <div className="truncate text-gray-900">{it.name}</div>
                          <div className="font-mono text-gray-700">{it.qty}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="text-sm font-bold text-gray-900">Top AI keywords</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(analytics.assistant?.topKeywords || []).slice(0, 12).map((k) => (
                        <span key={k.keyword} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-800">
                          {k.keyword} · {k.count}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-gray-900">AI insights</div>
                      <div className="mt-1 text-xs text-gray-600">
                        Uses your existing AI key. Generates a concise ops summary.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { void generateInsights() }}
                      disabled={insightsLoading}
                      className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-black disabled:opacity-60"
                    >
                      {insightsLoading ? 'Generating…' : 'Generate insights'}
                    </button>
                  </div>

                  {(insights || insightsRaw) && (
                    <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {insights ? (
                        <>
                          {(['highlights', 'wasteRisks', 'menuFixes', 'upsellIdeas', 'trainingNotes'] as const).map((k) => (
                            <div key={k} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                              <div className="text-xs font-bold uppercase tracking-wide text-gray-600">{k}</div>
                              <ul className="mt-2 list-disc pl-5 text-sm text-gray-900 space-y-1">
                                {(insights[k] || []).slice(0, 8).map((line, idx) => (
                                  <li key={idx}>{line}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 whitespace-pre-wrap">
                          {insightsRaw}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {!analyticsLoading && analytics && !analytics.ok && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {analytics.error || 'Analytics error'}
              </div>
            )}
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


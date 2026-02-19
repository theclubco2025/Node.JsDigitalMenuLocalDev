"use client"

import { useEffect, useMemo, useState } from 'react'
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

function looksLikeSlugName(name: string, slug: string) {
  const n = String(name || '').trim()
  if (!n) return false
  const s = String(slug || '').trim()
  const lower = n.toLowerCase()
  if (s && lower === s.toLowerCase()) return true
  if (!n.includes(' ') && /^[a-z0-9-]+$/.test(lower)) return true
  return false
}

function humanizeTenantSlug(slug: string) {
  const s = String(slug || '').trim()
  if (!s) return ''
  if (s === 'independentbarandgrille') return 'Independent Bar & Grille'
  if (s === 'independent-draft') return 'Independent Bar & Grille'
  if (s.includes('-')) {
    return s
      .split('-')
      .filter(Boolean)
      .map(w => w.slice(0, 1).toUpperCase() + w.slice(1))
      .join(' ')
  }
  return s
}

function toIsoStartOfDay(yyyyMmDd: string) {
  const d = new Date(`${yyyyMmDd}T00:00:00`)
  return d.toISOString()
}
function toIsoEndOfDay(yyyyMmDd: string) {
  const d = new Date(`${yyyyMmDd}T23:59:59.999`)
  return d.toISOString()
}

function pctChange(current: number, prev: number) {
  if (!Number.isFinite(current) || !Number.isFinite(prev)) return null
  if (prev <= 0) return null
  return ((current - prev) / prev) * 100
}

function Trend({ current, prev }: { current: number; prev: number }) {
  const pct = pctChange(current, prev)
  if (pct == null) return <div className="mt-2 text-xs text-gray-500">—</div>
  const up = pct >= 0
  const label = `${up ? '↑' : '↓'} ${Math.abs(pct).toFixed(0)}% vs previous`
  return (
    <div className={`mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${up ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
      {label}
    </div>
  )
}

function KpiCard(props: {
  label: string
  value: number
  icon: React.ReactNode
  comparePrev?: number | null
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-wide text-gray-500">{props.label}</div>
          <div className="mt-1 text-3xl font-extrabold text-gray-900">{props.value}</div>
          {typeof props.comparePrev === 'number' ? <Trend current={props.value} prev={props.comparePrev} /> : null}
        </div>
        <div className="h-10 w-10 shrink-0 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-700">
          {props.icon}
        </div>
      </div>
    </div>
  )
}

function BarChart({ rows }: { rows: Array<{ name: string; value: number }> }) {
  const max = Math.max(1, ...rows.map(r => r.value))
  return (
    <div className="mt-4 space-y-3">
      {rows.map((r) => {
        const pct = Math.round((r.value / max) * 100)
        return (
          <div key={r.name} className="grid grid-cols-12 gap-3 items-center">
            <div className="col-span-5 text-sm font-semibold text-gray-900 truncate" title={r.name}>{r.name}</div>
            <div className="col-span-6">
              <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, rgba(17,24,39,0.95), rgba(17,24,39,0.75))' }} />
              </div>
            </div>
            <div className="col-span-1 text-right font-mono text-sm text-gray-700">{r.value}</div>
          </div>
        )
      })}
    </div>
  )
}

export default function AdminOrdersClient({ tenant }: { tenant: string }) {
  const [tab, setTab] = useState<'orders' | 'analytics'>('orders')
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [rangeMode, setRangeMode] = useState<'7' | '30' | '90' | 'custom'>('30')
  const [customStart, setCustomStart] = useState<string>('')
  const [customEnd, setCustomEnd] = useState<string>('')
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

  const range = useMemo(() => {
    const now = new Date()
    if (rangeMode !== 'custom') {
      const days = Number(rangeMode)
      const end = now
      const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      return {
        mode: rangeMode,
        label: `Last ${days} days`,
        startIso: start.toISOString(),
        endIso: end.toISOString(),
      }
    }
    const hasCustom = Boolean(customStart) && Boolean(customEnd)
    if (!hasCustom) {
      return { mode: 'custom' as const, label: 'Custom range', startIso: '', endIso: '' }
    }
    return {
      mode: 'custom' as const,
      label: `${customStart} → ${customEnd}`,
      startIso: toIsoStartOfDay(customStart),
      endIso: toIsoEndOfDay(customEnd),
    }
  }, [rangeMode, customStart, customEnd])

  const analyticsUrl = useMemo(() => {
    const sp = new URLSearchParams()
    sp.set('tenant', tenant)
    if (range.startIso) sp.set('start', range.startIso)
    if (range.endIso) sp.set('end', range.endIso)
    return `/api/admin/analytics?${sp.toString()}`
  }, [tenant, range.startIso, range.endIso])

  const { data: analytics, isLoading: analyticsLoading, mutate: mutateAnalytics } =
    useSWR<AnalyticsResponse>(tab === 'analytics' ? analyticsUrl : null, fetcher)

  const prevUrl = useMemo(() => {
    if (tab !== 'analytics') return null
    if (!range.startIso || !range.endIso) return null
    const end = new Date(range.endIso)
    const start = new Date(range.startIso)
    const durationMs = Math.max(1, end.getTime() - start.getTime())
    const prevEnd = start
    const prevStart = new Date(start.getTime() - durationMs)
    const sp = new URLSearchParams()
    sp.set('tenant', tenant)
    sp.set('start', prevStart.toISOString())
    sp.set('end', prevEnd.toISOString())
    return `/api/admin/analytics?${sp.toString()}`
  }, [tab, tenant, range.startIso, range.endIso])

  const { data: prevAnalytics } = useSWR<AnalyticsResponse>(prevUrl, fetcher)

  useEffect(() => {
    if (tab !== 'analytics') return
    void mutateAnalytics()
  }, [tab, mutateAnalytics])

  const generateInsights = async () => {
    try {
      setInsightsLoading(true)
      setInsights(null)
      setInsightsRaw(null)
      const res = await fetch('/api/admin/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant,
          start: range.startIso || undefined,
          end: range.endIso || undefined,
        }),
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

  const downloadCsv = async () => {
    try {
      if (!analytics || !analytics.ok) {
        setToast('Analytics not loaded yet')
        return
      }
      const lines: string[] = []
      const push = (...cells: Array<string | number | null | undefined>) => {
        const row = cells.map((c) => `"${String(c ?? '').replaceAll('"', '""')}"`).join(',')
        lines.push(row)
      }

      push('Tenant', analytics.tenant.name)
      push('RangeStart', analytics.range.start)
      push('RangeEnd', analytics.range.end)
      push('')

      push('KPI', 'Value')
      push('PaidOrders', analytics.orders.totalPaidOrders)
      push('PickupOrders', analytics.orders.pickupCount)
      push('DineInOrders', analytics.orders.dineInCount)
      push('AIQuestions', analytics.assistant.totalQuestions)
      push('')

      push('TopItemsByQty', 'Qty')
      for (const it of analytics.orders.topItemsByQty) push(it.name, it.qty)
      push('')

      push('TopCustomizations', 'Count')
      for (const c of analytics.orders.topCustomizations) push(c.name, c.count)
      push('')

      push('TopAIKeywords', 'Count')
      for (const k of analytics.assistant.topKeywords) push(k.keyword, k.count)
      push('')

      push('OrdersByHour', 'Count')
      analytics.orders.ordersByHour.forEach((n, hr) => push(String(hr).padStart(2, '0'), n))

      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics_${tenant}_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setToast('CSV downloaded')
    } catch (e) {
      setToast((e as Error)?.message || 'CSV export error')
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
          <div className="mt-6 space-y-5">
            {/* Title bar */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs font-bold uppercase tracking-wide text-gray-500">Analytics</div>
                  <div className="mt-1 text-2xl font-extrabold text-gray-900 truncate">
                    Analytics — {(() => {
                      const a = analytics && analytics.ok ? analytics : null
                      const rawName = a?.tenant?.name || ''
                      const slug = a?.tenant?.slug || tenant
                      const name = rawName && !looksLikeSlugName(rawName, slug) ? rawName : (humanizeTenantSlug(slug) || slug)
                      return name
                    })()}
                  </div>
                  <div className="mt-1 text-sm text-gray-600">{range.label}</div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
                    {(['7', '30', '90', 'custom'] as const).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setRangeMode(k)}
                        className={`px-3 py-2 text-sm font-bold rounded-lg ${rangeMode === k ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-white'}`}
                      >
                        {k === 'custom' ? 'Custom' : `Last ${k}`}
                      </button>
                    ))}
                  </div>

                  {rangeMode === 'custom' && (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                      />
                      <span className="text-sm text-gray-500">to</span>
                      <input
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => void mutateAnalytics()}
                    className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-900 hover:bg-gray-50"
                  >
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={() => { void downloadCsv() }}
                    className="rounded-xl bg-gray-900 px-3 py-2 text-sm font-extrabold text-white hover:bg-black"
                  >
                    Download CSV
                  </button>
                </div>
              </div>
            </div>

            {analyticsLoading && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-700 shadow-sm">
                Loading analytics…
              </div>
            )}

            {!analyticsLoading && analytics?.ok && (
              <>
                {/* KPI cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <KpiCard
                    label="Paid Orders"
                    value={analytics.orders.totalPaidOrders ?? 0}
                    comparePrev={prevAnalytics && prevAnalytics.ok ? prevAnalytics.orders.totalPaidOrders : null}
                    icon={
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M7 7h10v10H7V7Z" stroke="currentColor" strokeWidth="2" />
                        <path d="M9 11h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    }
                  />
                  <KpiCard
                    label="Pickup Orders"
                    value={analytics.orders.pickupCount ?? 0}
                    comparePrev={prevAnalytics && prevAnalytics.ok ? prevAnalytics.orders.pickupCount : null}
                    icon={
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M7 10h10l-1 9H8l-1-9Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                        <path d="M9 10V8a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    }
                  />
                  <KpiCard
                    label="Dine-In Orders"
                    value={analytics.orders.dineInCount ?? 0}
                    comparePrev={prevAnalytics && prevAnalytics.ok ? prevAnalytics.orders.dineInCount : null}
                    icon={
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M7 21v-7a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M9 9h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M10 3h4v6h-4V3Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                      </svg>
                    }
                  />
                  <KpiCard
                    label="AI Questions"
                    value={analytics.assistant.totalQuestions ?? 0}
                    comparePrev={prevAnalytics && prevAnalytics.ok ? prevAnalytics.assistant.totalQuestions : null}
                    icon={
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M21 12a8 8 0 1 1-3.2-6.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M22 4v6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    }
                  />
                </div>

                <div className="grid grid-cols-12 gap-4">
                  {/* Top items (bar chart) */}
                  <div className="col-span-12 lg:col-span-7 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <div className="text-sm font-extrabold text-gray-900">Top Items (Qty)</div>
                        <div className="mt-1 text-xs text-gray-600">Most-ordered items in this period.</div>
                      </div>
                    </div>
                    {(analytics.orders.topItemsByQty || []).length === 0 ? (
                      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                        No paid orders recorded in this period.
                      </div>
                    ) : (
                      <BarChart rows={(analytics.orders.topItemsByQty || []).slice(0, 10).map((it) => ({ name: it.name, value: it.qty }))} />
                    )}
                  </div>

                  {/* Top customizations */}
                  <div className="col-span-12 lg:col-span-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="text-sm font-extrabold text-gray-900">Top Customizations</div>
                    <div className="mt-1 text-xs text-gray-600">Common add-ons/modifiers customers select.</div>
                    {(analytics.orders.topCustomizations || []).length === 0 ? (
                      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                        No customizations recorded in this period. Customers ordered items as-is.
                      </div>
                    ) : (
                      <div className="mt-4 space-y-2">
                        {(analytics.orders.topCustomizations || []).slice(0, 10).map((c) => (
                          <div key={c.name} className="flex items-center justify-between gap-3 text-sm">
                            <div className="truncate font-semibold text-gray-900">{c.name}</div>
                            <div className="font-mono text-gray-700">{c.count}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Top AI keywords */}
                  <div className="col-span-12 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="text-sm font-extrabold text-gray-900">AI Keywords</div>
                    <div className="mt-1 text-xs text-gray-600">What customers tend to ask about (signals for menu clarity).</div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(analytics.assistant.topKeywords || []).length === 0 ? (
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 w-full">
                          No AI questions recorded in this period.
                        </div>
                      ) : (
                        (analytics.assistant.topKeywords || []).slice(0, 16).map((k) => (
                          <span key={k.keyword} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-800">
                            {k.keyword} · {k.count}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Insights card */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="text-sm font-extrabold text-gray-900">AI Insights (beta)</div>
                      <div className="mt-1 text-xs text-gray-600">Generate a concise operational summary based on your selected period.</div>
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


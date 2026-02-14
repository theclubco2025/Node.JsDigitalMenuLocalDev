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
  tableNumber?: string | null
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

function looksLikeSlugName(name: string, slug: string) {
  const n = String(name || '').trim()
  if (!n) return false
  const s = String(slug || '').trim()
  const lower = n.toLowerCase()
  if (s && lower === s.toLowerCase()) return true
  // No spaces + mostly lowercase alphanumerics/hyphens = sluggy.
  if (!n.includes(' ') && /^[a-z0-9-]+$/.test(lower)) return true
  return false
}

function formatPickupTime(iso: string | null, tz: string) {
  if (!iso) return 'ASAP'
  try {
    const d = new Date(iso)
    const t = d.toLocaleTimeString(undefined, {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    })
    return `Today ${t}`
  } catch {
    return iso
  }
}

export default function OrderSuccessPage({ searchParams }: Props) {
  const orderId = useMemo(() => firstString(searchParams?.order) || '', [searchParams])
  const sessionId = useMemo(() => firstString(searchParams?.session_id) || '', [searchParams])

  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmTried, setConfirmTried] = useState(false)
  const [cfgOrdering, setCfgOrdering] = useState<Record<string, unknown> | null>(null)
  const [copied, setCopied] = useState(false)

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

  // Persist last order id per-tenant so customers can reopen if they leave this screen.
  useEffect(() => {
    const tenant = order?.tenant?.slug
    if (!tenant || !order?.id) return
    try {
      localStorage.setItem(`last_order_v1:${tenant}`, order.id)
    } catch {
      // ignore
    }
  }, [order?.id, order?.tenant?.slug])

  // Load public tenant config (includes ordering copy) and refresh periodically so edits
  // in the admin editor show up without a manual page refresh.
  useEffect(() => {
    const tenant = (order?.tenant?.slug || '').trim()
    if (!tenant) return
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(`/api/tenant/config?tenant=${encodeURIComponent(tenant)}`, { cache: 'no-store' })
        const json = await res.json().catch(() => null)
        if (cancelled) return
        setCfgOrdering((json?.ordering as Record<string, unknown>) || null)
      } catch {
        if (!cancelled) setCfgOrdering(null)
      }
    }
    void load()
    const t = setInterval(load, 12_000)
    return () => { cancelled = true; clearInterval(t) }
  }, [order?.tenant?.slug])

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(t)
  }, [copied])

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
  const tenantSlug = order?.tenant?.slug || ''
  const rawTenantName = (order?.tenant?.name && order.tenant.name.trim()) ? order.tenant.name.trim() : ''
  const tenantName = rawTenantName && !looksLikeSlugName(rawTenantName, tenantSlug)
    ? rawTenantName
    : (humanizeTenantSlug(tenantSlug) || 'Restaurant')
  const steps = stepState(order?.status)
  const pickupCode = order?.pickupCode ? String(order.pickupCode) : ''
  const isDineIn = !!(order?.tableNumber && String(order.tableNumber).trim())

  const statusCopy = (cfgOrdering && typeof cfgOrdering === 'object') ? ((cfgOrdering as Record<string, unknown>).statusCopy as Record<string, unknown> | undefined) : undefined
  const pickupCopy = (statusCopy && typeof statusCopy.pickup === 'object') ? (statusCopy.pickup as Record<string, unknown>) : {}
  const dineInCopy = (statusCopy && typeof statusCopy.dineIn === 'object') ? (statusCopy.dineIn as Record<string, unknown>) : {}
  const pickupCodeCopy = (cfgOrdering && typeof cfgOrdering === 'object') ? ((cfgOrdering as Record<string, unknown>).pickupCodeCopy as Record<string, unknown> | undefined) : undefined

  const step3Label = isDineIn
    ? (typeof dineInCopy.step3Label === 'string' && dineInCopy.step3Label.trim() ? dineInCopy.step3Label.trim() : 'Ready for Table')
    : (typeof pickupCopy.step3Label === 'string' && pickupCopy.step3Label.trim() ? pickupCopy.step3Label.trim() : 'Ready for Pickup')

  const readyMessage = isDineIn
    ? (typeof dineInCopy.readyMessage === 'string' && dineInCopy.readyMessage.trim() ? dineInCopy.readyMessage.trim() : 'Your order is ready — we’ll bring it to your table.')
    : (typeof pickupCopy.readyMessage === 'string' && pickupCopy.readyMessage.trim() ? pickupCopy.readyMessage.trim() : 'Your order is ready for pickup at the bar.')

  const pickupCodeHelper = typeof pickupCodeCopy?.helper === 'string' && pickupCodeCopy.helper.trim()
    ? pickupCodeCopy.helper.trim()
    : 'Save this pickup code — you’ll need it when you arrive.'

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
                {!isDineIn && (
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(pickupCode)
                          setCopied(true)
                        } catch {
                          try {
                            const el = document.createElement('textarea')
                            el.value = pickupCode
                            el.style.position = 'fixed'
                            el.style.left = '-9999px'
                            document.body.appendChild(el)
                            el.focus()
                            el.select()
                            document.execCommand('copy')
                            el.remove()
                            setCopied(true)
                          } catch {
                            // ignore
                          }
                        }
                      }}
                      className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs font-bold text-neutral-900 hover:bg-neutral-100"
                    >
                      {copied ? 'Copied' : 'Copy code'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {!isDineIn && pickupCode && (
            <div className="mt-3 text-xs text-neutral-600">
              {pickupCodeHelper}
            </div>
          )}

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
              <div className={`text-sm font-extrabold ${steps.ready ? 'text-emerald-700' : 'text-neutral-900'}`}>{step3Label}</div>
            </div>
          </div>

          <div className="mt-4 text-sm text-neutral-600">
            This page will update automatically.
          </div>

          {order && (
            <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-neutral-700">
              {isDineIn ? (
                <div>
                  <span className="font-semibold">Dine-in:</span>{' '}
                  Table {String(order.tableNumber || '').trim()}
                </div>
              ) : (
                <div>
                  <span className="font-semibold">Pickup time:</span>{' '}
                  {formatPickupTime(order.scheduledFor, order.timezone)}
                </div>
              )}
              {steps.ready && !isCanceled(order.status) && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 font-semibold text-emerald-800">
                  {readyMessage}
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


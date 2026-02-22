"use client"

import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import type { MenuResponse } from '@/types/api'

type DraftMenu = MenuResponse

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(2, 6)}`
}

function parseTags(raw: string): string[] {
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

export default function AdminMenuClient({ tenant }: { tenant: string }) {
  const humanTenant = useMemo(() => {
    const t = (tenant || '').trim()
    if (!t) return ''
    if (t === 'independentbarandgrille' || t === 'independent-draft') return 'Independent Bar & Grille'
    const parts = t.split('-').filter(Boolean)
    if (parts.length <= 1) return t
    return parts.map(w => w.slice(0, 1).toUpperCase() + w.slice(1)).join(' ')
  }, [tenant])
  const editorUrl = useMemo(() => `/menu?tenant=${encodeURIComponent(tenant)}&admin=1`, [tenant])
  const [menu, setMenu] = useState<DraftMenu | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [query, setQuery] = useState('')
  const [kitchenPin, setKitchenPin] = useState('')
  const [pinSaving, setPinSaving] = useState(false)
  const [orderingPaused, setOrderingPaused] = useState(false)
  const [pauseMessage, setPauseMessage] = useState('')
  const [schedulingEnabled, setSchedulingEnabled] = useState(true)
  const [slotMinutes, setSlotMinutes] = useState<number>(15)
  const [leadTimeMinutes, setLeadTimeMinutes] = useState<number>(30)
  const [orderingSaving, setOrderingSaving] = useState(false)
  const [dineInEnabled, setDineInEnabled] = useState(false)
  const [dineInLabel, setDineInLabel] = useState('Table number')
  const [pickupStep3Label, setPickupStep3Label] = useState('Ready for Pickup')
  const [pickupReadyMessage, setPickupReadyMessage] = useState('Your order is ready for pickup at the bar.')
  const [dineInStep3Label, setDineInStep3Label] = useState('Ready for Table')
  const [dineInReadyMessage, setDineInReadyMessage] = useState('Your order is ready — we’ll bring it to your table.')
  const [pickupCodeHelper, setPickupCodeHelper] = useState('Save this pickup code — you’ll need it when you arrive.')

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2000)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      setDirty(false)
      try {
        const res = await fetch(`/api/menu?tenant=${encodeURIComponent(tenant)}`, { cache: 'no-store' })
        const json = await res.json().catch(() => null)
        if (!res.ok) throw new Error(json?.error || `Load failed (${res.status})`)
        if (!cancelled) setMenu(deepClone(json as DraftMenu))
      } catch (e) {
        if (!cancelled) setError((e as Error)?.message || 'Load error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [tenant])

  useEffect(() => {
    let cancelled = false
    async function loadOrdering() {
      try {
        const res = await fetch(`/api/tenant/ordering?tenant=${encodeURIComponent(tenant)}`, { cache: 'no-store' })
        const json = await res.json().catch(() => null)
        if (!res.ok || !json?.ok) return
        const ordering = (json.ordering || {}) as Record<string, unknown>
        const scheduling = (ordering.scheduling && typeof ordering.scheduling === 'object')
          ? (ordering.scheduling as Record<string, unknown>)
          : {}
        const dineIn = (ordering.dineIn && typeof ordering.dineIn === 'object')
          ? (ordering.dineIn as Record<string, unknown>)
          : {}
        const statusCopy = (ordering.statusCopy && typeof ordering.statusCopy === 'object')
          ? (ordering.statusCopy as Record<string, unknown>)
          : {}
        const pickupCopy = (statusCopy.pickup && typeof statusCopy.pickup === 'object')
          ? (statusCopy.pickup as Record<string, unknown>)
          : {}
        const dineInCopy = (statusCopy.dineIn && typeof statusCopy.dineIn === 'object')
          ? (statusCopy.dineIn as Record<string, unknown>)
          : {}
        const pickupCodeCopy = (ordering.pickupCodeCopy && typeof ordering.pickupCodeCopy === 'object')
          ? (ordering.pickupCodeCopy as Record<string, unknown>)
          : {}
        if (cancelled) return
        setOrderingPaused(ordering.paused === true)
        setPauseMessage(typeof ordering.pauseMessage === 'string' ? ordering.pauseMessage : '')
        setSchedulingEnabled(scheduling.enabled !== false)
        setSlotMinutes(typeof scheduling.slotMinutes === 'number' ? scheduling.slotMinutes : 15)
        setLeadTimeMinutes(typeof scheduling.leadTimeMinutes === 'number' ? scheduling.leadTimeMinutes : 30)
        setDineInEnabled(dineIn.enabled === true)
        setDineInLabel(typeof dineIn.label === 'string' && dineIn.label.trim() ? dineIn.label.trim() : 'Table number')
        setPickupStep3Label(typeof pickupCopy.step3Label === 'string' && pickupCopy.step3Label.trim() ? pickupCopy.step3Label.trim() : 'Ready for Pickup')
        setPickupReadyMessage(typeof pickupCopy.readyMessage === 'string' && pickupCopy.readyMessage.trim() ? pickupCopy.readyMessage.trim() : 'Your order is ready for pickup at the bar.')
        setDineInStep3Label(typeof dineInCopy.step3Label === 'string' && dineInCopy.step3Label.trim() ? dineInCopy.step3Label.trim() : 'Ready for Table')
        setDineInReadyMessage(typeof dineInCopy.readyMessage === 'string' && dineInCopy.readyMessage.trim() ? dineInCopy.readyMessage.trim() : 'Your order is ready — we’ll bring it to your table.')
        setPickupCodeHelper(typeof pickupCodeCopy.helper === 'string' && pickupCodeCopy.helper.trim() ? pickupCodeCopy.helper.trim() : 'Save this pickup code — you’ll need it when you arrive.')
      } catch {
        // ignore
      }
    }
    void loadOrdering()
    return () => { cancelled = true }
  }, [tenant])

  const save = async () => {
    if (!menu) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/tenant/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant, menu }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) throw new Error(json?.error || `Save failed (${res.status})`)
      // Re-load from the live source of truth to confirm persistence.
      const reload = await fetch(`/api/menu?tenant=${encodeURIComponent(tenant)}`, { cache: 'no-store' })
      const reJson = await reload.json().catch(() => null)
      if (!reload.ok) throw new Error(reJson?.error || `Reload failed (${reload.status})`)
      setMenu(deepClone(reJson as DraftMenu))
      setToast('Saved')
      setDirty(false)
    } catch (e) {
      setError((e as Error)?.message || 'Save error')
    } finally {
      setSaving(false)
    }
  }

  const saveKitchenPin = async () => {
    const p = kitchenPin.trim()
    if (!p) return
    setPinSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/tenant/kitchen-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant, kitchenPin: p }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) throw new Error(json?.error || `Save failed (${res.status})`)
      setToast('Kitchen PIN saved')
    } catch (e) {
      setError((e as Error)?.message || 'Kitchen PIN save error')
    } finally {
      setPinSaving(false)
    }
  }

  const saveOrdering = async () => {
    setOrderingSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/tenant/ordering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant,
          ordering: {
            paused: orderingPaused,
            pauseMessage,
            scheduling: {
              enabled: schedulingEnabled,
              slotMinutes,
              leadTimeMinutes,
            },
            dineIn: {
              enabled: dineInEnabled,
              label: dineInLabel,
            },
            statusCopy: {
              pickup: {
                step3Label: pickupStep3Label,
                readyMessage: pickupReadyMessage,
              },
              dineIn: {
                step3Label: dineInStep3Label,
                readyMessage: dineInReadyMessage,
              },
            },
            pickupCodeCopy: {
              helper: pickupCodeHelper,
            },
          }
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) throw new Error(json?.error || `Save failed (${res.status})`)
      setToast('Ordering settings saved')
    } catch (e) {
      setError((e as Error)?.message || 'Ordering settings save error')
    } finally {
      setOrderingSaving(false)
    }
  }

  return (
    <AdminLayout requiredRole="RESTAURANT_OWNER">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900">Menu Editor</h2>
        <p className="mt-2 text-gray-600">
          Tenant: <span className="font-semibold text-gray-900">{humanTenant || tenant}</span>
          {humanTenant && humanTenant !== tenant && (
            <span className="ml-2 text-xs text-gray-500 font-mono">({tenant})</span>
          )}
        </p>

        <div className="mt-3 text-sm text-gray-600">
          Edit your menu here, then click <span className="font-semibold">Save</span>. Changes show up on the customer menu instantly (no redeploy).
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={save}
            disabled={saving || loading || !menu}
            className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          {dirty && (
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1">
              Unsaved changes
            </span>
          )}
          <a
            href={editorUrl}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-900 hover:bg-gray-50"
          >
            View customer menu
          </a>
        </div>

        <div className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <div className="text-sm font-extrabold text-gray-900">Restaurant settings</div>
              <div className="mt-1 text-xs text-gray-700">
                These settings affect live kitchen access and ordering behavior.
              </div>
            </div>
            <a
              href="/kds"
              className="inline-flex items-center justify-center rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-bold text-indigo-900 hover:bg-indigo-100"
            >
              Open kitchen login
            </a>
          </div>

          <div className="mt-4 rounded-xl border border-indigo-200 bg-white p-4">
            <div className="text-sm font-semibold text-gray-900">Kitchen PIN</div>
            <div className="mt-2 flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                value={kitchenPin}
                onChange={(e) => setKitchenPin(e.target.value)}
                placeholder="Set kitchen PIN (share with staff)"
                className="w-full sm:max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={saveKitchenPin}
                disabled={pinSaving || kitchenPin.trim().length === 0}
                className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {pinSaving ? 'Saving…' : 'Save PIN'}
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-700">
              Staff enters this PIN on the kitchen login screen to open the correct kitchen display.
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-indigo-200 bg-white p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-gray-900">Pause ordering</div>
                <div className="mt-1 text-xs text-gray-700">
                  Turn this on if the kitchen is slammed or closed. Checkout will be blocked and customers will see the message below.
                </div>
              </div>
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 select-none">
                <input
                  type="checkbox"
                  checked={orderingPaused}
                  onChange={(e) => setOrderingPaused(e.target.checked)}
                  className="h-4 w-4"
                />
                Paused
              </label>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-semibold text-gray-700">Pause message</label>
              <input
                value={pauseMessage}
                onChange={(e) => setPauseMessage(e.target.value)}
                placeholder="Example: Ordering paused — we’ll be back at 5pm."
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700">Lead time (minutes)</label>
                <input
                  type="number"
                  value={leadTimeMinutes}
                  onChange={(e) => setLeadTimeMinutes(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700">Slot size (minutes)</label>
                <input
                  type="number"
                  value={slotMinutes}
                  onChange={(e) => setSlotMinutes(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 select-none">
                  <input
                    type="checkbox"
                    checked={schedulingEnabled}
                    onChange={(e) => setSchedulingEnabled(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Scheduling enabled
                </label>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Dine-in ordering (table numbers)</div>
                  <div className="mt-1 text-xs text-gray-700">
                    Optional feature: customers can enter a table number at checkout. KDS will show it for in-restaurant orders.
                  </div>
                </div>
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 select-none">
                  <input
                    type="checkbox"
                    checked={dineInEnabled}
                    onChange={(e) => setDineInEnabled(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Enabled
                </label>
              </div>
              <div className="mt-3">
                <label className="block text-xs font-semibold text-gray-700">Field label</label>
                <input
                  value={dineInLabel}
                  onChange={(e) => setDineInLabel(e.target.value)}
                  placeholder="Table number"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-indigo-200 bg-white p-4">
              <div className="text-sm font-semibold text-gray-900">Customer order status copy</div>
              <div className="mt-1 text-xs text-gray-700">
                These labels/messages appear on the customer “Order Confirmed” page and update live as the kitchen changes status.
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-gray-200 p-3">
                  <div className="text-xs font-extrabold uppercase tracking-wide text-gray-700">To-go pickup</div>
                  <label className="mt-3 block text-xs font-semibold text-gray-700">Final step label</label>
                  <input
                    value={pickupStep3Label}
                    onChange={(e) => setPickupStep3Label(e.target.value)}
                    placeholder="Ready for Pickup"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                  <label className="mt-3 block text-xs font-semibold text-gray-700">Ready message</label>
                  <textarea
                    value={pickupReadyMessage}
                    onChange={(e) => setPickupReadyMessage(e.target.value)}
                    placeholder="Your order is ready for pickup at the bar."
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    rows={3}
                  />
                </div>

                <div className="rounded-lg border border-gray-200 p-3">
                  <div className="text-xs font-extrabold uppercase tracking-wide text-gray-700">Dine-in</div>
                  <label className="mt-3 block text-xs font-semibold text-gray-700">Final step label</label>
                  <input
                    value={dineInStep3Label}
                    onChange={(e) => setDineInStep3Label(e.target.value)}
                    placeholder="Ready for Table"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                  <label className="mt-3 block text-xs font-semibold text-gray-700">Ready message</label>
                  <textarea
                    value={dineInReadyMessage}
                    onChange={(e) => setDineInReadyMessage(e.target.value)}
                    placeholder="Your order is ready — we’ll bring it to your table."
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    rows={3}
                  />
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-gray-200 p-3">
                <div className="text-xs font-extrabold uppercase tracking-wide text-gray-700">Pickup code helper</div>
                <label className="mt-3 block text-xs font-semibold text-gray-700">Text shown under the pickup code (to-go only)</label>
                <input
                  value={pickupCodeHelper}
                  onChange={(e) => setPickupCodeHelper(e.target.value)}
                  placeholder="Save this pickup code — you’ll need it when you arrive."
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-3">
              <button
                type="button"
                onClick={saveOrdering}
                disabled={orderingSaving}
                className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {orderingSaving ? 'Saving…' : 'Save ordering settings'}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
            Loading menu…
          </div>
        )}

        {!loading && menu && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-900">Categories</div>
              <button
                type="button"
                onClick={() => {
                  setMenu(prev => {
                    if (!prev) return prev
                    const next = deepClone(prev)
                    next.categories = next.categories || []
                    next.categories.push({ id: newId('c'), name: 'New Category', items: [] })
                    setDirty(true)
                    return next
                  })
                }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-bold hover:bg-gray-50"
              >
                + Add category
              </button>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <label className="block text-xs font-semibold text-gray-700">Search items</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or tags…"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            {(menu.categories || []).map((cat, catIdx) => (
              <div key={cat.id || catIdx} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-gray-700">Category name</label>
                    <input
                      value={cat.name || ''}
                      onChange={(e) => {
                        const v = e.target.value
                        setMenu(prev => {
                          if (!prev) return prev
                          const next = deepClone(prev)
                          next.categories[catIdx].name = v
                          setDirty(true)
                          return next
                        })
                      }}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMenu(prev => {
                          if (!prev) return prev
                          const next = deepClone(prev)
                          next.categories[catIdx].items = next.categories[catIdx].items || []
                          next.categories[catIdx].items.push({
                            id: newId('i'),
                            name: 'New Item',
                            description: '',
                            price: 0,
                            tags: [],
                          })
                          setDirty(true)
                          return next
                        })
                      }}
                      className="rounded-lg bg-black px-3 py-2 text-xs font-bold text-white hover:bg-gray-800"
                    >
                      + Add item
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenu(prev => {
                          if (!prev) return prev
                          const next = deepClone(prev)
                          next.categories.splice(catIdx, 1)
                          setDirty(true)
                          return next
                        })
                      }}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                    >
                      Delete category
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {(cat.items || [])
                    .filter((it) => {
                      const q = query.trim().toLowerCase()
                      if (!q) return true
                      return `${it.name || ''} ${(it.tags || []).join(' ')}`.toLowerCase().includes(q)
                    })
                    .map((it) => {
                      const itemIdx = (cat.items || []).findIndex((x) => x.id === it.id)
                      if (itemIdx < 0) return null
                      return (
                    <div key={it.id || itemIdx} className="rounded-lg border border-gray-200 p-3">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-gray-700">Item name</label>
                          <input
                            value={it.name || ''}
                            onChange={(e) => {
                              const v = e.target.value
                              setMenu(prev => {
                                if (!prev) return prev
                                const next = deepClone(prev)
                                next.categories[catIdx].items[itemIdx].name = v
                                setDirty(true)
                                return next
                              })
                            }}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="w-full sm:w-40">
                          <label className="block text-xs font-semibold text-gray-700">Price</label>
                          <input
                            type="number"
                            step="0.01"
                            value={typeof it.price === 'number' ? it.price : Number(it.price || 0)}
                            onChange={(e) => {
                              const v = Number(e.target.value)
                              setMenu(prev => {
                                if (!prev) return prev
                                const next = deepClone(prev)
                                next.categories[catIdx].items[itemIdx].price = Number.isFinite(v) ? v : 0
                                setDirty(true)
                                return next
                              })
                            }}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className="block text-xs font-semibold text-gray-700">Description</label>
                        <textarea
                          value={it.description || ''}
                          onChange={(e) => {
                            const v = e.target.value
                            setMenu(prev => {
                              if (!prev) return prev
                              const next = deepClone(prev)
                              next.categories[catIdx].items[itemIdx].description = v
                              setDirty(true)
                              return next
                            })
                          }}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          rows={2}
                        />
                      </div>

                      <div className="mt-3 flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-semibold text-gray-700">Tags (comma-separated)</label>
                          <input
                            value={(it.tags || []).join(', ')}
                            onChange={(e) => {
                              const v = e.target.value
                              setMenu(prev => {
                                if (!prev) return prev
                                const next = deepClone(prev)
                                next.categories[catIdx].items[itemIdx].tags = parseTags(v)
                              setDirty(true)
                                return next
                              })
                            }}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="w-full sm:w-40">
                          <label className="block text-xs font-semibold text-gray-700">Calories (optional)</label>
                          <input
                            type="number"
                            value={typeof it.calories === 'number' ? it.calories : ''}
                            onChange={(e) => {
                              const v = e.target.value === '' ? undefined : Number(e.target.value)
                              setMenu(prev => {
                                if (!prev) return prev
                                const next = deepClone(prev)
                                next.categories[catIdx].items[itemIdx].calories = (v !== undefined && Number.isFinite(v)) ? Math.round(v) : undefined
                              setDirty(true)
                                return next
                              })
                            }}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>

                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setMenu(prev => {
                              if (!prev) return prev
                              const next = deepClone(prev)
                              next.categories[catIdx].items.splice(itemIdx, 1)
                              setDirty(true)
                              return next
                            })
                          }}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                        >
                          Delete item
                        </button>
                      </div>
                    </div>
                      )
                    })}
                  {(cat.items || []).length === 0 && (
                    <div className="text-sm text-gray-500">
                      No items yet.
                    </div>
                  )}
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


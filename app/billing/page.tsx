'use client'

import { useEffect, useMemo, useState } from 'react'

export default function BillingPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tenant = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const sp = new URLSearchParams(window.location.search)
    return (sp.get('tenant') || '').trim()
  }, [])

  async function start() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant }),
      })
      const json = await res.json()
      if (!json?.ok || !json?.url) {
        setError(json?.error || 'Could not start checkout')
        return
      }
      window.location.href = json.url
    } catch (e) {
      setError((e as Error)?.message || 'Could not start checkout')
    } finally {
      setLoading(false)
    }
  }

  // Smooth flow: auto-start checkout for unpaid tenants (but still show a fallback button).
  useEffect(() => {
    if (!tenant) return
    if (error) return
    const t = setTimeout(() => { void start() }, 700)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant])

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Activate your menu</h1>
      <p className="mt-3 text-neutral-700">Complete checkout to unlock your live QR + link.</p>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="text-sm text-neutral-600">Tenant</div>
        <div className="mt-1 font-mono text-sm">{tenant || '(missing tenant in URL)'}</div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="font-medium">One-time onboarding + monthly service</div>
        <div className="mt-1 text-sm text-neutral-600">This will open a secure Stripe checkout.</div>
        <button
          disabled={!tenant || loading}
          onClick={() => { void start() }}
          className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-neutral-900 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Starting…' : 'Continue to Checkout'}
        </button>
      </div>
    </main>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'

export default function BillingPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tenant = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const sp = new URLSearchParams(window.location.search)
    return (sp.get('tenant') || '').trim()
  }, [])

  async function start() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant }),
      })
      const json = await res.json()
      if (!json?.ok || !json?.url) {
        setError(json?.error || 'Could not start checkout')
        return
      }
      window.location.href = json.url
    } catch (e) {
      setError((e as Error)?.message || 'Could not start checkout')
    } finally {
      setLoading(false)
    }
  }

  // Smooth flow: auto-start checkout for unpaid tenants (but still show a fallback button).
  useEffect(() => {
    if (!tenant) return
    // Don't auto-loop if there is an error.
    if (error) return
    const t = setTimeout(() => { void start() }, 700)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant])

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Activate your menu</h1>
      <p className="mt-3 text-neutral-700">Complete checkout to unlock your live QR + link.</p>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="text-sm text-neutral-600">Tenant</div>
        <div className="mt-1 font-mono text-sm">{tenant || '(missing tenant in URL)'}</div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="font-medium">One-time onboarding + monthly service</div>
        <div className="mt-1 text-sm text-neutral-600">This will open a secure Stripe checkout.</div>
        <button
          disabled={!tenant || loading}
          onClick={() => { void start() }}
          className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-neutral-900 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Starting…' : 'Continue to Checkout'}
        </button>
      </div>
    </main>
  )
}



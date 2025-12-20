'use client'

import { useMemo, useState } from 'react'

type PlanKey = 'basic' | 'premium' | 'enterprise'

export default function BillingPage() {
  const [loading, setLoading] = useState<PlanKey | null>(null)
  const [error, setError] = useState<string | null>(null)

  const tenant = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const sp = new URLSearchParams(window.location.search)
    return (sp.get('tenant') || '').trim()
  }, [])

  async function start(plan: PlanKey) {
    setError(null)
    setLoading(plan)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant, plan }),
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
      setLoading(null)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Activate your monthly plan</h1>
      <p className="mt-3 text-neutral-700">
        This page is intended for onboarded restaurants. If you don’t have a tenant slug yet, book a demo and we’ll set it up for you.
      </p>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="text-sm text-neutral-600">Tenant</div>
        <div className="mt-1 font-mono text-sm">{tenant || '(missing tenant in URL)'}</div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {([
          { key: 'basic', title: 'Basic', desc: 'Core menu + assistant' },
          { key: 'premium', title: 'Premium', desc: 'More customization' },
          { key: 'enterprise', title: 'Enterprise', desc: 'Multi-location / custom' },
        ] as const).map((p) => (
          <div key={p.key} className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="font-medium">{p.title}</div>
            <div className="mt-1 text-sm text-neutral-600">{p.desc}</div>
            <button
              disabled={!tenant || !!loading}
              onClick={() => start(p.key)}
              className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-neutral-900 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading === p.key ? 'Starting…' : 'Checkout'}
            </button>
          </div>
        ))}
      </div>
    </main>
  )
}



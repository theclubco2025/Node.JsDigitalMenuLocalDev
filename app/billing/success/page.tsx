'use client'

import { useMemo } from 'react'

export default function BillingSuccessPage() {
  const tenant = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const sp = new URLSearchParams(window.location.search)
    return (sp.get('tenant') || '').trim()
  }, [])

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">You’re all set</h1>
      <p className="mt-3 text-neutral-700">
        Payment succeeded. Your tenant should now be active.
      </p>
      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="text-sm text-neutral-600">Tenant</div>
        <div className="mt-1 font-mono text-sm">{tenant || '(unknown)'}</div>
      </div>
      <div className="mt-6 flex gap-3">
        <a
          className="inline-flex items-center rounded-2xl bg-neutral-900 px-5 py-3 text-sm text-white"
          href={tenant ? `/menu?tenant=${encodeURIComponent(tenant)}` : '/menu'}
        >
          View menu
        </a>
        <a className="inline-flex items-center rounded-2xl border border-neutral-300 px-5 py-3 text-sm" href="/">
          Back to home
        </a>
      </div>
    </main>
  )
}



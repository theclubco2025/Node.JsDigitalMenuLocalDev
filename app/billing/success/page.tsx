'use client'

import { useEffect, useMemo, useState } from 'react'

export default function BillingSuccessPage() {
  const tenant = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const sp = new URLSearchParams(window.location.search)
    return (sp.get('tenant') || '').trim()
  }, [])

  const sessionId = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const sp = new URLSearchParams(window.location.search)
    return (sp.get('session_id') || '').trim()
  }, [])

  const mock = useMemo(() => {
    if (typeof window === 'undefined') return false
    const sp = new URLSearchParams(window.location.search)
    return (sp.get('mock') || '').trim() === '1'
  }, [])

  const [active, setActive] = useState(false)
  const [status, setStatus] = useState<string>('')
  const [confirmTried, setConfirmTried] = useState(false)

  const siteUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const host = window.location.hostname.toLowerCase()
    // Canonicalize production QR/link to tccmenus.com so the QR "never changes" for real clients.
    const isProd = host === 'tccmenus.com' || host.endsWith('.tccmenus.com')
    return isProd ? 'https://tccmenus.com' : window.location.origin
  }, [])

  const liveUrl = tenant ? `${siteUrl.replace(/\/$/, '')}/t/${encodeURIComponent(tenant)}` : ''
  const qrUrl = liveUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=${encodeURIComponent(liveUrl)}`
    : ''

  useEffect(() => {
    if (!tenant) return
    // Preview-only: allow viewing the "paid" page without Stripe for demos/screenshots.
    // We treat *.vercel.app as preview/test surface.
    if (mock && typeof window !== 'undefined' && window.location.hostname.toLowerCase().includes('vercel.app')) {
      setStatus('ACTIVE (MOCK)')
      setActive(true)
      return
    }
    let cancelled = false
    async function poll() {
      try {
        const res = await fetch(`/api/tenant/status?tenant=${encodeURIComponent(tenant)}`, { cache: 'no-store' })
        const json = await res.json().catch(() => null)
        if (!json || cancelled) return
        setStatus(String(json.status || ''))
        setActive(Boolean(json.active))
      } catch {
        // ignore
      }
    }
    void poll()
    const t = setInterval(poll, 1500)
    return () => {
      cancelled = true
      clearInterval(t)
    }
  }, [tenant])

  // If webhook isn't configured yet, we can still activate by confirming the checkout session_id server-side.
  useEffect(() => {
    if (!tenant || !sessionId) return
    if (active) return
    if (confirmTried) return
    setConfirmTried(true)
    ;(async () => {
      try {
        await fetch('/api/billing/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenant, session_id: sessionId }),
        })
      } catch {
        // ignore
      }
    })()
  }, [tenant, sessionId, active, confirmTried])

  const subtitle = active
    ? 'Your menu is live. Save your QR and share your link.'
    : 'We’re activating your menu now. This usually takes a few seconds.'

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-neutral-50 to-white">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <header className="flex items-center justify-between gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/tcc-logo-horizontal.png" alt="TCC Solutions" className="h-8 w-auto" />
          <div className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-600">
            <span className="font-mono">{status || (active ? 'ACTIVE' : 'PENDING')}</span>
          </div>
        </header>

        <div className="mt-10">
          <h1 className="text-4xl font-semibold tracking-tight text-neutral-900">Thank you — welcome to the team</h1>
          <p className="mt-3 max-w-2xl text-neutral-700">{subtitle}</p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-neutral-900">Your live link</div>
            <div className="mt-2 text-sm text-neutral-600">Share this with customers.</div>

            <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="text-xs text-neutral-500">Tenant</div>
              <div className="mt-1 font-mono text-sm text-neutral-900">{tenant || '(unknown)'}</div>
              {tenant ? (
                <a
                  className="mt-3 block break-all font-mono text-sm text-blue-700 underline"
                  href={`/t/${encodeURIComponent(tenant)}`}
                >
                  {liveUrl}
                </a>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-medium ${
                  active && tenant ? 'bg-neutral-900 text-white hover:bg-neutral-800' : 'bg-neutral-200 text-neutral-500'
                }`}
                href={active && tenant ? `/t/${encodeURIComponent(tenant)}` : '#'}
                aria-disabled={!(active && tenant)}
              >
                Open your menu
              </a>
              <a
                className="inline-flex items-center justify-center rounded-2xl border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
                href="/"
              >
                Home
              </a>
            </div>
          </section>

          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium text-neutral-900">Your QR code</div>
            <div className="mt-2 text-sm text-neutral-600">This QR points to your live menu link.</div>

            <div className="mt-4 flex items-start gap-4">
              <div className="grid h-44 w-44 place-items-center rounded-2xl border border-neutral-200 bg-white">
                {active && tenant && qrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrUrl} alt="Menu QR code" className="h-40 w-40 rounded-xl" />
                ) : (
                  <div className="text-xs text-neutral-500">Activating…</div>
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm text-neutral-700">
                  {active && tenant
                    ? 'Download the QR image and add it to tables, takeout bags, posters, or receipts.'
                    : 'Once activation completes, your QR will appear here.'}
                </div>
                <a
                  className={`mt-3 inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-medium ${
                    active && tenant && qrUrl
                      ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                      : 'bg-neutral-200 text-neutral-500'
                  }`}
                  href={active && tenant && qrUrl ? qrUrl : '#'}
                  target={active && tenant && qrUrl ? '_blank' : undefined}
                  rel={active && tenant && qrUrl ? 'noreferrer' : undefined}
                  aria-disabled={!(active && tenant && qrUrl)}
                >
                  Download QR
                </a>
                <div className="mt-2 text-xs text-neutral-500">Tip: the QR only changes if you change the slug.</div>
              </div>
            </div>
          </section>
        </div>

        {!active ? (
          <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            Activation in progress… keep this page open.
          </div>
        ) : null}
      </div>
    </main>
  )
}



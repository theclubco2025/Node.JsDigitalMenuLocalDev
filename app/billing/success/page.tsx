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

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Payment received — welcome to the team</h1>
      <p className="mt-3 text-neutral-700">We’re activating your menu now. Once active, you can download your QR.</p>
      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="text-sm text-neutral-600">Tenant</div>
        <div className="mt-1 font-mono text-sm">{tenant || '(unknown)'}</div>
        <div className="mt-2 text-xs text-neutral-500">
          Status: <span className="font-mono">{status || (active ? 'ACTIVE' : 'PENDING')}</span>
        </div>
      </div>

      {active && tenant ? (
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="text-sm font-medium">Your live link</div>
          <a className="mt-2 block break-all font-mono text-sm text-blue-700 underline" href={`/t/${encodeURIComponent(tenant)}`}>
            {liveUrl}
          </a>

          <div className="mt-5 text-sm font-medium">Your QR code</div>
          <div className="mt-3 flex items-start gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="Menu QR code" className="h-44 w-44 rounded-xl border border-neutral-200 bg-white" />
            <div className="text-sm text-neutral-700">
              <div>This QR points to your live menu link above (and won’t change unless you change the slug).</div>
              <a
                className="mt-3 inline-flex items-center rounded-2xl bg-neutral-900 px-5 py-3 text-sm text-white"
                href={qrUrl}
                target="_blank"
                rel="noreferrer"
              >
                Download / Open QR
              </a>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          We haven’t unlocked your tenant yet. This usually takes a few seconds after checkout. Please keep this page open.
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <a className="inline-flex items-center rounded-2xl border border-neutral-300 px-5 py-3 text-sm" href="/">
          Back to home
        </a>
      </div>
    </main>
  )
}



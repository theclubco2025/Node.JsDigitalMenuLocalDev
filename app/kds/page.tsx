"use client"

import { FormEvent, useEffect, useState } from 'react'
import Image from 'next/image'

type ResolveResponse =
  | { ok: true; tenant: { slug: string; name: string } }
  | { ok: false; error: string }

export default function KdsLandingPage() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    try {
      const last = localStorage.getItem('kds_last_pin') || ''
      if (last) setPin(last)
    } catch {
      // ignore
    }
  }, [])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const p = pin.trim()
    if (!p) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/kds/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: p }),
      })
      const json = (await res.json().catch(() => null)) as ResolveResponse | null
      if (!json || json.ok !== true) {
        const msg = json && 'error' in json ? json.error : `Invalid PIN (${res.status})`
        setError(String(msg))
        return
      }

      const tenant = json.tenant.slug
      try {
        localStorage.setItem('kds_last_pin', p)
        localStorage.setItem(`kitchen_pin:${tenant}`, p)
        localStorage.setItem('kitchen_last_tenant', tenant)
      } catch {
        // ignore
      }

      window.location.href = `/kitchen?tenant=${encodeURIComponent(tenant)}`
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen text-white" style={{ background: 'var(--bg, #070707)', color: 'var(--text, #f8fafc)' }}>
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="flex justify-center">
          <div className="mb-6 h-14 w-14 rounded-3xl bg-white/5 border border-white/10 grid place-items-center overflow-hidden">
            <Image
              src="/assets/tcc-stamp.png"
              alt="TCC Solutions"
              width={56}
              height={56}
              className="h-12 w-12 object-contain"
              priority
            />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold">Kitchen Display</h1>
        <p className="mt-2 text-sm text-neutral-300">Enter your kitchen PIN to open your live KDS.</p>

        <form onSubmit={onSubmit} className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
          <label className="text-sm font-semibold">Kitchen PIN</label>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter PIN"
            className="mt-2 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-3 text-base outline-none"
          />

          {error && (
            <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || pin.trim().length === 0}
            className="mt-4 w-full rounded-xl bg-white text-black px-4 py-3 text-sm font-extrabold hover:bg-neutral-200 disabled:opacity-60"
          >
            {loading ? 'Opening…' : 'Open KDS'}
          </button>
        </form>
      </div>
    </div>
  )
}


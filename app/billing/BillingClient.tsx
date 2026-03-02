'use client'

import { useMemo, useState } from 'react'

const CHECKBOX_TEXT = 'I have read and agree to the Terms of Service and Privacy Policy.'

export default function BillingClient() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')

  const tenant = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const sp = new URLSearchParams(window.location.search)
    return (sp.get('tenant') || '').trim()
  }, [])

  async function logTermsAcceptance() {
    try {
      await fetch('/api/terms/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: name.trim() || undefined,
          tenantSlug: tenant,
          documentType: 'both',
          checkboxText: CHECKBOX_TEXT,
        }),
      })
    } catch {
      // Log failure is non-blocking
    }
  }

  async function start() {
    if (!termsAccepted) {
      setError('Please accept the Terms of Service and Privacy Policy to continue.')
      return
    }
    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.')
      return
    }

    setError(null)
    setLoading(true)

    // Log terms acceptance before starting checkout
    await logTermsAcceptance()

    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant, email: email.trim() }),
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

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Activate your menu</h1>
      <p className="mt-3 text-neutral-700">Complete checkout to unlock your live QR + link.</p>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="text-sm text-neutral-600">Tenant</div>
        <div className="mt-1 font-mono text-sm">{tenant || '(missing tenant in URL)'}</div>
      </div>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="font-medium">Account Information</div>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Smith"
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@restaurant.com"
              required
              className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
            <p className="mt-1 text-xs text-neutral-500">
              We&apos;ll send your receipt and account details to this email.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
        <div className="font-medium">One-time onboarding + monthly service</div>
        <div className="mt-1 text-sm text-neutral-600">This will open a secure Stripe checkout.</div>

        <div className="mt-4 flex items-start gap-3">
          <input
            id="terms"
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => {
              setTermsAccepted(e.target.checked)
              if (e.target.checked) setError(null)
            }}
            className="mt-0.5 h-5 w-5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500"
          />
          <label htmlFor="terms" className="text-sm text-neutral-700">
            I have read and agree to the{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-800">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 underline underline-offset-2 hover:text-blue-800">
              Privacy Policy
            </a>
            .
          </label>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <button
          disabled={!tenant || loading}
          onClick={() => { void start() }}
          className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Starting…' : 'Continue to Checkout'}
        </button>

        <p className="mt-3 text-center text-xs text-neutral-500">
          By continuing, your acceptance of the Terms will be logged with your email and IP address.
        </p>
      </div>

      <div className="mt-8 text-center">
        <a href="/" className="text-sm text-neutral-600 underline underline-offset-4 hover:text-neutral-900">
          Back to home
        </a>
      </div>
    </main>
  )
}

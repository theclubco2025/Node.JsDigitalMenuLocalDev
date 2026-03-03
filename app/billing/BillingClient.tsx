/* eslint-disable @next/next/no-img-element */
'use client'

import { useMemo, useState } from 'react'

const CHECKBOX_TEXT = 'I have read and agree to the Terms of Service and Privacy Policy.'

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    setup: 299,
    monthly: 49,
    description: 'Perfect for small cafes and food trucks',
    features: [
      'QR menu for up to 50 items',
      'Basic branding (logo + colors)',
      'Email support',
      'Self-service menu updates',
    ],
    popular: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    setup: 499,
    monthly: 99,
    description: 'Complete solution for full-service restaurants',
    features: [
      'Unlimited menu items',
      'Full branding customization',
      'AI menu assistant',
      'Online ordering + payments',
      'Kitchen display system',
      'Priority phone support',
      'Analytics dashboard',
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    setup: 799,
    monthly: 149,
    description: 'For multi-location restaurants and chains',
    features: [
      'Everything in Professional',
      'Multiple locations',
      'POS integration (Clover, Square)',
      'Dedicated account manager',
      'Custom training session',
    ],
    popular: false,
  },
]

export default function BillingClient() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('professional')

  const tenant = useMemo(() => {
    if (typeof window === 'undefined') return ''
    const sp = new URLSearchParams(window.location.search)
    return (sp.get('tenant') || '').trim()
  }, [])

  const currentPlan = PLANS.find((p) => p.id === selectedPlan) || PLANS[1]

  async function logTermsAcceptance() {
    try {
      await fetch('/api/terms/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: name.trim() || undefined,
          tenantSlug: tenant || restaurantName.toLowerCase().replace(/\s+/g, '-'),
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

    await logTermsAcceptance()

    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant: tenant || restaurantName.toLowerCase().replace(/\s+/g, '-'),
          email: email.trim(),
          plan: selectedPlan,
        }),
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
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <a href="/">
            <img src="/assets/tcc-logo-horizontal.png" alt="TCC Menus" className="h-8" />
          </a>
          <a href="/" className="text-sm text-neutral-600 hover:text-neutral-900">
            ← Back to home
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 md:text-5xl">
            Get Started with TCC Menus
          </h1>
          <p className="mt-4 text-xl text-neutral-600 max-w-2xl mx-auto">
            Choose your plan and we&apos;ll have your digital menu ready in 24 hours.
          </p>
        </div>

        {/* Plan Selection */}
        <div className="grid gap-6 md:grid-cols-3 mb-12">
          {PLANS.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative rounded-2xl p-6 text-left transition-all ${
                selectedPlan === plan.id
                  ? 'border-2 border-emerald-600 bg-white shadow-lg ring-4 ring-emerald-100'
                  : 'border border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-md'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-900">{plan.name}</h3>
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                  selectedPlan === plan.id ? 'border-emerald-600 bg-emerald-600' : 'border-neutral-300'
                }`}>
                  {selectedPlan === plan.id && (
                    <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="mb-2">
                <span className="text-3xl font-bold text-neutral-900">${plan.setup}</span>
                <span className="text-neutral-600"> setup</span>
              </div>
              <div className="mb-4 text-neutral-600">
                + <span className="font-semibold">${plan.monthly}</span>/month
              </div>
              <p className="text-sm text-neutral-500 mb-4">{plan.description}</p>
              <ul className="space-y-2">
                {plan.features.slice(0, 4).map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-neutral-700">
                    <svg className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
                {plan.features.length > 4 && (
                  <li className="text-sm text-emerald-600 font-medium">
                    + {plan.features.length - 4} more features
                  </li>
                )}
              </ul>
            </button>
          ))}
        </div>

        {/* Checkout Form */}
        <div className="max-w-2xl mx-auto">
          <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-xl">
            {/* Order Summary */}
            <div className="mb-8 rounded-2xl bg-emerald-50 p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-neutral-600">{currentPlan.name} Plan - Setup</span>
                  <span className="font-semibold">${currentPlan.setup}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Monthly subscription (first month)</span>
                  <span className="font-semibold">${currentPlan.monthly}</span>
                </div>
                <div className="border-t border-emerald-200 pt-3 flex justify-between">
                  <span className="font-semibold text-neutral-900">Due today</span>
                  <span className="text-xl font-bold text-emerald-600">${currentPlan.setup + currentPlan.monthly}</span>
                </div>
              </div>
              <p className="mt-3 text-sm text-neutral-500">
                Then ${currentPlan.monthly}/month. Cancel anytime.
              </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {!tenant && (
                <div>
                  <label htmlFor="restaurant" className="block text-sm font-semibold text-neutral-900 mb-2">
                    Restaurant Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="restaurant"
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    placeholder="e.g., Joe's Pizza"
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-neutral-900 mb-2">
                    Your Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Smith"
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-neutral-900 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@restaurant.com"
                    required
                    className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-base outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              {tenant && (
                <div className="rounded-xl bg-neutral-100 p-4">
                  <div className="text-sm text-neutral-600">Setting up menu for</div>
                  <div className="font-semibold text-neutral-900">{tenant}</div>
                </div>
              )}

              {/* Terms */}
              <div className="flex items-start gap-3 pt-2">
                <input
                  id="terms"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked)
                    if (e.target.checked) setError(null)
                  }}
                  className="mt-1 h-5 w-5 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="terms" className="text-sm text-neutral-700">
                  I have read and agree to the{' '}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-emerald-600 underline underline-offset-2 hover:text-emerald-800">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-medium text-emerald-600 underline underline-offset-2 hover:text-emerald-800">
                    Privacy Policy
                  </a>
                </label>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                disabled={loading}
                onClick={() => { void start() }}
                className="w-full rounded-full bg-emerald-600 px-6 py-4 text-lg font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Continue to Secure Checkout
                  </>
                )}
              </button>

              <p className="text-center text-xs text-neutral-500">
                Secure payment powered by Stripe. Your acceptance of the Terms will be logged for compliance.
              </p>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-neutral-500">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>256-bit SSL</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span>30-day money back</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

"use client"

import { FormEvent, useState } from 'react'
import { signIn } from 'next-auth/react'

type Step = 'form' | 'success' | 'error'

export default function DemoAdminSetupPage() {
  const [accessCode, setAccessCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<Step>('form')
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords must match')
      return
    }
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/demo/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant: 'demo-draft',
          email,
          password,
          accessCode,
          displayName,
        }),
      })

      if (!res.ok) {
        const detail = await res.json().catch(() => ({}))
        throw new Error(detail?.error || 'Unable to save credentials')
      }

      setStep('success')

      await signIn('credentials', {
        redirect: true,
        email,
        password,
        tenant: 'demo',
        callbackUrl: '/admin/demo',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-xl w-full bg-slate-900/70 border border-slate-700 rounded-2xl shadow-xl backdrop-blur px-8 py-10 space-y-8">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-emerald-400 mb-2">Demo Admin</p>
          <h1 className="text-3xl font-semibold">Secure Your Menu Console</h1>
          <p className="text-sm text-slate-300 mt-3">
            Use the access code provided by your TCC onboarding specialist to claim your admin login. These credentials control your live menu, so please store them securely.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200" htmlFor="accessCode">Access code</label>
            <input
              id="accessCode"
              type="text"
              required
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring focus:ring-emerald-500/30"
              placeholder="Enter provided code"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200" htmlFor="name">Admin display name</label>
            <input
              id="name"
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring focus:ring-emerald-500/30"
              placeholder="e.g. Indie Eats Team"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-200" htmlFor="email">Admin email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring focus:ring-emerald-500/30"
              placeholder="you@restaurant.com"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="password">New password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring focus:ring-emerald-500/30"
                placeholder="Minimum 8 characters"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="confirm">Confirm password</label>
              <input
                id="confirm"
                type="password"
                required
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring focus:ring-emerald-500/30"
                placeholder="Repeat password"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-400 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold tracking-wide text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Saving credentials…' : 'Save credentials & launch admin'}
          </button>

          {step === 'success' && !loading && (
            <p className="text-sm text-emerald-300">
              Credentials saved! Redirecting you to the demo admin console…
            </p>
          )}
        </form>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-5 py-4 text-xs leading-5 text-slate-300">
          <p className="font-semibold text-slate-100">What happens next?</p>
          <ul className="mt-3 space-y-2 list-disc list-inside">
            <li>You&apos;ll be redirected to the secure demo admin console.</li>
            <li>Review draft menu changes and stage updates in real time.</li>
            <li>When you approve, push the draft to live with one click.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}



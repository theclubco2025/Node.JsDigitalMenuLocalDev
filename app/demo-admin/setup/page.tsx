"use client"

import { FormEvent, useState } from 'react'
import { signIn } from 'next-auth/react'

type Step = 'form' | 'success' | 'error'

export default function DemoAdminSetupPage() {
  const [accessCode, setAccessCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<Step>('form')
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/demo/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant: 'demo-draft',
          accessCode,
          displayName,
        }),
      })

      if (!res.ok) {
        const detail = await res.json().catch(() => ({}))
        throw new Error(detail?.error || 'Unable to unlock admin console')
      }

      const payload = await res.json().catch(() => ({}))
      const email = typeof payload?.email === 'string' ? payload.email : (process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL || 'demo-admin@demo.local')
      const tenantSlug = typeof payload?.tenant === 'string' ? payload.tenant : 'demo-draft'

      setStep('success')

      const signInResult = await signIn('credentials', {
        redirect: false,
        email,
        password: accessCode,
        tenant: tenantSlug,
        callbackUrl: '/admin/demo',
      })

      if (signInResult?.error) {
        throw new Error('Automatic sign-in failed. Please try again or contact support.')
      }

      const target = signInResult?.url || '/admin/demo'
      window.location.href = target
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStep('error')
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
            Use the access code provided by your TCC onboarding specialist to unlock the demo admin console. The code doubles as your password, so keep it private.
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
              placeholder="Optional – shown in the header"
            />
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
            {loading ? 'Unlocking console…' : 'Unlock admin console'}
          </button>

          {step === 'success' && !loading && (
            <p className="text-sm text-emerald-300">
              Access granted! Redirecting you to the demo admin console…
            </p>
          )}
        </form>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-5 py-4 text-xs leading-5 text-slate-300">
          <p className="font-semibold text-slate-100">What happens next?</p>
          <ul className="mt-3 space-y-2 list-disc list-inside">
            <li>The access code becomes your password for this session.</li>
            <li>After unlock, you&apos;ll land in the demo admin console ready to edit.</li>
            <li>Use the Promote card to mirror draft changes onto the live demo.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}



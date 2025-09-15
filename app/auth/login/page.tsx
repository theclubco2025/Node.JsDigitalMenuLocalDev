
"use client"

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/admin'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Auth temporarily disabled in this demo build to avoid dependency issues
      setError('Login is disabled in this demo build.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Digital Menu SaaS</h2>
          <p className="mt-2 text-sm text-gray-600">Admin Dashboard Login</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Demo Accounts</span>
              </div>
            </div>

            {process.env.NODE_ENV !== 'production' && (
              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/auth/demo-login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'super' })
                      })
                      if (!res.ok) throw new Error('Demo login failed')
                      window.location.href = '/admin'
                    } catch (e:any) {
                      setError(e.message || 'Demo login failed')
                    }
                  }}
                  className="w-full text-left px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">Login as Demo Super Admin</div>
                  <div className="text-sm text-gray-500">Dev-only shortcut using server env</div>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/auth/demo-login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'owner' })
                      })
                      if (!res.ok) throw new Error('Demo login failed')
                      window.location.href = '/admin'
                    } catch (e:any) {
                      setError(e.message || 'Demo login failed')
                    }
                  }}
                  className="w-full text-left px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">Login as Demo Owner</div>
                  <div className="text-sm text-gray-500">Dev-only shortcut using server env</div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
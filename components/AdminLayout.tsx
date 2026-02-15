
"use client"

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

interface AdminLayoutProps {
  children: React.ReactNode
  requiredRole?: 'SUPER_ADMIN' | 'RESTAURANT_OWNER'
}

export default function AdminLayout({ children, requiredRole }: AdminLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  const role = (session as unknown as { role?: string } | null)?.role
    || (session?.user as unknown as { role?: string } | undefined)?.role
    || null

  useEffect(() => {
    if (status === 'loading') return // Still loading

    if (!session) {
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(pathname)}`)
      return
    }

    // Role-based access control
    if (requiredRole && role !== requiredRole) {
      // Super admin can access everything
      if (role === 'SUPER_ADMIN') {
        return
      }

      // Redirect unauthorized users (keep this stable; do not rely on pages that may not exist)
      router.push('/auth/login')
      return
    }

    // No automatic role redirects; pages decide their own navigation.
  }, [session, status, router, pathname, requiredRole, role])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Access Denied</h2>
          <p className="text-gray-600 mt-2">You need to be logged in to access this page.</p>
        </div>
      </div>
    )
  }

  // Role check failed
  if (requiredRole && role !== requiredRole && role !== 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Access Denied</h2>
          <p className="text-gray-600 mt-2">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header with logout */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-gray-900">
                {role === 'SUPER_ADMIN' ? 'Super Admin' : 'Restaurant Admin'}
              </h1>
              <nav className="hidden sm:flex items-center gap-2 text-sm">
                <a
                  href="/admin/menu"
                  className="rounded-md px-2 py-1 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                >
                  Menu
                </a>
                <a
                  href="/admin/orders"
                  className="rounded-md px-2 py-1 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                >
                  Orders
                </a>
              </nav>
              <span className="text-sm text-gray-500">
                {session.user?.name} ({session.user?.email})
              </span>
            </div>
            <button
              onClick={() => {
                import('next-auth/react').then(({ signOut }) => signOut({ callbackUrl: '/auth/login' }))
              }}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
      <main className="min-h-[calc(100vh-52px)]">
        {children}
      </main>
    </div>
  )
}
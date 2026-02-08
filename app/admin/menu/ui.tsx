"use client"

import { useMemo } from 'react'
import AdminLayout from '@/components/AdminLayout'

export default function AdminMenuClient({ tenant }: { tenant: string }) {
  const editorUrl = useMemo(() => `/menu?tenant=${encodeURIComponent(tenant)}&admin=1`, [tenant])

  return (
    <AdminLayout requiredRole="RESTAURANT_OWNER">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900">Menu Editor</h2>
        <p className="mt-2 text-gray-600">
          Tenant: <span className="font-mono">{tenant}</span>
        </p>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-sm text-gray-700">
            Click below to edit items. Use <span className="font-semibold">Save All</span> to publish changes instantly (no redeploy).
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={editorUrl}
              className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-bold text-white hover:bg-gray-800"
            >
              Open Menu Editor
            </a>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}


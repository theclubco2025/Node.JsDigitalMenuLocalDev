"use client"

import { useEffect, useState } from 'react'

export default function TenantAdminPage() {
  const [tenants, setTenants] = useState<string[]>([])
  const [tenantId, setTenantId] = useState('')
  const [jsonText, setJsonText] = useState('')
  const [status, setStatus] = useState<string>('')
  const [theme, setTheme] = useState<{ primary: string; accent: string; radius: string }>({ primary: '', accent: '', radius: '' })

  useEffect(() => {
    const getTenants = async () => {
      try {
        const res = await fetch('/api/tenant/list')
        const data = await res.json()
        if (Array.isArray(data.tenants)) setTenants(data.tenants)
        else setTenants(['demo'])
      } catch {
        setTenants(['demo'])
      }
    }
    getTenants()
  }, [])

  const handleImport = async () => {
    setStatus('')
    try {
      const data = JSON.parse(jsonText)
      const tenant = tenantId.trim() || 'demo'
      const res = await fetch('/api/tenant/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant, menu: data })
      })
      if (!res.ok) throw new Error('Failed to import')
      setStatus('Imported successfully')
    } catch (e: any) {
      setStatus(`Error: ${e.message || 'Invalid JSON'}`)
    }
  }

  const handleThemeSave = async () => {
    setStatus('')
    try {
      const tenant = tenantId.trim() || 'demo'
      const res = await fetch(`/api/theme?tenant=${encodeURIComponent(tenant)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(theme)
      })
      if (!res.ok) throw new Error('Failed to save theme (requires DATABASE_URL)')
      setStatus('Theme saved')
    } catch (e: any) {
      setStatus(`Error: ${e.message || 'Failed to save theme'}`)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Tenant Admin</h1>
      <div className="mb-6">
        <h2 className="font-semibold mb-2">Known Tenants</h2>
        <div className="flex gap-2 flex-wrap">
          {tenants.map(t => (
            <span key={t} className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">{t}</span>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <input
          className="w-full border border-gray-300 rounded-lg p-2"
          placeholder="New tenant id (e.g., acme)"
          value={tenantId}
          onChange={e => setTenantId(e.target.value)}
        />
        <textarea
          className="w-full h-64 border border-gray-300 rounded-lg p-2 font-mono text-sm"
          placeholder='Paste menu JSON here'
          value={jsonText}
          onChange={e => setJsonText(e.target.value)}
        />
        <button
          onClick={handleImport}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Import Menu JSON
        </button>
        <div className="pt-6">
          <h2 className="font-semibold mb-2">Theme (DB-backed)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              className="w-full border border-gray-300 rounded-lg p-2"
              placeholder="#111827"
              value={theme.primary}
              onChange={e => setTheme(t => ({ ...t, primary: e.target.value }))}
            />
            <input
              className="w-full border border-gray-300 rounded-lg p-2"
              placeholder="#2563eb"
              value={theme.accent}
              onChange={e => setTheme(t => ({ ...t, accent: e.target.value }))}
            />
            <input
              className="w-full border border-gray-300 rounded-lg p-2"
              placeholder="12px"
              value={theme.radius}
              onChange={e => setTheme(t => ({ ...t, radius: e.target.value }))}
            />
          </div>
          <button onClick={handleThemeSave} className="mt-3 bg-black text-white px-4 py-2 rounded">Save Theme</button>
        </div>
        {status && <div className="text-sm text-gray-600">{status}</div>}
      </div>
    </div>
  )
}



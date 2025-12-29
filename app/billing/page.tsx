import { redirect } from 'next/navigation'

type SearchParams = Record<string, string | string[] | undefined>

function first(v: string | string[] | undefined): string {
  if (!v) return ''
  return Array.isArray(v) ? (v[0] || '') : v
}

export default function BillingPage({ searchParams }: { searchParams: SearchParams }) {
  // TEMP testing bypass: when enabled, skip activation and show the menu directly.
  // Reuse existing flag the user already set in Vercel env vars.
  const bypass = process.env.NEXT_PUBLIC_DISABLE_PREVIEW_TENANT_FORCE === '1'

  const tenantRaw = first(searchParams?.tenant).trim()
  const tenant = tenantRaw.toLowerCase()

  if (bypass) {
    redirect(tenant ? `/menu?tenant=${encodeURIComponent(tenant)}` : '/menu')
  }

  // If bypass is off, keep this page minimal (activation UI may exist on other branches).
  redirect(tenant ? `/menu?tenant=${encodeURIComponent(tenant)}` : '/menu')
}



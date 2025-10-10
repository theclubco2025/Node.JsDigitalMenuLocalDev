import { redirect } from 'next/navigation'

export default function TenantAdminPage({ searchParams }: { searchParams?: { tenant?: string; token?: string } }) {
  const tenant = (searchParams?.tenant || process.env.NEXT_PUBLIC_DEFAULT_TENANT || 'demo').trim()
  const token = searchParams?.token?.trim()
  const target = `/menu?tenant=${encodeURIComponent(tenant)}&admin=1${token ? `&token=${encodeURIComponent(token)}` : ''}`
  redirect(target)
}

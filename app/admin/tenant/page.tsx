import { redirect } from 'next/navigation'

export default function TenantAdminPage() {
  // Redirect admin users to the customer view with inline edit mode enabled
  const defaultTenant = process.env.NEXT_PUBLIC_DEFAULT_TENANT || 'demo'
  redirect(`/menu?tenant=${encodeURIComponent(defaultTenant)}&admin=1`)
}

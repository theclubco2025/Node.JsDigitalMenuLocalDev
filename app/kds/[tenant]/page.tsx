import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function KdsTenantPage({ params }: { params: { tenant: string } }) {
  const tenant = (params?.tenant || '').trim().toLowerCase()
  if (!tenant) redirect('/kitchen')
  // Friendly path alias
  redirect(`/kitchen?tenant=${encodeURIComponent(tenant)}`)
}


import { redirect } from 'next/navigation'
import BillingClient from './BillingClient'

type Props = {
  searchParams?: Record<string, string | string[] | undefined>
}

function firstString(v: string | string[] | undefined): string | undefined {
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return v[0]
  return undefined
}

export default async function BillingPage({ searchParams }: Props) {
  const normalizedTenant = (firstString(searchParams?.tenant) || '').trim().toLowerCase()

  // Tenant-scoped hard bypass: never show billing for these tenants.
  if (['buttercuppantry', 'southforkgrille', 'south-fork-grille', 'independent'].includes(normalizedTenant)) {
    redirect(`/${encodeURIComponent(normalizedTenant || 'demo')}`)
  }

  return <BillingClient />
}



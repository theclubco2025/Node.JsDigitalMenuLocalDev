import AdminMenuClient from './ui'

export const dynamic = 'force-dynamic'

export default function AdminMenuPage({ searchParams }: { searchParams?: { tenant?: string } }) {
  const tenant = (searchParams?.tenant || 'independentbarandgrille').trim().toLowerCase()
  return <AdminMenuClient tenant={tenant} />
}


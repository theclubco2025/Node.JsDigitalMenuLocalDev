import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma'
import AdminOrdersClient from './ui'

export const dynamic = 'force-dynamic'

export default async function AdminOrdersPage({ searchParams }: { searchParams?: { tenant?: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent('/admin/orders')}`)
  }

  const role = (session as unknown as { role?: string }).role
  const tenantId = (session as unknown as { tenantId?: string | null }).tenantId || null

  let tenantSlug: string | null = null
  if (tenantId) {
    const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
    tenantSlug = t?.slug || null
  }

  // Super admins can optionally override via ?tenant=
  const requested = (searchParams?.tenant || '').trim().toLowerCase()
  const effectiveTenant = (role === 'SUPER_ADMIN' && requested) ? requested : (tenantSlug || requested || 'independentbarandgrille')

  return <AdminOrdersClient tenant={effectiveTenant} />
}


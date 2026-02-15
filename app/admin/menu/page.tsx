import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma'
import AdminMenuClient from './ui'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Admin Menu',
}

export default async function AdminMenuPage({ searchParams }: { searchParams?: { tenant?: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent('/admin/menu')}`)
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

  return <AdminMenuClient tenant={effectiveTenant} />
}


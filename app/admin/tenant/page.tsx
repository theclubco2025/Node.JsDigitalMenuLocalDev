import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma'

type Params = { searchParams?: { tenant?: string; token?: string } }

export default async function TenantAdminPage({ searchParams }: Params) {
  const tenantParam = (searchParams?.tenant || process.env.NEXT_PUBLIC_DEFAULT_TENANT || 'demo').trim()
  const callbackUrl = `/admin/tenant?tenant=${encodeURIComponent(tenantParam)}${searchParams?.token ? `&token=${encodeURIComponent(searchParams.token)}` : ''}`

  const session = await getServerSession(authOptions)
  if (!session) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  const sessionRecord = session as unknown as Record<string, unknown>
  const role = sessionRecord.role as string | undefined
  const userTenantId = sessionRecord.tenantId as string | undefined | null

  const tenantSlug = tenantParam.replace(/-draft$/, '')
  let sessionTenantSlug: string | null = null
  if (userTenantId) {
    const tenant = await prisma.tenant.findUnique({ where: { id: userTenantId }, select: { slug: true } })
    sessionTenantSlug = tenant?.slug ?? null
  }

  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isOwnerForTenant = role === 'RESTAURANT_OWNER' && sessionTenantSlug === tenantSlug

  if (!isSuperAdmin && !isOwnerForTenant) {
    redirect(`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  const token = searchParams?.token?.trim()
  const target = `/menu?tenant=${encodeURIComponent(tenantParam)}&admin=1${token ? `&token=${encodeURIComponent(token)}` : ''}`
  redirect(target)
}

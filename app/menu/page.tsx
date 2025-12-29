import { redirect } from 'next/navigation'
import MenuClient from '@/components/MenuClient'
import { prisma } from '@/lib/prisma'

type Props = {
  searchParams?: Record<string, string | string[] | undefined>
}

function firstString(v: string | string[] | undefined): string | undefined {
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return v[0]
  return undefined
}

export default async function MenuPage({ searchParams }: Props) {
  const isPreview = process.env.VERCEL_ENV === 'preview'
  const bypassActivationForTesting = process.env.NEXT_PUBLIC_DISABLE_PREVIEW_TENANT_FORCE === '1'
  const tenant =
    (firstString(searchParams?.tenant)?.trim().toLowerCase() ||
      process.env.NEXT_PUBLIC_DEFAULT_TENANT ||
      'demo')

  // In preview we want clients to be able to review work without being paywalled.
  if (isPreview) return <MenuClient />

  // Always allow demo + any draft tenants (drafts are blocked elsewhere on prod anyway).
  if (!tenant || tenant === 'demo' || tenant.endsWith('-draft')) return <MenuClient />

  // TEMP testing bypass: allow ONLY buttercuppantry to view the menu without activation.
  // This is gated by an env var so it can be flipped off later without code changes.
  if (bypassActivationForTesting && tenant === 'buttercuppantry') return <MenuClient />

  // If DB isn't configured (local/demo), don't block.
  if (!process.env.DATABASE_URL) return <MenuClient />

  const row = await prisma.tenant.findUnique({ where: { slug: tenant }, select: { status: true } })
  if (row?.status !== 'ACTIVE') {
    redirect(`/billing?tenant=${encodeURIComponent(tenant)}`)
  }

  return <MenuClient />
}

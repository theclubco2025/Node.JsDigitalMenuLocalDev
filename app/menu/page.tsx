import { redirect } from 'next/navigation'
import MenuClient from '@/components/MenuClient'
import IndependentMenuClient from '@/components/IndependentMenuClient'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Menu',
}

type Props = {
  searchParams?: Record<string, string | string[] | undefined>
}

function firstString(v: string | string[] | undefined): string | undefined {
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return v[0]
  return undefined
}

function canonicalTenant(tenant: string) {
  const t = (tenant || '').toLowerCase()
  if (t === 'southforkgrille') return 'south-fork-grille'
  return tenant
}

export default async function MenuPage({ searchParams }: Props) {
  const isPreview = process.env.VERCEL_ENV === 'preview'
  const tenant =
    canonicalTenant(firstString(searchParams?.tenant)?.trim().toLowerCase() ||
      process.env.NEXT_PUBLIC_DEFAULT_TENANT ||
      'demo')

  // Preview: render Independent premium UI for the independent-draft branch/tenant
  if (isPreview && (tenant === 'independent-draft' || tenant === 'independentbarandgrille')) {
    return <IndependentMenuClient />
  }

  // In preview we want clients to be able to review work without being paywalled.
  if (isPreview) return <MenuClient />

  // Always allow demo + any draft tenants (drafts are blocked elsewhere on prod anyway).
  if (!tenant || tenant === 'demo' || tenant.endsWith('-draft')) return <MenuClient />

  // Independent: render the exact premium UI used in independent-draft previews.
  // Tenant-scoped so it won't impact any other menus.
  if (tenant === 'independentbarandgrille' || tenant === 'independent-draft') return <IndependentMenuClient />

  // TEMP tenant-scoped bypass: allow specific tenants to view the menu without activation.
  // This is intentionally tenant-scoped so it won't affect any other live menus.
  if (tenant === 'buttercuppantry' || tenant === 'south-fork-grille' || tenant === 'independent' || tenant === 'independentbarandgrille') return <MenuClient />

  // If DB isn't configured (local/demo), don't block.
  if (!process.env.DATABASE_URL) return <MenuClient />

  try {
    const row = await prisma.tenant.findUnique({ where: { slug: tenant }, select: { status: true } })
    if (row?.status !== 'ACTIVE') {
      redirect(`/billing?tenant=${encodeURIComponent(tenant)}`)
    }
  } catch {
    // Build/runtime safety: if DB is temporarily unreachable, do not fail rendering.
    // The billing gate is an activation guard; safe fallback is to render the menu client.
    return <MenuClient />
  }

  return <MenuClient />
}

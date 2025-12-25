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
  const tenant =
    (firstString(searchParams?.tenant)?.trim() ||
      process.env.NEXT_PUBLIC_DEFAULT_TENANT ||
      'demo')

  // In preview we want clients to be able to review work without being paywalled.
  // But allow forcing the paywall for testing (demo tenant only) via env flag.
  const previewTestPaywall = isPreview && process.env.PREVIEW_TEST_PAYWALL === '1' && tenant === 'demo'
  if (isPreview && !previewTestPaywall) return <MenuClient />

  // Always allow drafts (drafts are blocked elsewhere on prod anyway).
  // Allow demo too, except when we're explicitly testing the paywall in preview.
  if (!tenant || (!previewTestPaywall && tenant === 'demo') || tenant.endsWith('-draft')) return <MenuClient />

  // If DB isn't configured (local/demo), don't block.
  if (!process.env.DATABASE_URL) return <MenuClient />

  const row = await prisma.tenant.findUnique({ where: { slug: tenant }, select: { status: true } })
  if (row?.status !== 'ACTIVE') {
    redirect(`/billing?tenant=${encodeURIComponent(tenant)}`)
  }

  return <MenuClient />
}

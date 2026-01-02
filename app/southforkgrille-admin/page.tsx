import { redirect } from 'next/navigation'

export default function SouthForkGrilleAdminAlias({ searchParams }: { searchParams?: { token?: string } }) {
  // Mirror the generic /<slug>-admin middleware behavior, but point at the
  // canonical South Fork Grille draft tenant id (hyphenated).
  const token = searchParams?.token?.trim()
  const target = `/menu?tenant=south-fork-grille-draft&admin=1${token ? `&token=${encodeURIComponent(token)}` : ''}`
  redirect(target)
}



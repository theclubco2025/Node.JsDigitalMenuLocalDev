import { notFound, redirect } from 'next/navigation'

const RESERVED = new Set([
  'api',
  't',
  'menu',
  'billing',
  'auth',
  'admin',
  'demo-admin',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
  '_next',
])

export default function SlugRoutePage({ params }: { params: { slug: string } }) {
  const slug = (params?.slug || '').trim()
  if (!slug) return notFound()
  if (RESERVED.has(slug.toLowerCase())) return notFound()
  redirect(`/menu?tenant=${encodeURIComponent(slug)}`)
}



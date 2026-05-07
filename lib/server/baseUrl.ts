import type { NextRequest } from 'next/server'

export function baseUrlFromRequest(req: NextRequest): string {
  // Prefer request-derived origin so Vercel Preview redirects + links work without extra env config.
  const proto = (req.headers.get('x-forwarded-proto') || 'https').split(',')[0]?.trim() || 'https'
  const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '').split(',')[0]?.trim()
  if (host) return `${proto}://${host}`.replace(/\/$/, '')
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000').replace(/\/$/, '')
}


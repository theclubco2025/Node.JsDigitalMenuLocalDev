import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Handle CORS preflight generically for all API routes
  if (request.nextUrl.pathname.startsWith('/api/') && request.method === 'OPTIONS') {
    const res = NextResponse.json({ ok: true })
    const origin = request.headers.get('origin') || '*'
    res.headers.set('Access-Control-Allow-Origin', origin)
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD')
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token')
    res.headers.set('Vary', 'Origin')
    return res
  }
  // In preview, if no tenant provided, derive it from host (-git-<branch>-)
  if (request.nextUrl.pathname === '/' && !request.nextUrl.searchParams.get('tenant')) {
    const isPreview = process.env.VERCEL_ENV === 'preview'
    if (isPreview) {
      const url = request.nextUrl.clone()
      const host = request.headers.get('host') || ''
      const m = host.match(/-git-([a-z0-9-]+)-/i)
      const fromHost = (m?.[1] || '').toLowerCase()
      const candidate = fromHost || (process.env.PREVIEW_DEFAULT_TENANT || '')
      if (candidate) {
        url.pathname = '/menu'
        url.searchParams.set('tenant', candidate)
        return NextResponse.redirect(url)
      }
    }
  }
  // In preview, ALWAYS normalize /menu to the branch slug tenant, even if a wrong tenant query is present
  if (request.nextUrl.pathname === '/menu') {
    const isPreview = process.env.VERCEL_ENV === 'preview'
    if (isPreview) {
      const url = request.nextUrl.clone()
      const host = request.headers.get('host') || ''
      const fromEnv = (process.env.VERCEL_GIT_COMMIT_REF || '').toLowerCase()
      const m = host.match(/-git-([a-z0-9-]+)-/i)
      const fromHost = (m?.[1] || '').toLowerCase()
      const desiredTenant = fromEnv || fromHost || (process.env.PREVIEW_DEFAULT_TENANT || '')
      const currentTenant = (url.searchParams.get('tenant') || '').toLowerCase()
      if (desiredTenant && currentTenant !== desiredTenant) {
        url.searchParams.set('tenant', desiredTenant)
        return NextResponse.redirect(url)
      }
    }
  }
  // Friendly owner admin alias: /<slug>-admin -> /menu?tenant=<slug>-draft&admin=1
  const adminAlias = request.nextUrl.pathname.match(/^\/(.+)-admin$/)
  if (adminAlias && adminAlias[1]) {
    const slug = adminAlias[1]
    const url = request.nextUrl.clone()
    const token = url.searchParams.get('token') || ''
    url.pathname = '/menu'
    url.searchParams.set('tenant', `${slug}-draft`)
    url.searchParams.set('admin', '1')
    if (token) url.searchParams.set('token', token)
    return NextResponse.redirect(url)
  }
  // Pretty path for tenant previews: /t/<slug> -> /menu?tenant=<slug>
  if (request.nextUrl.pathname.startsWith('/t/')) {
    const parts = request.nextUrl.pathname.split('/').filter(Boolean)
    const slug = parts[1]
    if (slug) {
      const url = request.nextUrl.clone()
      url.pathname = '/menu'
      url.searchParams.set('tenant', slug)
      return NextResponse.redirect(url)
    }
  }
  // Production path alias: '/<slug>' -> '/menu?tenant=<slug>' (single segment, non-reserved)
  const pathOnly = request.nextUrl.pathname.split('/').filter(Boolean)
  if (
    pathOnly.length === 1 &&
    !['api', 't', 'menu', '_next', 'favicon.ico', 'robots.txt', 'sitemap.xml'].includes(pathOnly[0])
  ) {
    const slug = pathOnly[0]
    const url = request.nextUrl.clone()
    url.pathname = '/menu'
    url.searchParams.set('tenant', slug)
    return NextResponse.redirect(url)
  }
  // Add CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next()
    const origin = request.headers.get('origin') || '*'
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token')
    response.headers.set('Vary', 'Origin')
    return response
  }
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/:path*',
    '/t/:path*',
    // Exclude Next internals and static assets; match everything else including '/' and '/menu'
    '/((?!_next/|favicon.ico|robots.txt|sitemap.xml).*)'
  ],
}

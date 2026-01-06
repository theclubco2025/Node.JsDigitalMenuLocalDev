import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const isPreview = process.env.VERCEL_ENV === 'preview'
  // Handle CORS preflight generically for all API routes
  if (request.nextUrl.pathname.startsWith('/api/') && request.method === 'OPTIONS') {
    const res = NextResponse.json({ ok: true })
    const isAdminApi = request.nextUrl.pathname.startsWith('/api/admin/')
    // Admin APIs are same-origin only: do NOT emit permissive CORS headers.
    if (!isAdminApi) {
      const origin = request.headers.get('origin') || '*'
      res.headers.set('Access-Control-Allow-Origin', origin)
      res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD')
      res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token')
      res.headers.set('Vary', 'Origin')
    }
    return res
  }

  // Hard bypass: never allow billing for specific tenants (avoid any paywall flash).
  if (request.nextUrl.pathname === '/billing') {
    const t = (request.nextUrl.searchParams.get('tenant') || '').trim().toLowerCase()
    if (['buttercuppantry', 'southforkgrille', 'south-fork-grille', 'independent'].includes(t)) {
      const url = request.nextUrl.clone()
      url.pathname = `/${encodeURIComponent(t)}`
      url.search = ''
      return NextResponse.redirect(url)
    }
  }

  // Safety: never allow -draft tenants on production domain (prevents accidental draft leakage)
  if (!isPreview && request.nextUrl.pathname === '/menu') {
    const t = (request.nextUrl.searchParams.get('tenant') || '').toLowerCase()
    if (t.endsWith('-draft')) {
      const url = request.nextUrl.clone()
      url.searchParams.set('tenant', 'demo')
      return NextResponse.redirect(url)
    }
  }
  // Default landing: render marketing page unless a tenant is explicitly requested or landing mode disabled
  if (request.nextUrl.pathname === '/' && !request.nextUrl.searchParams.get('tenant')) {
    const landingDisabled = process.env.NEXT_PUBLIC_LANDING_MODE === '0'
    if (!landingDisabled && !isPreview) {
      return NextResponse.next()
    }
    const url = request.nextUrl.clone()
    if (landingDisabled && !isPreview) {
      url.pathname = '/menu'
      url.searchParams.set('tenant', 'benes')
      return NextResponse.redirect(url)
    }
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
  // In preview, ALWAYS normalize /menu to the branch slug tenant, even if a wrong tenant query is present
  if (request.nextUrl.pathname === '/menu') {
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
      if (!isPreview && slug.toLowerCase().endsWith('-draft')) {
        const url = request.nextUrl.clone()
        url.pathname = '/menu'
        url.searchParams.set('tenant', 'demo')
        return NextResponse.redirect(url)
      }
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
    ![
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
    ].includes(pathOnly[0])
  ) {
    const slug = pathOnly[0]
    if (!isPreview && slug.toLowerCase().endsWith('-draft')) {
      const url = request.nextUrl.clone()
      url.pathname = '/menu'
      url.searchParams.set('tenant', 'demo')
      return NextResponse.redirect(url)
    }
    const url = request.nextUrl.clone()
    url.pathname = '/menu'
    url.searchParams.set('tenant', slug)
    return NextResponse.redirect(url)
  }
  // Add CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next()
    const origin = request.headers.get('origin') || undefined
    const isAdminApi = request.nextUrl.pathname.startsWith('/api/admin/')
    // Admin APIs are same-origin only: do NOT emit permissive CORS headers.
    if (!isAdminApi) {
      if (origin) {
        response.headers.set('Access-Control-Allow-Origin', origin)
      } else {
        response.headers.set('Access-Control-Allow-Origin', '*')
      }
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token, x-admin-token')
      response.headers.set('Vary', 'Origin')
    }
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

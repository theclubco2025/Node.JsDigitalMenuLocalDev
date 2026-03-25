import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const isPreview = process.env.VERCEL_ENV === 'preview'
  // Handle CORS preflight generically for all API routes
  if (request.nextUrl.pathname.startsWith('/api/') && request.method === 'OPTIONS') {
    const res = NextResponse.json({ ok: true })
    const isAdminApi = request.nextUrl.pathname.startsWith('/api/admin/')
    const isAssistantApi = request.nextUrl.pathname === '/api/assistant'
    // Admin APIs are same-origin only: do NOT emit permissive CORS headers.
    // Assistant API uses its own CORS logic (ASSISTANT_ALLOWED_ORIGINS).
    if (!isAdminApi && !isAssistantApi) {
      const origin = request.headers.get('origin') || '*'
      const isAssistant = request.nextUrl.pathname.startsWith('/api/assistant')
      if (isAssistant) {
        const allowed = (process.env.ASSISTANT_ALLOWED_ORIGINS || process.env.ALLOWED_ORIGINS || process.env.NEXT_PUBLIC_SITE_URL || '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
        let sameOrigin = false
        try {
          sameOrigin = origin !== '*' && origin === request.nextUrl.origin
        } catch {}
        const ok = origin === '*' ? false : (sameOrigin || allowed.includes(origin))
        if (!ok) {
          return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 })
        }
      }
      res.headers.set('Access-Control-Allow-Origin', origin)
      res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD')
      res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token')
      res.headers.set('Vary', 'Origin')
    } else if (isAssistantApi) {
      const origin = request.headers.get('origin') || ''
      const allowList = (process.env.ASSISTANT_ALLOWED_ORIGINS || '').trim()
      const allowed = !allowList || allowList.split(',').map(o => o.trim().toLowerCase()).includes(origin.toLowerCase())
      res.headers.set('Access-Control-Allow-Origin', allowed && origin ? origin : 'null')
      res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
      res.headers.set('Access-Control-Allow-Headers', 'Content-Type')
      res.headers.set('Vary', 'Origin')
    }
    return res
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
  // Default landing: ALWAYS render marketing page at root (PlatePilot landing)
  // unless landing mode is explicitly disabled
  if (request.nextUrl.pathname === '/' && !request.nextUrl.searchParams.get('tenant')) {
    const landingDisabled = process.env.NEXT_PUBLIC_LANDING_MODE === '0'
    if (landingDisabled) {
      const url = request.nextUrl.clone()
      url.pathname = '/menu'
      url.searchParams.set('tenant', 'platepilot-demo')
      return NextResponse.redirect(url)
    }
    // Always show the landing page (PlatePilot) at root
    return NextResponse.next()
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
      // Kitchen Display System routes (must not be treated as tenant slugs)
      'kitchen',
      'kds',
      // Ordering success page
      'order',
      // Dedicated landing for demo acknowledgement (do not treat as tenant slug)
      'demo',
      'billing',
      'auth',
      'admin',
      'demo-admin',
      'terms',
      'privacy',
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

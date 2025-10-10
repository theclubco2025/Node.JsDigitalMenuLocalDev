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
  // In Vercel preview, default /menu to benes-draft if no tenant param
  if (request.nextUrl.pathname === '/menu' && !request.nextUrl.searchParams.get('tenant')) {
    const isPreview = process.env.VERCEL_ENV === 'preview'
    if (isPreview) {
      const url = request.nextUrl.clone()
      url.searchParams.set('tenant', process.env.PREVIEW_DEFAULT_TENANT || 'benes-draft')
      return NextResponse.redirect(url)
    }
  }
  // Friendly owner admin alias: /<slug>-admin -> /menu?tenant=<slug>-draft&admin=1
  const adminAlias = request.nextUrl.pathname.match(/^\/(.+)-admin$/)
  if (adminAlias && adminAlias[1]) {
    const slug = adminAlias[1]
    const url = request.nextUrl.clone()
    url.pathname = '/menu'
    url.searchParams.set('tenant', `${slug}-draft`)
    url.searchParams.set('admin', '1')
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
    // Exclude all Next internals and assets to avoid dev 404s
    '/((?!_next/|favicon.ico|robots.txt|sitemap.xml).*)'
  ],
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // In preview, normalize tenant to branch name (from env) for both '/' and '/menu'
  const isPreview = process.env.VERCEL_ENV === 'preview'
  const branchRef = (process.env.VERCEL_GIT_COMMIT_REF || '').toLowerCase()
  // TEMP testing override: disable preview tenant normalization when explicitly requested.
  // This effectively removes the “checkout wall” behavior of forcing /menu to a specific tenant.
  const disablePreviewTenantForce = process.env.NEXT_PUBLIC_DISABLE_PREVIEW_TENANT_FORCE === '1'
  if (isPreview && branchRef && !disablePreviewTenantForce) {
    if (request.nextUrl.pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/menu'
      url.searchParams.set('tenant', branchRef)
      return NextResponse.redirect(url)
    }
    if (request.nextUrl.pathname === '/menu') {
      const url = request.nextUrl.clone()
      const currentTenant = (url.searchParams.get('tenant') || '').toLowerCase()
      if (currentTenant !== branchRef) {
        url.searchParams.set('tenant', branchRef)
        return NextResponse.redirect(url)
      }
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
    
    // Allow requests from any origin for the embeddable widget
    const origin = request.headers.get('origin') || '*'
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token')
    response.headers.set('Vary', 'Origin')
    
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*', '/t/:path*', '/menu'],
}

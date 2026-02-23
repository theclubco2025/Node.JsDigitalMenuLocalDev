import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function baseUrl(req: NextRequest) {
  const proto = (req.headers.get('x-forwarded-proto') || 'https').split(',')[0]?.trim() || 'https'
  const host = (req.headers.get('x-forwarded-host') || req.headers.get('host') || '').split(',')[0]?.trim()
  if (host) return `${proto}://${host}`.replace(/\/$/, '')
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || '').replace(/\/$/, '')
}

function signState(payload: Record<string, unknown>) {
  const secret = (process.env.NEXTAUTH_SECRET || '').trim()
  if (!secret) throw new Error('Missing NEXTAUTH_SECRET')
  const json = JSON.stringify(payload)
  const b64 = Buffer.from(json, 'utf8').toString('base64url')
  const sig = crypto.createHmac('sha256', secret).update(b64).digest('base64url')
  return `${b64}.${sig}`
}

export async function GET(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) return NextResponse.json({ ok: false, error: 'DATABASE_URL required' }, { status: 501 })
    const clientId = (process.env.STRIPE_CONNECT_CLIENT_ID || '').trim()
    if (!clientId) return NextResponse.json({ ok: false, error: 'Missing STRIPE_CONNECT_CLIENT_ID' }, { status: 501 })

    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.redirect(new URL('/auth/login', req.url))

    const role = (session as unknown as { role?: string }).role || ''
    const tenantId = (session as unknown as { tenantId?: string | null }).tenantId || null

    const tenant = (req.nextUrl.searchParams.get('tenant') || '').trim().toLowerCase()
    if (!tenant) return NextResponse.json({ ok: false, error: 'Missing tenant' }, { status: 400 })

    if (role !== 'SUPER_ADMIN') {
      if (!tenantId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
      const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
      if (!t || t.slug !== tenant) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const redirectUri =
      (process.env.STRIPE_CONNECT_REDIRECT_URI || '').trim()
      || `${baseUrl(req)}/api/stripe/connect/callback`
      || `${req.nextUrl.origin}/api/stripe/connect/callback`

    const state = signState({
      tenant,
      // return to admin menu by default
      returnTo: `/admin/menu?tenant=${encodeURIComponent(tenant)}`,
      ts: Date.now(),
    })

    const u = new URL('https://connect.stripe.com/oauth/authorize')
    u.searchParams.set('response_type', 'code')
    u.searchParams.set('client_id', clientId)
    u.searchParams.set('scope', 'read_write')
    u.searchParams.set('redirect_uri', redirectUri)
    u.searchParams.set('state', state)

    return NextResponse.redirect(u)
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error)?.message || 'Connect start error' }, { status: 500 })
  }
}


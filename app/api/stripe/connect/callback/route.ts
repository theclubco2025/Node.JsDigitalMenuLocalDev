import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function verifyAndParseState(state: string | null) {
  const raw = String(state || '').trim()
  if (!raw || !raw.includes('.')) return null
  const [b64, sig] = raw.split('.', 2)
  const secret = (process.env.NEXTAUTH_SECRET || '').trim()
  if (!secret) return null
  const expected = crypto.createHmac('sha256', secret).update(b64).digest('base64url')
  if (expected !== sig) return null
  try {
    const json = Buffer.from(b64, 'base64url').toString('utf8')
    const payload = JSON.parse(json) as Record<string, unknown>
    const tenant = typeof payload.tenant === 'string' ? payload.tenant.trim().toLowerCase() : ''
    const returnTo = typeof payload.returnTo === 'string' ? payload.returnTo.trim() : ''
    return { tenant, returnTo }
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) return NextResponse.json({ ok: false, error: 'DATABASE_URL required' }, { status: 501 })

    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.redirect(new URL('/auth/login', req.url))

    const role = (session as unknown as { role?: string }).role || ''
    const tenantId = (session as unknown as { tenantId?: string | null }).tenantId || null

    const error = (req.nextUrl.searchParams.get('error') || '').trim()
    if (error) {
      const desc = (req.nextUrl.searchParams.get('error_description') || '').trim()
      return NextResponse.redirect(new URL(`/admin/menu?connect=error&msg=${encodeURIComponent(desc || error)}`, req.url))
    }

    const code = (req.nextUrl.searchParams.get('code') || '').trim()
    const state = verifyAndParseState(req.nextUrl.searchParams.get('state'))
    if (!code || !state?.tenant) {
      return NextResponse.redirect(new URL('/admin/menu?connect=error&msg=Missing%20code', req.url))
    }

    if (role !== 'SUPER_ADMIN') {
      if (!tenantId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
      const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
      if (!t || t.slug !== state.tenant) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const stripe = getStripe()
    const token = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code,
    })
    const accountId = String((token as unknown as { stripe_user_id?: string }).stripe_user_id || '').trim()
    if (!accountId) {
      return NextResponse.redirect(new URL('/admin/menu?connect=error&msg=Missing%20account%20id', req.url))
    }

    await prisma.tenant.update({
      where: { slug: state.tenant },
      data: {
        stripeConnectAccountId: accountId,
        stripeConnectOnboardedAt: new Date(),
      },
      select: { id: true },
    })

    const returnTo = state.returnTo || `/admin/menu?tenant=${encodeURIComponent(state.tenant)}`
    const u = new URL(returnTo, req.nextUrl.origin)
    u.searchParams.set('connect', 'ok')
    return NextResponse.redirect(u)
  } catch (e) {
    const msg = encodeURIComponent((e as Error)?.message || 'Connect error')
    return NextResponse.redirect(new URL(`/admin/menu?connect=error&msg=${msg}`, req.url))
  }
}


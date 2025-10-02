import { NextRequest, NextResponse } from 'next/server'

// Dev-only demo login endpoint. In production, returns 404.
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const type = (body?.type === 'super' ? 'super' : 'owner') as 'super' | 'owner'

    const superEmail = process.env.SEED_SUPERADMIN_EMAIL || 'admin@digitalmenusaas.com'
    const ownerEmail = process.env.SEED_OWNER_EMAIL || 'owner@bellavista.com'

    const demoUser = type === 'super'
      ? { email: superEmail, role: 'SUPER_ADMIN' }
      : { email: ownerEmail, role: 'RESTAURANT_OWNER' }

    // Minimal session cookie for demo UX only (stateless). Real auth not enabled in this build.
    const sessionPayload = Buffer.from(JSON.stringify({
      user: demoUser,
      iat: Date.now(),
      demo: true
    })).toString('base64')

    const res = NextResponse.json({ ok: true })
    // Non-secure cookie for dev only
    res.cookies.set('demo_session', sessionPayload, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
    })
    return res
  } catch (error) {
    return NextResponse.json({ error: 'Demo login failed' }, { status: 400 })
  }
}



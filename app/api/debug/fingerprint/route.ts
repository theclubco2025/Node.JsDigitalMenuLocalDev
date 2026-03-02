import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function shortHash(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 10)
}

export async function GET(req: NextRequest) {
  // Never expose debug fingerprints publicly in production.
  if (process.env.VERCEL_ENV === 'production') {
    const adminToken = String(process.env.ADMIN_TOKEN || '').trim()
    const provided = String(req.headers.get('x-admin-token') || '').trim()
    if (!adminToken || provided !== adminToken) {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404, headers: { 'Cache-Control': 'no-store' } })
    }
  }

  const host = (req.headers.get('host') || '').trim()
  const vercelEnv = process.env.VERCEL_ENV || 'unknown'
  const ref = process.env.VERCEL_GIT_COMMIT_REF || ''
  const sha = process.env.VERCEL_GIT_COMMIT_SHA || ''

  // Never return DATABASE_URL; only a short non-reversible fingerprint.
  const db = process.env.DATABASE_URL ? shortHash(process.env.DATABASE_URL) : 'missing'

  return NextResponse.json({
    ok: true,
    host,
    vercelEnv,
    git: {
      ref: ref || null,
      sha: sha ? sha.slice(0, 7) : null,
    },
    db,
  }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
}

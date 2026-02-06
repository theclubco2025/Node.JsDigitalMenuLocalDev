import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function shortHash(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 10)
}

export async function GET(req: NextRequest) {
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


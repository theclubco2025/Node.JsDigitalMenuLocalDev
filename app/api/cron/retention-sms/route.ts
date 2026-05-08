import { NextRequest, NextResponse } from 'next/server'
import { runRetentionSmsCron } from '@/lib/notifications/retention'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function authorized(req: NextRequest): boolean {
  const secret = String(process.env.CRON_SECRET || '').trim()
  if (!secret) return false
  const hdr = String(req.headers.get('authorization') || '').trim()
  const token = hdr.toLowerCase().startsWith('bearer ') ? hdr.slice(7).trim() : ''
  return token === secret
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }
  try {
    const out = await runRetentionSmsCron(new Date())
    return NextResponse.json(out, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error)?.message || 'retention_cron_error' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}

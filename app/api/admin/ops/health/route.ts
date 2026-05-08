import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resendConfigured } from '@/lib/notifications/resend'
import { pingTwilioAccount, twilioConfigured } from '@/lib/notifications/twilio'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function unauthorized() {
  return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
}

export async function GET(req: NextRequest) {
  const adminToken = String(process.env.ADMIN_TOKEN || '').trim()
  const provided = String(req.headers.get('x-admin-token') || '').trim()
  if (!adminToken || provided !== adminToken) return unauthorized()

  const upstashConfigured =
    Boolean(String(process.env.UPSTASH_REDIS_REST_URL || '').trim()) &&
    Boolean(String(process.env.UPSTASH_REDIS_REST_TOKEN || '').trim())

  const dbConfigured = Boolean(String(process.env.DATABASE_URL || '').trim())
  const resendOk = resendConfigured()
  const twilioOk = twilioConfigured()
  let dbOk: boolean | null = null
  let dbError: string | null = null
  let twilioReachable: boolean | null = null
  let twilioError: string | null = null
  if (dbConfigured) {
    try {
      await prisma.$queryRaw`SELECT 1`
      dbOk = true
    } catch (e) {
      dbOk = false
      dbError = (e instanceof Error ? e.message : String(e || '')).slice(0, 400) || 'db_error'
    }
  }
  if (twilioOk) {
    const ping = await pingTwilioAccount()
    twilioReachable = ping.ok
    twilioError = ping.ok ? null : (ping.error || 'twilio_ping_failed')
  }

  return NextResponse.json({
    ok: true,
    ts: new Date().toISOString(),
    vercelEnv: process.env.VERCEL_ENV || 'unknown',
    upstashConfigured,
    dbConfigured,
    dbOk,
    dbError,
    resendConfigured: resendOk,
    twilioConfigured: twilioOk,
    twilioReachable,
    twilioError,
  }, { status: 200, headers: { 'Cache-Control': 'no-store' } })
}


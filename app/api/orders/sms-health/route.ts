import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { twilioConfigured } from '@/lib/notifications/twilio'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const twilioOk = twilioConfigured()

    if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.trim()) {
      return NextResponse.json({
        ok: true,
        twilio: { configured: twilioOk },
        db: { configured: false, smsColumnsPresent: false },
      }, { headers: { 'Cache-Control': 'no-store' } })
    }

    let smsColumnsPresent = false
    try {
      await prisma.order.findFirst({ select: { id: true, smsOptIn: true } })
      smsColumnsPresent = true
    } catch (e) {
      const code = (e as { code?: string } | null)?.code
      const msg = (e instanceof Error ? e.message : String(e || '')).toLowerCase()
      if (code === 'P2022' || msg.includes('does not exist')) smsColumnsPresent = false
      else throw e
    }

    return NextResponse.json({
      ok: true,
      twilio: { configured: twilioOk },
      db: { configured: true, smsColumnsPresent },
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error)?.message || 'sms health error' }, { status: 500 })
  }
}


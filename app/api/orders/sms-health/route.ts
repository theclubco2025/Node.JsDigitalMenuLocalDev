import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { twilioConfigured } from '@/lib/notifications/twilio'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function classifyTwilioSid(v: string, prefix: string) {
  const s = String(v || '').trim()
  if (!s) return { present: false as const, kind: 'missing' as const }
  if (s.startsWith(prefix)) return { present: true as const, kind: prefix }
  return { present: true as const, kind: 'unknown' as const }
}

export async function GET() {
  try {
    const twilioOk = twilioConfigured()
    const twilio = {
      TWILIO_ACCOUNT_SID: classifyTwilioSid(process.env.TWILIO_ACCOUNT_SID || '', 'AC'),
      TWILIO_API_KEY_SID: classifyTwilioSid(process.env.TWILIO_API_KEY_SID || '', 'SK'),
      TWILIO_MESSAGING_SERVICE_SID: classifyTwilioSid(process.env.TWILIO_MESSAGING_SERVICE_SID || '', 'MG'),
      TWILIO_API_KEY_SECRET_present: Boolean(String(process.env.TWILIO_API_KEY_SECRET || '').trim()),
    }

    if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.trim()) {
      return NextResponse.json({
        ok: true,
        twilio: { configured: twilioOk, ...twilio },
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
      twilio: { configured: twilioOk, ...twilio },
      db: { configured: true, smsColumnsPresent },
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error)?.message || 'sms health error' }, { status: 500 })
  }
}


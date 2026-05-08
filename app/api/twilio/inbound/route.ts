import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function env(name: string): string {
  return String(process.env[name] || '').trim()
}

function normalizeE164(raw: string): string | null {
  const s = String(raw || '').trim()
  if (!s) return null
  if (s.startsWith('+')) {
    const digits = s.slice(1).replace(/[^\d]/g, '')
    return digits ? `+${digits}` : null
  }
  const digits = s.replace(/[^\d]/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  if (digits.length >= 8 && digits.length <= 15) return `+${digits}`
  return null
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function xmlMessageResponse(message: string) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`
  return new NextResponse(xml, { status: 200, headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'no-store' } })
}

function twilioSignatureIsValid(req: NextRequest, formEntries: Array<[string, string]>): boolean {
  const token = env('TWILIO_AUTH_TOKEN')
  if (!token) return false
  const signature = String(req.headers.get('x-twilio-signature') || '').trim()
  if (!signature) return false
  const url = req.url
  const sorted = [...formEntries].sort(([a], [b]) => a.localeCompare(b))
  const payload = sorted.reduce((acc, [k, v]) => `${acc}${k}${v}`, url)
  const expected = crypto.createHmac('sha1', token).update(payload).digest('base64')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const entries = Array.from(form.entries()).map(([k, v]) => [k, String(v ?? '')] as [string, string])
    if (!twilioSignatureIsValid(req, entries)) {
      return new NextResponse('Invalid Twilio signature', { status: 403, headers: { 'Cache-Control': 'no-store' } })
    }

    const from = normalizeE164(String(form.get('From') || ''))
    const body = String(form.get('Body') || '').trim().toUpperCase()
    if (!from || !body) {
      return new NextResponse('', { status: 204, headers: { 'Cache-Control': 'no-store' } })
    }

    const stopWords = new Set(['STOP', 'STOPALL', 'UNSUBSCRIBE', 'END', 'QUIT', 'CANCEL'])
    const helpWords = new Set(['HELP', 'INFO'])

    if (stopWords.has(body)) {
      await prisma.smsSuppression.create({
        data: {
          phoneE164: from,
          reason: body,
          source: 'twilio_inbound',
        },
        select: { id: true },
      }).catch(() => null)
      return xmlMessageResponse('You are unsubscribed and will no longer receive text updates. Reply START to resubscribe.')
    }

    if (helpWords.has(body)) {
      return xmlMessageResponse('PlateHaven order updates support: reply STOP to opt out. Msg & data rates may apply.')
    }

    return new NextResponse('', { status: 204, headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return new NextResponse(`Webhook error: ${(e as Error)?.message || 'unknown_error'}`, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}

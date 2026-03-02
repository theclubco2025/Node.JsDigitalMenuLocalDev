import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CURRENT_VERSION = '2025-03-02'

const BodySchema = z.object({
  email: z.string().email(),
  name: z.string().max(200).optional(),
  tenantSlug: z.string().max(100).optional(),
  documentType: z.enum(['terms', 'privacy', 'both']),
  checkboxText: z.string().max(500).optional(),
})

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]!.trim()
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return 'unknown'
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json().catch(() => ({}))
    const parsed = BodySchema.safeParse(raw)

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Invalid payload', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { email, name, tenantSlug, documentType, checkboxText } = parsed.data

    const ipAddress = getClientIp(req)
    const userAgent = req.headers.get('user-agent') || undefined

    const acceptance = await prisma.termsAcceptance.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name?.trim() || null,
        tenantSlug: tenantSlug?.trim() || null,
        documentType,
        documentVersion: CURRENT_VERSION,
        ipAddress,
        userAgent,
        checkboxText: checkboxText?.trim() || null,
      },
    })

    return NextResponse.json({
      ok: true,
      acceptanceId: acceptance.id,
      version: CURRENT_VERSION,
      acceptedAt: acceptance.acceptedAt.toISOString(),
    })
  } catch (e) {
    const msg = (e as Error)?.message || 'Failed to log acceptance'
    console.error('Terms acceptance error:', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    currentVersion: CURRENT_VERSION,
    documents: {
      terms: '/terms',
      privacy: '/privacy',
    },
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

type Payload = {
  tenant?: string
  email?: string
  password?: string
  accessCode?: string
  displayName?: string
}

function invalid(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status })
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as Payload
    const tenantSlug = (body.tenant || 'demo-draft').trim()
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')
    const accessCode = String(body.accessCode ?? '').trim()
    const displayName = (body.displayName || '').trim() || 'Demo Restaurant Admin'

    if (!email || !password) {
      return invalid('Email and password required')
    }

    if (!process.env.DEMO_ADMIN_ACCESS_CODE) {
      return invalid('Demo access code not configured', 500)
    }

    if (!accessCode || accessCode !== process.env.DEMO_ADMIN_ACCESS_CODE.trim()) {
      return invalid('Invalid access code', 403)
    }

    const tenant = await prisma.tenant.findFirst({ where: { slug: tenantSlug } })
    if (!tenant) {
      return invalid('Tenant not found', 404)
    }

    const passwordHash = await hash(password, 12)

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash,
        tenantId: tenant.id,
        role: 'RESTAURANT_OWNER',
        name: displayName,
      },
      create: {
        email,
        name: displayName,
        passwordHash,
        role: 'RESTAURANT_OWNER',
        tenantId: tenant.id,
      },
    })

    return NextResponse.json({ ok: true, userId: user.id })
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ ok: false, error: 'server_error', detail }, { status: 500 })
  }
}



import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const adminToken = process.env.ADMIN_TOKEN
    const headerToken = request.headers.get('x-admin-token') || request.headers.get('X-Admin-Token')
    
    if (!adminToken || !headerToken || headerToken !== adminToken) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({})) as { tenant?: string; status?: string }
    const tenant = body.tenant?.trim().toLowerCase()
    const status = (body.status?.toUpperCase() || 'ACTIVE') as 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'CANCELED'

    if (!tenant) {
      return NextResponse.json({ error: 'Missing tenant slug' }, { status: 400 })
    }

    const validStatuses = ['ACTIVE', 'TRIAL', 'SUSPENDED', 'CANCELED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 })
    }

    const result = await prisma.tenant.upsert({
      where: { slug: tenant },
      update: { status },
      create: { 
        slug: tenant, 
        name: tenant,
        status,
      },
    })

    return NextResponse.json({ 
      ok: true, 
      tenant: result.slug, 
      status: result.status,
      message: `Tenant ${tenant} is now ${status}`
    })
  } catch (error) {
    console.error('Tenant activation error:', error)
    return NextResponse.json(
      { error: 'activation_error', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

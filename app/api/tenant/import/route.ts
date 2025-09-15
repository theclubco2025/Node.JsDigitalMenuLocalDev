import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { setMemoryMenu, writeMenu } from '@/lib/data/menu'

export async function POST(request: NextRequest) {
  try {
    // Production gate: require ADMIN_TOKEN and matching X-Admin-Token header
    if (process.env.NODE_ENV === 'production') {
      const adminToken = process.env.ADMIN_TOKEN
      if (!adminToken || adminToken.trim() === '') {
        return NextResponse.json({ error: 'Server not configured. Set ADMIN_TOKEN env variable.' }, { status: 503 })
      }
      const headerToken = request.headers.get('x-admin-token') || request.headers.get('X-Admin-Token')
      if (!headerToken || headerToken !== adminToken) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const { tenant, menu } = await request.json()
    if (!tenant || typeof tenant !== 'string') {
      return NextResponse.json({ error: 'Missing tenant' }, { status: 400 })
    }
    if (!menu || typeof menu !== 'object') {
      return NextResponse.json({ error: 'Missing menu' }, { status: 400 })
    }

    // Try to persist to filesystem in dev; otherwise fall back to memory
    const dir = path.join(process.cwd(), 'data', 'tenants', tenant)
    const file = path.join(dir, 'menu.json')
    try {
      await writeMenu(tenant, menu)
    } catch {
      setMemoryMenu(tenant, menu)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
}



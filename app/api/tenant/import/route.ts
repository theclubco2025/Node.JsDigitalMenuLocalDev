import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { setMemoryMenu } from '@/lib/data/menu'

export async function POST(request: NextRequest) {
  try {
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
      await fs.mkdir(dir, { recursive: true })
      await fs.writeFile(file, JSON.stringify(menu, null, 2), 'utf8')
    } catch {
      // in-memory fallback
      setMemoryMenu(tenant, menu)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
}



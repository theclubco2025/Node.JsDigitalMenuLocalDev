import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

type TenantConfigJson = Record<string, unknown> | null

async function readJson(filePath: string): Promise<TenantConfigJson> {
  try {
    const buf = await fs.readFile(filePath, 'utf8')
    return JSON.parse(buf)
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenant = (searchParams.get('tenant') || '').trim() || 'demo'
    const base = path.join(process.cwd(), 'data', 'tenants', tenant)
    const brand = await readJson(path.join(base, 'brand.json'))
    const theme = await readJson(path.join(base, 'theme.json'))
    const images = await readJson(path.join(base, 'images.json'))
    const style = await readJson(path.join(base, 'style.json'))
    const copy = await readJson(path.join(base, 'copy.json'))
    return NextResponse.json({ brand, theme, images, style, copy }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'config_error', detail }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }
}



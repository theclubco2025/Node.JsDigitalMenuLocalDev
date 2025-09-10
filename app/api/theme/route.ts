import { NextRequest, NextResponse } from 'next/server'
import { resolveTenant } from '@/lib/tenant'
import { getTheme } from '@/lib/theme'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const tenant = resolveTenant(request.url)
    const theme = await getTheme(tenant)
    return NextResponse.json(theme, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to load theme' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}




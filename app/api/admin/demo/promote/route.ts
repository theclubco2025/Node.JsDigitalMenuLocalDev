import { NextRequest, NextResponse } from 'next/server'

type PromotePayload = {
  from?: string
  to?: string
  accessCode?: string
}

function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status })
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as PromotePayload
    const from = (body.from || 'demo-draft').trim()
    const to = (body.to || 'demo').trim()
    const accessCode = String(body.accessCode ?? '').trim()

    if (!process.env.DEMO_ADMIN_ACCESS_CODE) {
      return fail('Demo access code not configured', 500)
    }

    if (!accessCode || accessCode !== process.env.DEMO_ADMIN_ACCESS_CODE.trim()) {
      return fail('Invalid access code', 403)
    }

    const promoteUrl = new URL('/api/tenant/promote', request.nextUrl.origin)
    const res = await fetch(promoteUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.ADMIN_TOKEN ? { 'x-admin-token': process.env.ADMIN_TOKEN } : {}),
      },
      body: JSON.stringify({ from, to }),
      cache: 'no-store',
    })

    if (!res.ok) {
      const detail = await res.json().catch(() => ({}))
      return NextResponse.json({ ok: false, error: 'promote_failed', detail }, { status: res.status })
    }

    const payload = await res.json().catch(() => ({}))
    return NextResponse.json({ ok: true, detail: payload })
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ ok: false, error: 'server_error', detail }, { status: 500 })
  }
}



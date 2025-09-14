// Auth disabled in this build to unblock API runtime; re-enable when DB is configured
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ ok: false, message: 'Auth disabled in demo' }, { status: 501 })
}

export async function POST() {
  return NextResponse.json({ ok: false, message: 'Auth disabled in demo' }, { status: 501 })
}
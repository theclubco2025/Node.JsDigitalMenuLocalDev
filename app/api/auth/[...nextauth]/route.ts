// Keeping placeholder; demo login uses a separate dev-only route. This file remains minimal.
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ ok: false, message: 'Auth not configured' }, { status: 501 })
}

export async function POST() {
  return NextResponse.json({ ok: false, message: 'Auth not configured' }, { status: 501 })
}
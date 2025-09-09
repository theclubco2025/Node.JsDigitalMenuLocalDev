import { NextResponse } from 'next/server'
import { listTenants } from '@/lib/tenant'

export async function GET() {
  const tenants = await listTenants()
  return NextResponse.json({ tenants })
}



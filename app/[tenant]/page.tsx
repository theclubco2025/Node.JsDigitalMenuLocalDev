import { redirect, notFound } from 'next/navigation'
import MenuClient from '@/components/MenuClient'
import IndependentMenuClient from '@/components/IndependentMenuClient'
import { prisma } from '@/lib/prisma'
import type { Metadata } from 'next'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RESERVED_ROUTES = new Set([
  'api',
  'auth',
  'admin',
  'billing',
  'demo',
  'kds',
  'kitchen',
  'menu',
  'order',
  'terms',
  'privacy',
  '_next',
  'assets',
])

type Props = {
  params: Promise<{ tenant: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tenant } = await params
  
  const brandPath = path.join(process.cwd(), 'data', 'tenants', tenant, 'brand.json')
  try {
    if (fs.existsSync(brandPath)) {
      const brand = JSON.parse(fs.readFileSync(brandPath, 'utf-8'))
      return {
        title: brand.name || 'Menu',
        description: brand.tagline || `View the menu for ${brand.name || tenant}`,
      }
    }
  } catch {
    // fallback
  }
  
  return {
    title: 'Menu',
  }
}

export default async function TenantMenuPage({ params }: Props) {
  const { tenant: rawTenant } = await params
  const tenant = rawTenant.toLowerCase()

  if (RESERVED_ROUTES.has(tenant)) {
    notFound()
  }

  const tenantDataPath = path.join(process.cwd(), 'data', 'tenants', tenant)
  const tenantExists = fs.existsSync(tenantDataPath)

  if (!tenantExists) {
    notFound()
  }

  const isPreview = process.env.VERCEL_ENV === 'preview'

  if (tenant === 'independentbarandgrille' || tenant === 'independent-draft') {
    return <IndependentMenuClient />
  }

  if (isPreview) {
    return <MenuClient />
  }

  if (tenant === 'demo' || tenant.endsWith('-draft')) {
    return <MenuClient />
  }

  if (!process.env.DATABASE_URL) {
    return <MenuClient />
  }

  try {
    const row = await prisma.tenant.findUnique({ 
      where: { slug: tenant }, 
      select: { status: true } 
    })
    if (row?.status !== 'ACTIVE') {
      redirect(`/billing?tenant=${encodeURIComponent(tenant)}`)
    }
  } catch {
    return <MenuClient />
  }

  return <MenuClient />
}

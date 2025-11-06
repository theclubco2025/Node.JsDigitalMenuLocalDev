import { promises as fs } from 'fs'
import path from 'path'
import type { Prisma, PrismaClient } from '@prisma/client'
import { writeMenu } from '@/lib/data/menu'
import type { MenuResponse } from '@/types/api'

type TenantBundle = {
  brand?: Record<string, unknown> | null
  images?: Record<string, unknown> | null
  style?: Record<string, unknown> | null
  copy?: Record<string, unknown> | null
  theme?: Record<string, unknown> | null
  menu?: MenuResponse | null
}

const tenantDir = (...segments: string[]) => path.join(process.cwd(), 'data', 'tenants', ...segments)

async function readJsonFile<T = Record<string, unknown>>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf8')
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

type MenuFilePayload = MenuResponse | { menu?: MenuResponse | null } | null

function extractMenu(payload: MenuFilePayload): MenuResponse | null {
  if (!payload) return null
  if (Array.isArray((payload as MenuResponse).categories)) {
    return payload as MenuResponse
  }
  if (typeof payload === 'object' && 'menu' in payload) {
    const nested = (payload as { menu?: MenuResponse | null }).menu
    if (nested && Array.isArray(nested.categories)) {
      return nested
    }
  }
  return null
}

export async function readTenantBundle(slug: string): Promise<TenantBundle | null> {
  const base = tenantDir(slug)
  const exists = await fs
    .access(base)
    .then(() => true)
    .catch(() => false)

  if (!exists) {
    return null
  }

  const [brand, images, style, copy, theme, menu] = await Promise.all([
    readJsonFile<Record<string, unknown>>(tenantDir(slug, 'brand.json')),
    readJsonFile<Record<string, unknown>>(tenantDir(slug, 'images.json')),
    readJsonFile<Record<string, unknown>>(tenantDir(slug, 'style.json')),
    readJsonFile<Record<string, unknown>>(tenantDir(slug, 'copy.json')),
    readJsonFile<Record<string, unknown>>(tenantDir(slug, 'theme.json')),
    readJsonFile<MenuFilePayload>(tenantDir(slug, 'menu.json')),
  ])

  const extractedMenu = extractMenu(menu)

  return {
    brand,
    images,
    style,
    copy,
    theme,
    menu: extractedMenu,
  }
}

function prettifyName(slug: string): string {
  return slug
    .replace(/-draft$/, '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
    .trim()
}

async function ensurePrisma(): Promise<PrismaClient> {
  const mod = await import('@/lib/prisma').catch(() => ({ prisma: undefined as PrismaClient | undefined }))
  if (!mod?.prisma) {
    throw new Error('prisma-not-ready')
  }
  return mod.prisma
}

export async function syncTenantFromFilesystem(slug: string): Promise<boolean> {
  const bundle = await readTenantBundle(slug)
  if (!bundle) {
    return false
  }

  const prisma = await ensurePrisma()

  const settings: Prisma.InputJsonValue = {
    ...(bundle.brand ? { brand: bundle.brand } : {}),
    ...(bundle.images ? { images: bundle.images } : {}),
    ...(bundle.style ? { style: bundle.style } : {}),
    ...(bundle.copy ? { copy: bundle.copy } : {}),
    ...(bundle.theme ? { theme: bundle.theme } : {}),
  }

  await prisma.tenant.upsert({
    where: { slug },
    update: {
      name: prettifyName(slug) || slug,
      settings,
    },
    create: {
      slug,
      name: prettifyName(slug) || slug,
      settings,
    },
  })

  if (bundle.menu) {
    await writeMenu(slug, bundle.menu)
  }

  return true
}

async function writeJsonFile(filePath: string, value: unknown | null) {
  if (value === undefined) return
  if (value === null) {
    return
  }
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf8')
}

export async function cloneTenantFilesystem(from: string, to: string): Promise<boolean> {
  const bundle = await readTenantBundle(from)
  if (!bundle) {
    return false
  }

  await Promise.all([
    writeJsonFile(tenantDir(to, 'brand.json'), bundle.brand ?? null),
    writeJsonFile(tenantDir(to, 'images.json'), bundle.images ?? null),
    writeJsonFile(tenantDir(to, 'style.json'), bundle.style ?? null),
    writeJsonFile(tenantDir(to, 'copy.json'), bundle.copy ?? null),
    writeJsonFile(tenantDir(to, 'theme.json'), bundle.theme ?? null),
    writeJsonFile(tenantDir(to, 'menu.json'), bundle.menu ?? null),
  ])

  return true
}



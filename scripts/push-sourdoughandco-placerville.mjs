#!/usr/bin/env node
// Push Sourdough & Co – Placerville theme/brand/style/copy and menu into Neon
// Slug: placervillesourdoughandco
// Usage: node scripts/push-sourdoughandco-placerville.mjs
// Requires DATABASE_URL in .env.local (or set in environment)

import { readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { PrismaClient } from '@prisma/client'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

function getEnvValueFromEnvLocal(contents, key) {
  const line = contents.split(/\r?\n/).find(l => l.trim().startsWith(key + '='))
  if (!line) return undefined
  const raw = line.slice(key.length + 1).trim()
  return raw.replace(/^"|"$/g, '')
}

async function ensureDatabaseUrl() {
  if (process.env.DATABASE_URL) return
  try {
    const envLocalPath = path.join(repoRoot, '.env.local')
    const buf = await readFile(envLocalPath, 'utf8')
    const val = getEnvValueFromEnvLocal(buf, 'DATABASE_URL')
    if (val) process.env.DATABASE_URL = val
  } catch {}
}

async function main() {
  await ensureDatabaseUrl()
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set. Configure Neon connection in .env.local first.')
  }

  const prisma = new PrismaClient()
  const slug = 'placervillesourdoughandco'

  const base = path.join(repoRoot, 'data', 'tenants', slug)
  const loadJson = async (name) => JSON.parse(await readFile(path.join(base, name), 'utf8'))

  const brand = await loadJson('brand.json').catch(() => null)
  const theme = await loadJson('theme.json').catch(() => null)
  const images = await loadJson('images.json').catch(() => null)
  const style = await loadJson('style.json').catch(() => null)
  const copy = await loadJson('copy.json').catch(() => null)
  const menu = await loadJson('menu.json')

  console.log(`[${slug}] Upserting tenant settings...`)
  const existing = await prisma.tenant.findUnique({ where: { slug }, select: { id: true, settings: true } })
  const mergedSettings = {
    ...(existing?.settings || {}),
    ...(brand ? { brand } : {}),
    ...(theme ? { theme } : {}),
    ...(images ? { images } : {}),
    ...(style ? { style } : {}),
    ...(copy ? { copy } : {}),
  }

  const tenant = await prisma.tenant.upsert({
    where: { slug },
    update: { name: brand?.name || slug, settings: mergedSettings },
    create: { slug, name: brand?.name || slug, settings: mergedSettings },
    select: { id: true },
  })

  // Delete existing menus for a clean re-seed
  const existingMenus = await prisma.menu.findMany({ where: { tenantId: tenant.id }, select: { id: true } })
  if (existingMenus.length) {
    await prisma.menu.deleteMany({ where: { tenantId: tenant.id } })
    console.log(`[${slug}] Cleared ${existingMenus.length} existing menu(s)`)
  }

  console.log(`[${slug}] Creating menu...`)
  const newMenu = await prisma.menu.create({
    data: { tenantId: tenant.id, name: 'Main Menu', description: 'Freshly baked sourdough bread sandwiches, soups, and salads' },
    select: { id: true }
  })

  let catOrder = 0
  for (const cat of menu.categories || []) {
    const createdCat = await prisma.menuCategory.create({
      data: { menuId: newMenu.id, name: cat.name, displayOrder: catOrder++ }
    })
    for (const it of cat.items || []) {
      const createdItem = await prisma.menuItem.create({
        data: {
          categoryId: createdCat.id,
          name: it.name,
          description: it.description || '',
          price: Number(it.price || 0),
          imageUrl: it.imageUrl || null,
          calories: typeof it.calories === 'number' ? it.calories : null,
          available: true,
        }
      })
      for (const tag of (it.tags || [])) {
        await prisma.menuItemTag.create({ data: { itemId: createdItem.id, tag: String(tag) } })
      }
    }
  }

  console.log(`[${slug}] Done. Visit your Vercel URL with ?tenant=${slug}`)
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  process.exit(1)
})

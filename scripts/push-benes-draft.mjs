#!/usr/bin/env node
// Push Benes draft theme/brand/style/copy and menu into Neon for slug "benes-draft"
// Safe to run multiple times; creates a new menu version each run

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
  const slug = 'benes-draft'

  const base = path.join(repoRoot, 'data', 'tenants', 'benes')
  const loadJson = async (name) => JSON.parse(await readFile(path.join(base, name), 'utf8'))

  const brand = await loadJson('brand.json').catch(() => null)
  const theme = await loadJson('theme.json').catch(() => null)
  const images = await loadJson('images.json').catch(() => null)
  const style = await loadJson('style.json').catch(() => null)
  const copy = await loadJson('copy.json').catch(() => null)
  const menu = await loadJson('menu.json')

  console.log('[benes-draft] Upserting tenant settings...')
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

  console.log('[benes-draft] Creating new menu version...')
  const newMenu = await prisma.menu.create({
    data: { tenantId: tenant.id, name: `${slug} menu ${new Date().toISOString()}` },
    select: { id: true }
  })

  for (const cat of menu.categories || []) {
    const createdCat = await prisma.menuCategory.create({
      data: { menuId: newMenu.id, name: cat.name }
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
        }
      })
      for (const tag of (it.tags || [])) {
        await prisma.menuItemTag.create({ data: { itemId: createdItem.id, tag: String(tag) } })
      }
    }
  }

  console.log('[benes-draft] Done. Visit your Vercel URL with ?tenant=benes-draft')
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  process.exit(1)
})




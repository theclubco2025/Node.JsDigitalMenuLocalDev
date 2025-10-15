#!/usr/bin/env node
// One-off: push Independent draft into Neon for slug "independent-draft"
// Safe to run repeatedly; creates a new menu version each run

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

const INPUT = {
  tenant: { slug_live: 'independent', slug_draft: 'independent-draft' },
  branding: {
    name: 'The Independent Restaurant & Bar',
    logoUrl: 'https://images.squarespace-cdn.com/content/v1/652d775c7dfc3727b42cc773/cd438e8d-6bd2-4053-aa62-3ee8a308ee38/Indy_Logo_Light.png?format=1500w',
    colors: {
      primary: '#1E1E1E', accent: '#C4A76A', text: '#FFFFFF', ink: '#111111', card: '#F7F7F7', muted: '#EAEAEA', radius: 12
    },
    headerMode: 'logo'
  },
  copy: {
    tagline: 'Seasonal New American, bar + craft cocktails in the Sierra foothills',
    heroSubtitle: 'A cozy gathering place with fresh flavors & locally inspired spirit.',
    categoryIntros: {
      beginnings: 'Shareable bites to begin your culinary journey.',
      salads: 'Greens, roots & vibrant flavors — made with local produce.',
      sandwiches: 'Handhelds with personality and choice sides.',
      grill: 'Steaks, seafood & more — from fire, pan, and heart.',
      desserts: 'Sweet finales crafted by our pastry chef.'
    },
    specials: 'Ask your server for this week’s specials & cocktail pairings.'
  },
  style: {
    heroVariant: 'logo', navVariant: 'sticky', flags: { specials: true, pairings: true, signatureGrid: false }, accentSecondary: '#A67C52'
  },
  menu: {
    categories: [
      { id: 'beginnings', name: 'Beginnings', items: [
        { id: 'turnip-fries', name: 'Turnip Fries', description: 'Chipotle Aioli & Bleu Cheese Sauces', price: 11.00, diet: [], allergens: ['dairy'] },
        { id: 'beer-battered-potato-fries', name: 'Beer Battered Potato Fries', description: 'Chipotle Aioli & Bleu Cheese Sauces', price: 11.00, diet: [], allergens: ['gluten', 'dairy'] },
        { id: 'calamari', name: 'Calamari', description: 'Flash-fried, served with house cocktail sauce & remoulade', price: 18.00, diet: [], allergens: ['seafood', 'gluten'] },
        { id: 'truffle-mac-and-cheese', name: 'Truffle Mac & Cheese', description: 'White cheddar & parmesan, toasted panko, truffle oil', price: 13.00, diet: ['vegetarian'], allergens: ['dairy', 'gluten'] },
        { id: 'tempura-prawns', name: 'Tempura Prawns', description: 'Wild Mexican prawns, honey-sriracha, bleu cheese slaw', price: 21.00, diet: [], allergens: ['shellfish', 'gluten'] },
        { id: 'ahi-tartare', name: 'Ahi Tartare', description: 'Avocado, ponzu cucumber, mango, daikon sprouts, orange tobiko, wonton chips', price: 18.00, diet: [], allergens: ['fish', 'shellfish', 'gluten'] }
      ]},
      { id: 'salads', name: 'Salads', items: [
        { id: 'heirloom-beet', name: 'Heirloom Beet', description: 'Roasted gold beets, mandarins, shaved shallots, candied walnuts, pancetta, arugula, whipped goat cheese, walnut-sherry vinaigrette', price: 16.00, diet: [], allergens: ['nuts', 'dairy', 'pork'] },
        { id: 'caesar', name: 'Caesar', description: 'Romaine, house Caesar, garlic chips, shaved parmesan, croutons', price: 16.00, diet: [], allergens: ['dairy', 'gluten'] },
        { id: 'mixed-greens', name: 'Mixed Greens', description: 'Carrot, cherry tomato, cucumber, toasted almonds, honey-balsamic vinaigrette', price: 16.00, diet: ['vegetarian'], allergens: ['nuts'] },
        { id: 'the-wedge', name: 'The Wedge', description: 'Iceberg, bacon, red onion, egg, tomato, house-made bleu cheese dressing', price: 16.00, diet: [], allergens: ['egg', 'dairy', 'pork'] },
        { id: 'ahi-nicoise', name: 'Ahi Niçoise', description: 'Sesame-crusted tuna, mixed greens, egg, tomato, olives, new potatoes, fried capers, lemon Dijon vinaigrette', price: 23.00, diet: [], allergens: ['fish', 'egg'] }
      ]},
      { id: 'sandwiches', name: 'Sandwiches', items: [
        { id: 'chicken-banh-mi', name: 'Chicken Banh Mi', description: 'Lemongrass-marinated chicken thigh, pickled daikon & carrot slaw, fresh jalapeño, cilantro, sriracha aioli — choice of side', price: 19.50, diet: [], allergens: ['gluten'] },
        { id: 'blta', name: 'BLTA', description: 'Applewood bacon, avocado, tomato, lettuce, house aioli on sourdough — choice of side', price: 19.50, diet: [], allergens: ['gluten', 'egg'] },
        { id: 'chipotle-grilled-cheese', name: 'Chipotle Grilled Cheese', description: 'Chipotle aioli, white cheddar, hatch mozzarella, caramelized onion, chopped bacon on sourdough — choice of side', price: 16.00, diet: [], allergens: ['gluten', 'dairy', 'egg'] },
        { id: 'french-dip', name: 'French Dip', description: 'Prime beef, caramelized onions, gruyere, horseradish crème fraîche, au jus — side of fries or soup', price: 19.50, diet: [], allergens: ['gluten', 'dairy', 'egg'] }
      ]},
      { id: 'grill', name: 'Grill & Main', items: [
        { id: 'tempura-fish-and-chips', name: 'Tempura Fish & Chips', description: 'True cod, garlic remoulade, house slaw, choice of fries or turnip fries', price: 19.50, diet: [], allergens: ['seafood', 'gluten'] },
        { id: 'classic-independent-burger', name: 'Classic Independent Burger', description: 'House-ground patty, aioli, cheddar, lettuce, tomato, red onion — side included', price: 23.00, diet: [], allergens: ['gluten', 'dairy', 'egg'] },
        { id: 'salmon-avocado-burger', name: 'Salmon Avocado Burger', description: 'Premium salmon patty, avocado, citrus honey dill aioli, lettuce, tomato, side included', price: 23.00, diet: [], allergens: ['fish', 'egg'] },
        { id: 'indy-veggie-burger', name: 'Indy Veggie Burger', description: 'Mushroom & chickpea patty, black garlic aioli, herb tomato confit, lettuce, dill pickle, choice side', price: 20.00, diet: ['vegetarian'], allergens: ['gluten', 'egg'] },
        { id: 'blackened-salmon-tacos', name: 'Blackened Salmon Tacos', description: 'Salmon, chipotle aioli, cabbage, cilantro, salsa fresca — (or 4 prawns for no charge)', price: 21.00, diet: [], allergens: ['fish'] },
        { id: 'certified-hereford-filet-mignon', name: 'Certified Hereford Filet Mignon', description: '5 oz petite filet, demi-glace, choice turnip fries or potato fries + mixed or Caesar salad', price: 30.00, diet: [], allergens: [] },
        { id: 'pacific-salmon', name: 'Pacific Salmon', description: '5 oz grilled salmon, balsamic glaze, herb confit marble potatoes, seasonal vegetables', price: 20.00, diet: [], allergens: ['fish'] }
      ]},
      { id: 'desserts', name: 'Desserts', items: [
        { id: 'malted-caramel-pudding', name: 'Malted Caramel Pudding', description: 'House-made pudding, graham crumble, brûléed bananas, banana-maple whipped cream', price: 0, diet: [], allergens: ['dairy', 'gluten'] }
      ]}
    ]
  }
}

function toTags(item) {
  const d = Array.isArray(item.diet) ? item.diet : []
  const a = Array.isArray(item.allergens) ? item.allergens : []
  return [...d, ...a].map(String)
}

async function main() {
  await ensureDatabaseUrl()
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set')
  const prisma = new PrismaClient()
  const slug = INPUT.tenant.slug_draft

  // Merge settings
  const header = { mode: INPUT.branding.headerMode, logoUrl: INPUT.branding.logoUrl, background: '#ffffff', height: 160 }
  const brand = { name: INPUT.branding.name, header }
  const theme = {
    primary: INPUT.branding.colors.primary,
    accent: INPUT.branding.colors.accent,
    radius: typeof INPUT.branding.colors.radius === 'number' ? `${INPUT.branding.colors.radius}px` : String(INPUT.branding.colors.radius),
    text: INPUT.branding.colors.text,
    ink: INPUT.branding.colors.ink,
    card: INPUT.branding.colors.card,
    muted: INPUT.branding.colors.muted,
  }
  const style = INPUT.style
  const copy = INPUT.copy

  const existing = await prisma.tenant.findUnique({ where: { slug }, select: { id: true, settings: true } })
  const merged = {
    ...(existing?.settings || {}),
    brand,
    theme,
    style,
    copy,
    images: {},
  }

  const tenant = await prisma.tenant.upsert({
    where: { slug },
    update: { name: brand.name, settings: merged },
    create: { slug, name: brand.name, settings: merged },
    select: { id: true }
  })

  // Create a new menu version
  const newMenu = await prisma.menu.create({ data: { tenantId: tenant.id, name: `${slug} menu ${new Date().toISOString()}` }, select: { id: true } })
  for (const c of INPUT.menu.categories) {
    const newCat = await prisma.menuCategory.create({ data: { menuId: newMenu.id, name: c.name } })
    for (const it of c.items) {
      const newItem = await prisma.menuItem.create({
        data: {
          categoryId: newCat.id,
          name: it.name,
          description: it.description || '',
          price: Number(it.price || 0),
          imageUrl: it.imageUrl || null,
          calories: typeof it.calories === 'number' ? it.calories : null,
        }
      })
      for (const tag of toTags(it)) {
        await prisma.menuItemTag.create({ data: { itemId: newItem.id, tag } })
      }
    }
  }

  await prisma.$disconnect()
  console.log('[independent-draft] Pushed theme/config/menu. Visit /t/independent-draft')
}

main().catch(e => { console.error(e); process.exit(1) })



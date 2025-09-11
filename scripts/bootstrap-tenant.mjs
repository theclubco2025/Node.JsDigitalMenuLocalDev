#!/usr/bin/env node
import { promises as fs } from 'fs'
import path from 'path'

function parseArgs() {
  const [, , tenantId, displayName = '', ...rest] = process.argv
  const args = { tenantId, displayName, tone: 'casual', preset: 'lux' }
  for (const part of rest) {
    const m = part.match(/^--(tone|preset)=(.+)$/)
    if (m) args[m[1]] = m[2]
  }
  if (!args.tenantId) {
    console.error('Usage: node scripts/bootstrap-tenant.mjs <tenantId> "Display Name" --tone=upscale --preset=lux')
    process.exit(1)
  }
  return args
}

function presetToTheme(preset, displayName, tone) {
  const map = {
    lux: { primary: '#0b0b0b', accent: '#d4af37', radius: '12px' },
    modern: { primary: '#0b0b0b', accent: '#2563eb', radius: '10px' },
    casual: { primary: '#111827', accent: '#22c55e', radius: '8px' },
  }
  const base = map[preset] || map.lux
  return { name: displayName || 'New Restaurant', tone, ...base }
}

function stubMenu() {
  return {
    categories: [
      { id: 'c-apps', name: 'Appetizers', items: [
        { id: 'i-gb', name: 'Garlic Bread', description: 'Oven‑toasted, herb butter', price: 5.5, tags: ['vegetarian'] }
      ]},
      { id: 'c-mains', name: 'Mains', items: [
        { id: 'i-burger', name: 'Classic Burger', description: 'Aged cheddar, pickles', price: 12, tags: ['beef'] }
      ]},
      { id: 'c-drinks', name: 'Drinks', items: [
        { id: 'i-spark', name: 'Sparkling Water', description: 'Chilled mineral water', price: 3.5, tags: ['vegan','gluten-free'] }
      ]}
    ]
  }
}

async function main() {
  const { tenantId, displayName, tone, preset } = parseArgs()
  const tenantDir = path.join(process.cwd(), 'data', 'tenants', tenantId)
  await fs.mkdir(tenantDir, { recursive: true })
  await fs.writeFile(path.join(tenantDir, 'menu.json'), JSON.stringify(stubMenu(), null, 2), 'utf8')
  await fs.writeFile(path.join(tenantDir, 'theme.json'), JSON.stringify(presetToTheme(preset, displayName, tone), null, 2), 'utf8')
  await fs.writeFile(path.join(tenantDir, 'weights.json'), JSON.stringify({ tags: {} }, null, 2), 'utf8')

  console.log('✔ Tenant bootstrapped:', tenantId)
  console.log('- Next steps:')
  console.log('  1) Import real menu via /admin/tenant or API')
  console.log('  2) Set NEXT_PUBLIC_DEFAULT_TENANT in .env.local if desired')
  console.log(`  3) Visit /menu?tenant=${tenantId}`)
}

main().catch((e) => { console.error(e); process.exit(1) })



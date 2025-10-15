#!/usr/bin/env node
// Seed a tenant's theme, config, and menu into a preview or live base URL
// Usage:
// node scripts/seed-tenant.mjs --slug <slug> --admin <ADMIN_TOKEN> [--bypass <BYPASS_TOKEN>] --base <https://preview.vercel.app>

import fs from 'fs/promises'
import path from 'path'

function parseArgs() {
  const args = process.argv.slice(2)
  const out = {}
  for (let i = 0; i < args.length; i++) {
    const k = args[i]
    const v = args[i + 1]
    if (k.startsWith('--')) {
      out[k.replace(/^--/, '')] = v
      i++
    }
  }
  return out
}

async function main() {
  const { slug, admin, bypass, base } = parseArgs()
  if (!slug || !admin || !base) {
    console.error('Usage: node scripts/seed-tenant.mjs --slug <slug> --admin <ADMIN_TOKEN> [--bypass <BYPASS_TOKEN>] --base <BASE_URL>')
    process.exit(1)
  }

  const baseUrl = base.replace(/\/$/, '')
  const headers = { 'Content-Type': 'application/json', 'X-Admin-Token': admin }
  const cookieHeader = bypass ? { Cookie: `__Secure-vercel-bypass=${bypass}` } : {}

  // Optionally set bypass cookie for Vercel deployment protection
  if (bypass) {
    try {
      await fetch(`${baseUrl}/api/health`, { headers: { Cookie: `__Secure-vercel-bypass=${bypass}` } })
      console.log('Bypass cookie set')
    } catch (e) {
      console.warn('Bypass cookie set failed (continuing):', e?.message || e)
    }
  }

  const tenantDir = path.join(process.cwd(), 'data', 'tenants', slug)
  const readJson = async (p) => {
    try { return JSON.parse(await fs.readFile(p, 'utf8')) } catch { return null }
  }
  const theme = await readJson(path.join(tenantDir, 'theme.json'))
  const brand = await readJson(path.join(tenantDir, 'brand.json'))
  const images = await readJson(path.join(tenantDir, 'images.json'))
  const style = await readJson(path.join(tenantDir, 'style.json'))
  const copy = await readJson(path.join(tenantDir, 'copy.json'))
  const menu = await readJson(path.join(tenantDir, 'menu.json'))

  // Theme (optional)
  if (theme) {
    const res = await fetch(`${baseUrl}/api/theme?tenant=${encodeURIComponent(slug)}`, {
      method: 'POST', headers: { ...headers, ...cookieHeader }, body: JSON.stringify(theme)
    })
    console.log('Theme:', res.status, await res.text().catch(() => ''))
  } else {
    console.log('Theme: skipped (no theme.json)')
  }

  // Config (brand/images/style/copy)
  const configPayload = { brand, images, style, copy }
  const hasConfig = Object.values(configPayload).some(v => v && typeof v === 'object')
  if (hasConfig) {
    const res = await fetch(`${baseUrl}/api/tenant/config?tenant=${encodeURIComponent(slug)}`, {
      method: 'POST', headers: { ...headers, ...cookieHeader }, body: JSON.stringify(configPayload)
    })
    console.log('Config:', res.status, await res.text().catch(() => ''))
  } else {
    console.log('Config: skipped (no brand/images/style/copy)')
  }

  // Menu (optional)
  if (menu) {
    const res = await fetch(`${baseUrl}/api/tenant/import`, {
      method: 'POST', headers: { ...headers, ...cookieHeader }, body: JSON.stringify({ tenant: slug, menu })
    })
    console.log('Menu:', res.status, await res.text().catch(() => ''))
  } else {
    console.log('Menu: skipped (no menu.json)')
  }
}

main().catch((e) => { console.error(e); process.exit(1) })



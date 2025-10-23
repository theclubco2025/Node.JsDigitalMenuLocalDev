#!/usr/bin/env node
// Promote, smoke test, and cache-bust one or more tenants in sequence.
// Usage:
//   node scripts/deploy-tenants.mjs --base https://tccmenus.com --admin 22582811 [--slugs benes,independent,demo] [--bypass <TOKEN>]
// If --slugs is omitted, the script detects tenants that have a matching <slug>-draft folder.

import fs from 'fs/promises'
import path from 'path'

function parseArgs() {
  const args = process.argv.slice(2)
  const out = {}
  for (let i = 0; i < args.length; i++) {
    const key = args[i]
    const val = args[i + 1]
    if (key.startsWith('--')) {
      out[key.replace(/^--/, '')] = val
      i++
    }
  }
  return out
}

async function discoverSlugs() {
  const tenantsDir = path.join(process.cwd(), 'data', 'tenants')
  const entries = await fs.readdir(tenantsDir, { withFileTypes: true })
  const drafts = new Set(entries.filter(e => e.isDirectory() && e.name.endsWith('-draft')).map(e => e.name.replace(/-draft$/, '')))
  return Array.from(entries)
    .filter(e => e.isDirectory() && !e.name.endsWith('-draft'))
    .map(e => e.name)
    .filter(name => drafts.has(name))
}

async function promoteTenant({ baseUrl, adminToken, slug, bypassToken }) {
  const from = `${slug}-draft`
  const res = await fetch(`${baseUrl}/api/tenant/promote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': adminToken,
      ...(bypassToken ? { Cookie: `__Secure-vercel-bypass=${bypassToken}` } : {})
    },
    body: JSON.stringify({ from, to: slug })
  })
  const text = await res.text().catch(() => '')
  console.log(`Promote ${slug}:`, res.status, text)
  if (!res.ok) {
    throw new Error(`Promote failed for ${slug}`)
  }
}

async function smokeTenant({ baseUrl, slug, bypassToken }) {
  const urls = [
    `${baseUrl}/api/health`,
    `${baseUrl}/api/tenant/config?tenant=${encodeURIComponent(slug)}`,
    `${baseUrl}/api/theme?tenant=${encodeURIComponent(slug)}`,
    `${baseUrl}/api/menu?tenant=${encodeURIComponent(slug)}`,
    `${baseUrl}/menu?tenant=${encodeURIComponent(slug)}`
  ]
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: bypassToken ? { Cookie: `__Secure-vercel-bypass=${bypassToken}` } : undefined
      })
      console.log(res.status, url)
      if (!res.ok) {
        throw new Error(`Smoke failure ${res.status} ${url}`)
      }
    } catch (err) {
      console.error('Smoke error:', url, err?.message || err)
      throw err
    }
  }
}

async function bustCache({ baseUrl, slug }) {
  const ts = Date.now()
  const urls = [
    `${baseUrl}/menu?tenant=${encodeURIComponent(slug)}&cacheBust=${ts}`,
    `${baseUrl}/t/${encodeURIComponent(slug)}?cacheBust=${ts}`
  ]
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } })
      console.log('Cache bust', url, res.status)
    } catch (err) {
      console.warn('Cache bust failed:', url, err?.message || err)
    }
  }
}

async function main() {
  const args = parseArgs()
  const base = args.base || 'https://tccmenus.com'
  const adminToken = args.admin || process.env.ADMIN_TOKEN
  const bypass = args.bypass || process.env.VERCEL_BYPASS_TOKEN
  if (!adminToken) {
    console.error('Admin token required. Pass via --admin or set ADMIN_TOKEN env var.')
    process.exit(1)
  }
  const baseUrl = base.replace(/\/$/, '')
  const slugs = args.slugs
    ? args.slugs.split(',').map(s => s.trim()).filter(Boolean)
    : await discoverSlugs()
  if (!slugs.length) {
    console.error('No tenant slugs detected. Provide via --slugs or ensure draft directories exist.')
    process.exit(1)
  }
  console.log('Deploying tenants:', slugs.join(', '))
  for (const slug of slugs) {
    console.log(`\n=== ${slug} ===`)
    await promoteTenant({ baseUrl, adminToken, slug, bypassToken: bypass })
    await smokeTenant({ baseUrl, slug, bypassToken: bypass })
    await bustCache({ baseUrl, slug })
  }
  console.log('\nAll tenants processed successfully.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})



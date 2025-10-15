#!/usr/bin/env node
// Verify that a tenant's config is reachable on a given base
// Usage: node scripts/verify-tenant.mjs --slug <slug> --base <BASE_URL> [--bypass <TOKEN>]

function parseArgs() {
  const args = process.argv.slice(2)
  const out = {}
  for (let i = 0; i < args.length; i++) {
    const k = args[i]
    const v = args[i + 1]
    if (k.startsWith('--')) { out[k.replace(/^--/, '')] = v; i++ }
  }
  return out
}

async function main() {
  const { slug, base, bypass } = parseArgs()
  if (!slug || !base) {
    console.error('Usage: node scripts/verify-tenant.mjs --slug <slug> --base <BASE_URL>')
    process.exit(1)
  }
  const baseUrl = base.replace(/\/$/, '')

  const endpoints = [
    `${baseUrl}/api/tenant/config?tenant=${encodeURIComponent(slug)}`,
    `${baseUrl}/api/theme?tenant=${encodeURIComponent(slug)}`
  ]
  const headers = bypass ? { Cookie: `__Secure-vercel-bypass=${bypass}` } : undefined
  for (const url of endpoints) {
    const res = await fetch(url, { headers })
    const ok = res.ok
    let body = null
    try { body = await res.json() } catch { body = await res.text() }
    console.log(url, res.status, ok ? 'OK' : 'FAIL')
    if (!ok) { console.log(body); process.exit(2) }
  }
}

main().catch((e) => { console.error(e); process.exit(1) })



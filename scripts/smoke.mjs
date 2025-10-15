#!/usr/bin/env node
// Quick smoke test for a base URL and tenant slug
// Usage: node scripts/smoke.mjs --slug <slug> --base <BASE_URL>

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
  const { slug, base } = parseArgs()
  if (!slug || !base) {
    console.error('Usage: node scripts/smoke.mjs --slug <slug> --base <BASE_URL>')
    process.exit(1)
  }
  const baseUrl = base.replace(/\/$/, '')
  const urls = [
    `${baseUrl}/api/health`,
    `${baseUrl}/api/tenant/config?tenant=${encodeURIComponent(slug)}`,
    `${baseUrl}/api/theme?tenant=${encodeURIComponent(slug)}`,
    `${baseUrl}/menu?tenant=${encodeURIComponent(slug)}`
  ]
  for (const u of urls) {
    try {
      const r = await fetch(u)
      console.log(r.status, u)
    } catch (e) {
      console.log('ERR', u, e?.message || e)
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1) })



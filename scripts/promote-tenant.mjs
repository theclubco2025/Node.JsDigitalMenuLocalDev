#!/usr/bin/env node
// Promote draft → live on a given base URL
// Usage: node scripts/promote-tenant.mjs --from <slug-draft> --to <slug> --admin <ADMIN_TOKEN> --base <BASE_URL>

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
  const { from, to, admin, base } = parseArgs()
  if (!from || !to || !admin || !base) {
    console.error('Usage: node scripts/promote-tenant.mjs --from <slug-draft> --to <slug> --admin <ADMIN_TOKEN> --base <BASE_URL>')
    process.exit(1)
  }
  const baseUrl = base.replace(/\/$/, '')
  const headers = { 'Content-Type': 'application/json', 'X-Admin-Token': admin }
  const res = await fetch(`${baseUrl}/api/tenant/promote`, { method: 'POST', headers, body: JSON.stringify({ from, to }) })
  const text = await res.text().catch(() => '')
  console.log('Promote:', res.status, text)
  if (!res.ok) process.exit(2)
}

main().catch((e) => { console.error(e); process.exit(1) })



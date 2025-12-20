#!/usr/bin/env node
// Promote draft → live on a given base URL
// Usage: node scripts/promote-tenant.mjs --from <slug-draft> --to <slug> --admin <ADMIN_TOKEN> --base <BASE_URL> [--bypass <TOKEN>]

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
  const { from, to, admin, base, bypass } = parseArgs()
  if (!from || !to || !admin || !base) {
    console.error('Usage: node scripts/promote-tenant.mjs --from <slug-draft> --to <slug> --admin <ADMIN_TOKEN> --base <BASE_URL>')
    process.exit(1)
  }
  const baseUrl = base.replace(/\/$/, '')
  let cookieHeader = bypass ? { Cookie: `__Secure-vercel-bypass=${bypass}` } : {}
  if (bypass) {
    try {
      const warm = `${baseUrl}/api/health?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=${encodeURIComponent(bypass)}`
      const r = await fetch(warm, { redirect: 'manual' })
      const getSet = r.headers && typeof r.headers.getSetCookie === 'function' ? r.headers.getSetCookie.bind(r.headers) : null
      const setCookies = getSet ? getSet() : (r.headers.get('set-cookie') ? [r.headers.get('set-cookie')] : [])
      const cookie = (setCookies || []).filter(Boolean).map((x) => String(x).split(';')[0]).join('; ')
      if (cookie) cookieHeader = { Cookie: cookie }
    } catch {}
  }

  const headers = { 'Content-Type': 'application/json', 'X-Admin-Token': admin, ...cookieHeader }
  const res = await fetch(`${baseUrl}/api/tenant/promote`, { method: 'POST', headers, body: JSON.stringify({ from, to }) })
  const text = await res.text().catch(() => '')
  console.log('Promote:', res.status, text)
  if (!res.ok) process.exit(2)
}

main().catch((e) => { console.error(e); process.exit(1) })



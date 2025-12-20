#!/usr/bin/env node
// Quick smoke test for a base URL and tenant slug
// Usage: node scripts/smoke.mjs --slug <slug> --base <BASE_URL> [--bypass <TOKEN>]

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
  async function getBypassCookieHeader() {
    if (!bypass) return undefined
    // Preferred: Vercel Deployment Protection bypass flow
    try {
      const u = baseUrl + "/api/health?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=" + encodeURIComponent(bypass)
      const r = await fetch(u, { redirect: "manual" })
      const getSet = r.headers && typeof r.headers.getSetCookie === "function" ? r.headers.getSetCookie.bind(r.headers) : null
      const setCookies = getSet ? getSet() : (r.headers.get("set-cookie") ? [r.headers.get("set-cookie")] : [])
      const cookie = (setCookies || []).filter(Boolean).map((x) => String(x).split(";")[0]).join("; ")
      if (cookie) return { Cookie: cookie }
    } catch {
      // fall back below
    }
    // Fallback: legacy cookie name (some setups still accept this)
    return { Cookie: `__Secure-vercel-bypass=${bypass}` }
  }

  const headers = await getBypassCookieHeader()
  for (const u of urls) {
    try {
      const r = await fetch(u, { headers })
      console.log(r.status, u)
    } catch (e) {
      console.log('ERR', u, e?.message || e)
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1) })



// Verify a preview deployment returns expected tenant data
// Usage: node scripts/verify-preview.mjs <domain> <bypassToken> <tenant>
import https from 'https'

const [,, domain, bypass, tenant] = process.argv
if (!domain || !bypass || !tenant) {
  console.error('usage: node scripts/verify-preview.mjs <domain> <bypassToken> <tenant>')
  process.exit(1)
}

function get(path, cookie) {
  return new Promise((resolve, reject) => {
    https.get({ hostname: domain, path, headers: cookie ? { Cookie: cookie } : {} }, (res) => {
      let body = ''
      res.on('data', (d) => (body += d))
      res.on('end', () => resolve({ status: res.statusCode || 0, headers: res.headers, body }))
    }).on('error', reject)
  })
}

function summarize(jsonStr) {
  try {
    const obj = JSON.parse(jsonStr)
    if (obj && obj.categories) {
      const catNames = obj.categories.map((c) => c.name).slice(0, 5)
      return { kind: 'menu', cats: catNames }
    }
    if (obj && (obj.brand || obj.theme || obj.copy)) {
      return { kind: 'config', brand: obj.brand?.name || null, hasTheme: !!obj.theme, hasCopy: !!obj.copy }
    }
    return { kind: 'other', keys: Object.keys(obj || {}) }
  } catch (e) {
    return { kind: 'raw', length: jsonStr?.length || 0 }
  }
}

async function main() {
  const set = await get(`/api/health?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=${encodeURIComponent(bypass)}`)
  const cookie = (set.headers['set-cookie'] || []).map((x) => x.split(';')[0]).join('; ')
  const cfg = await get(`/api/tenant/config?tenant=${encodeURIComponent(tenant)}`, cookie)
  const menu = await get(`/api/menu?tenant=${encodeURIComponent(tenant)}`, cookie)
  console.log('config', cfg.status, summarize(cfg.body))
  console.log('menu', menu.status, summarize(menu.body))
}

main().catch((e) => { console.error(e); process.exit(1) })




// Import Bene Ristorante Italiano full menu from Sirved and push to our API
// Usage: node scripts/import_benes_from_sirved.mjs

const SIRVED_URL = 'https://www.sirved.com/restaurant/placerville-california-usa/bene-ristorante-italiano/579431/menu'
const TARGETS = [
  { base: 'http://localhost:3001', tenant: 'benes-draft' },
  { base: 'http://localhost:3000', tenant: 'benes' }
]

async function fetchText(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed fetch ${url} ${res.status}`)
  return await res.text()
}

function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40)
}

// Very lightweight parser for Sirved page; attempts to extract category blocks
// and items with name/description/price. If price is missing, default 0.
function parseSirved(html) {
  const cleaned = html
    .replace(/\n|\r/g, ' ')
    .replace(/\s{2,}/g, ' ')

  // Heuristics: find category headings common on Sirved
  const categoryNames = [
    'Antipasti', 'Appetizers', 'Starters', 'Insalate', 'Salads', 'Paste', 'Pasta', 'Pizza', 'Secondi', 'Entrees', 'Mains', 'Dolci', 'Desserts'
  ]

  // Build regex to split by category heading text occurrences
  const catRegex = new RegExp(`(?:${categoryNames.map(n => n.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})`, 'gi')

  // Collect indices of headings
  const indices = []
  let m
  while ((m = catRegex.exec(cleaned))) {
    indices.push({ name: m[0], index: m.index })
  }

  if (indices.length === 0) {
    // Fallback: treat entire page as one category
    return [{ id: 'c-all', name: 'Menu', items: extractItems(cleaned) }]
  }

  // Build category segments
  const categories = []
  for (let i = 0; i < indices.length; i++) {
    const start = indices[i].index
    const end = i + 1 < indices.length ? indices[i + 1].index : cleaned.length
    const name = titleCase(indices[i].name)
    const segment = cleaned.slice(start, end)
    const items = extractItems(segment)
    if (items.length > 0) {
      categories.push({ id: `c-${toSlug(name)}`, name, items })
    }
  }
  // Deduplicate by name, keep first
  const seen = new Set()
  return categories.map(c => ({
    ...c,
    items: c.items.filter(it => {
      const key = it.name.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  })).filter(c => c.items.length > 0)
}

function titleCase(s) {
  return s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

function extractItems(text) {
  const items = []

  // Pattern: Name – Description $Price (flexible separators)
  const itemRegex = /([A-Z][A-Za-z0-9'&()\-\s]{3,}?)(?:\s*[-–:\u2013]\s*|\s{2,})([^$|<>{}]{0,180}?)(?:\s*\$\s*(\d{1,2}(?:\.\d{1,2})?))(?=\s|[,.;]|$)/g
  let m
  while ((m = itemRegex.exec(text))) {
    const name = sanitize(m[1])
    const description = sanitize(m[2])
    const price = Number(m[3]) || 0
    if (!name || name.length < 3) continue
    items.push({
      id: `i-${toSlug(name)}`,
      name,
      description,
      price,
      tags: [],
      imageUrl: ''
    })
  }

  // If none matched, try simpler pattern: Name $Price (no description)
  if (items.length === 0) {
    const simple = /([A-Z][A-Za-z0-9'&()\-\s]{3,}?)\s*\$\s*(\d{1,2}(?:\.\d{1,2})?)/g
    let s
    while ((s = simple.exec(text))) {
      const name = sanitize(s[1])
      const price = Number(s[2]) || 0
      items.push({ id: `i-${toSlug(name)}`, name, description: '', price, tags: [], imageUrl: '' })
    }
  }

  return items
}

function sanitize(s) {
  return (s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

async function postJson(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const text = await res.text()
  try { return { status: res.status, body: JSON.parse(text) } } catch { return { status: res.status, body: { raw: text } } }
}

async function getJson(url) {
  const res = await fetch(url)
  const text = await res.text()
  try { return { status: res.status, body: JSON.parse(text) } } catch { return { status: res.status, body: { raw: text } } }
}

async function run() {
  console.log('Fetching Sirved menu:', SIRVED_URL)
  const html = await fetchText(SIRVED_URL)
  const categories = parseSirved(html)
  const menu = { categories }
  console.log(`Parsed categories: ${categories.length}, items total: ${categories.reduce((a,c)=>a+c.items.length,0)}`)

  for (const t of TARGETS) {
    console.log(`\nImporting for ${t.tenant} at ${t.base} ...`)
    const r = await postJson(`${t.base}/api/tenant/import`, { tenant: t.tenant, menu })
    console.log('Import:', r.status, r.body?.ok ?? r.body)
    const v = await getJson(`${t.base}/api/menu?tenant=${encodeURIComponent(t.tenant)}`)
    console.log('Verify categories:', v.body?.categories?.length ?? 'n/a')
  }
}

run().catch(err => {
  console.error('Import error:', err)
  process.exit(1)
})



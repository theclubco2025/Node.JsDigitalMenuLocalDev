// Headless import of Bene Ristorante Italiano menu from Sirved using Playwright
// Usage: node scripts/import_benes_playwright.mjs

import { chromium } from 'playwright'

const SIRVED_URL = 'https://www.sirved.com/restaurant/placerville-california-usa/bene-ristorante-italiano/579431/menu'
const TARGETS = [
  { base: 'http://localhost:3001', tenant: 'benes-draft' },
  { base: 'http://localhost:3000', tenant: 'benes' }
]

function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 48)
}

function titleCase(s) {
  return s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

function sanitize(s) {
  return (s || '').replace(/\s{2,}/g, ' ').trim()
}

function extractItemsFromText(text) {
  const items = []
  const itemRegex = /([A-Z][A-Za-z0-9'&()\-\s]{3,}?)(?:\s*[-–:\u2013]\s*|\s{2,})([^$\n]{0,200}?)(?:\s*\$\s*(\d{1,2}(?:\.\d{1,2})?))/g
  let m
  while ((m = itemRegex.exec(text))) {
    const name = sanitize(m[1])
    const description = sanitize(m[2])
    const price = Number(m[3]) || 0
    if (!name || name.length < 3) continue
    items.push({ id: `i-${toSlug(name)}`, name, description, price, tags: [], imageUrl: '' })
  }
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
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  await page.goto(SIRVED_URL, { waitUntil: 'load', timeout: 90000 })
  // Give client-side app time to render
  await page.waitForTimeout(8000)
  // Grab the full visible text after the app loads
  const fullText = await page.evaluate(() => (document.body && document.body.innerText) ? document.body.innerText : '')
  await browser.close()

  // Heuristic split by common category words to build sections
  const categoriesList = ['Antipasti','Appetizers','Starters','Insalate','Salads','Paste','Pasta','Pizza','Secondi','Entrees','Mains','Dolci','Desserts']
  const regex = new RegExp(`\\n(?:${categoriesList.join('|')})\\n`, 'gi')

  const segments = []
  let lastIdx = 0
  let match
  // Find headings as lines surrounded by newlines
  const lines = fullText.split('\n')
  const catIndices = []
  for (let i=0;i<lines.length;i++) {
    if (categoriesList.some(c => lines[i].trim().toLowerCase() === c.toLowerCase())) {
      catIndices.push({ name: titleCase(lines[i].trim()), index: i })
    }
  }

  let categories
  if (catIndices.length > 0) {
    categories = []
    for (let i=0;i<catIndices.length;i++) {
      const start = catIndices[i].index
      const end = i+1<catIndices.length ? catIndices[i+1].index : lines.length
      const name = catIndices[i].name
      const text = lines.slice(start, end).join('\n')
      const items = extractItemsFromText(text)
      if (items.length > 0) categories.push({ id: `c-${toSlug(name)}`, name, items })
    }
  } else {
    // Fallback: single category
    categories = [{ id: 'c-menu', name: 'Menu', items: extractItemsFromText(fullText) }]
  }

  const total = categories.reduce((a,c)=>a+c.items.length,0)
  console.log('Parsed categories:', categories.length, 'items:', total)

  for (const t of TARGETS) {
    console.log(`\nImporting for ${t.tenant} at ${t.base} ...`)
    const r = await postJson(`${t.base}/api/tenant/import`, { tenant: t.tenant, menu: { categories } })
    console.log('Import:', r.status, r.body?.ok ?? r.body)
    const v = await getJson(`${t.base}/api/menu?tenant=${encodeURIComponent(t.tenant)}`)
    console.log('Verify categories:', v.body?.categories?.length ?? 'n/a')
  }
}

run().catch(err => {
  console.error('Scrape import error:', err)
  process.exit(1)
})



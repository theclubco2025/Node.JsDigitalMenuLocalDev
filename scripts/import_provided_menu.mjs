// Import provided menu JSON into both tenants after flattening to app format
// Usage: node scripts/import_provided_menu.mjs

import fs from 'node:fs'

const INPUT = 'data/benes/provided_menu.json'
const TARGETS = [
  { base: 'http://localhost:3001', tenant: 'benes-draft' },
  { base: 'http://localhost:3000', tenant: 'benes' }
]

function toSlug(s) {
  return (s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,48)
}

function flattenMenu(src) {
  const out = { categories: [] }
  for (const cat of src.menu.categories) {
    const catName = cat.name
    const catId = 'c-' + toSlug(catName)
    const items = []
    const pushItem = (name, desc, price) => {
      if (typeof price !== 'number' || !isFinite(price)) price = 0
      items.push({ id: 'i-'+toSlug(name), name, description: desc||'', price: Number(price)||0, tags: [], imageUrl: '' })
    }
    if (cat.items) {
      for (const it of cat.items) {
        if (it?.prices && typeof it.prices === 'object') {
          for (const k of Object.keys(it.prices)) {
            pushItem(`${it.name} ${k}"`, it.description, it.prices[k])
          }
          if (Array.isArray(it.variants)) {
            for (const v of it.variants) {
              for (const k of Object.keys(v.prices||{})) {
                pushItem(`${it.name} ${v.name} ${k}"`, v.description||it.description, v.prices[k])
              }
            }
          }
        } else {
          pushItem(it.name, it.description, it.price)
        }
      }
    }
    if (Array.isArray(cat.subcategories)) {
      for (const sub of cat.subcategories) {
        for (const it of (sub.items||[])) {
          if (it?.prices && typeof it.prices === 'object') {
            for (const k of Object.keys(it.prices)) {
              pushItem(`${it.name} ${k}"`, it.description, it.prices[k])
            }
          } else {
            pushItem(it.name, it.description, it.price)
          }
        }
      }
    }
    out.categories.push({ id: catId, name: catName, items })
  }
  return out
}

async function postJson(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'content-type':'application/json' }, body: JSON.stringify(body) })
  const text = await res.text()
  try { return { status: res.status, body: JSON.parse(text) } } catch { return { status: res.status, body: { raw: text } } }
}

async function getJson(url) {
  const res = await fetch(url)
  const text = await res.text()
  try { return { status: res.status, body: JSON.parse(text) } } catch { return { status: res.status, body: { raw: text } } }
}

async function run() {
  const raw = fs.readFileSync(INPUT, 'utf8')
  const src = JSON.parse(raw)
  const menu = flattenMenu(src)
  const total = menu.categories.reduce((a,c)=>a+c.items.length,0)
  console.log('Flattened categories:', menu.categories.length, 'items:', total)
  for (const t of TARGETS) {
    console.log(`\nImporting for ${t.tenant} at ${t.base} ...`)
    const r = await postJson(`${t.base}/api/tenant/import`, { tenant: t.tenant, menu })
    console.log('Import:', r.status, r.body?.ok ?? r.body)
    const v = await getJson(`${t.base}/api/menu?tenant=${encodeURIComponent(t.tenant)}`)
    console.log('Verify categories:', v.body?.categories?.length ?? 'n/a')
  }
}

run().catch(err => { console.error('Provided import error:', err); process.exit(1) })



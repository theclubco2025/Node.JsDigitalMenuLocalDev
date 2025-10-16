#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function main() {
  const [draftSlug, liveSlug, outDir = 'tmp/payloads'] = process.argv.slice(2)
  if (!draftSlug || !liveSlug) {
    console.error('Usage: node scripts/build-live-payloads.mjs <draft-slug> <live-slug> [out-dir]')
    process.exit(1)
  }
  const base = path.join(process.cwd(), 'data', 'tenants', draftSlug)
  const out = path.isAbsolute(outDir) ? outDir : path.join(process.cwd(), outDir)
  ensureDir(out)

  const brand = readJson(path.join(base, 'brand.json'))
  const images = readJson(path.join(base, 'images.json'))
  const style = readJson(path.join(base, 'style.json'))
  const copy = readJson(path.join(base, 'copy.json'))
  const theme = readJson(path.join(base, 'theme.json'))
  const menu = readJson(path.join(base, 'menu.json'))

  fs.writeFileSync(path.join(out, 'config.json'), JSON.stringify({ brand, images, style, copy }))
  fs.writeFileSync(path.join(out, 'theme.json'), JSON.stringify(theme))
  fs.writeFileSync(path.join(out, 'menu.json'), JSON.stringify({ tenant: liveSlug, menu }))

  console.log(out)
}

main()



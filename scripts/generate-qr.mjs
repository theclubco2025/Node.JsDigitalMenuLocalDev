#!/usr/bin/env node
const tenantId = process.argv[2]
const baseUrl = process.argv[3] || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'
if (!tenantId) {
  console.error('Usage: node scripts/generate-qr.mjs <tenantId> [baseUrl]')
  process.exit(1)
}
const target = `${baseUrl.replace(/\/$/, '')}/menu?tenant=${encodeURIComponent(tenantId)}`
const pngUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(target)}`
console.log(pngUrl)



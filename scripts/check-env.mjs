// Simple env auditor (informational only)
// Loads .env.local if present and reports required variables for current features

import { config as dotenvConfig } from 'dotenv'
import { existsSync, readFileSync } from 'fs'

// Load .env.local if present
if (existsSync('.env.local')) {
  dotenvConfig({ path: '.env.local' })
}

const required = [
  // Core
  'NEXT_PUBLIC_DEFAULT_TENANT',
  // Auth/DB (optional at runtime, but recommended for full features)
  'NEXTAUTH_SECRET',
  'DATABASE_URL',
  // Assistant (optional)
  'OPENAI_API_KEY',
  // Stripe (optional)
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
]

const present = []
const missing = []

for (const key of required) {
  if (process.env[key] && String(process.env[key]).trim() !== '') present.push(key)
  else missing.push(key)
}

const info = []
if (existsSync('env.example')) {
  try {
    const lines = readFileSync('env.example', 'utf8').split(/\r?\n/)
    const exampleKeys = lines
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#'))
      .map(l => l.split('=')[0])
    info.push(`env.example keys: ${exampleKeys.filter(Boolean).length}`)
  } catch {}
}

console.log('Environment Check (informational)')
console.log('---------------------------------')
console.log(`Present (${present.length}): ${present.join(', ') || '(none)'}`)
console.log(`Missing (${missing.length}): ${missing.join(', ') || '(none)'}`)
if (info.length) console.log(info.join('\n'))
console.log('\nNotes:')
console.log('- Missing variables may be optional depending on enabled features.')
console.log('- The assistant API supports a fallback mode if AI keys are missing (returns safe retrieval-only answers).')
console.log('- Database and NextAuth are optional unless you use those routes/features.')
process.exit(0)



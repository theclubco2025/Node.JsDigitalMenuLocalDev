import { spawnSync } from 'node:child_process'

function run(cmd, args) {
  // Always capture output so we can inspect errors like P3005,
  // but also stream it to Vercel logs.
  const res = spawnSync(cmd, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    env: process.env,
    shell: process.platform === 'win32',
  })

  if (res.stdout) process.stdout.write(res.stdout)
  if (res.stderr) process.stderr.write(res.stderr)

  if (res.status !== 0) {
    const out = `${res.stdout || ''}\n${res.stderr || ''}`.trim()
    const err = new Error(`Command failed: ${cmd} ${args.join(' ')}${out ? `\n\n${out}` : ''}`)
    err.status = res.status
    err.output = out
    throw err
  }
}

// On Vercel, prefer running migrations during build so production DB stays in sync with code.
// Safe no-op when DATABASE_URL is missing (e.g., static demo builds).
if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
  try {
    run('npx', ['prisma', 'migrate', 'deploy'])
  } catch (e) {
    const msg = String((e && e.message) || '')
    const isP3005 = msg.includes('P3005') || msg.includes('The database schema is not empty')
    const isP3018 = msg.includes('P3018') || msg.includes('A migration failed to apply')
    const isP3009 = msg.includes('P3009') || msg.includes('migrate found failed migrations')

    if (process.env.VERCEL_ENV !== 'production') {
      throw e
    }

    // Production recovery workflow:
    // 1) If DB is pre-existing (P3005), baseline historical migrations.
    // 2) If Prisma sees a failed migration record (P3009/P3018), mark it rolled back.
    // 3) Re-run migrate deploy.
    if (isP3005) {
      const baselineMigrations = [
        '20250911053620_init',
        '20250211120000_p0_patch_modifiers_allergens_audit',
      ]
      for (const m of baselineMigrations) {
        run('npx', ['prisma', 'migrate', 'resolve', '--applied', m])
      }
    }

    if (isP3009 || isP3018) {
      try {
        run('npx', ['prisma', 'migrate', 'resolve', '--rolled-back', '20260211004624_order_customer_contact'])
      } catch {
        // ignore
      }
    }

    run('npx', ['prisma', 'migrate', 'deploy'])
  }
}

// Ensure Prisma client matches schema (helps when caches persist across builds).
run('npx', ['prisma', 'generate'])

run('npx', ['next', 'build'])


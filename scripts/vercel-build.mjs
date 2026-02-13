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

    // If this is an existing production database that was created outside of Prisma Migrate,
    // we need to "baseline" it so new migrations can be deployed.
    if (isP3005 && process.env.VERCEL_ENV === 'production') {
      // Mark the historical migrations as applied, then deploy the new ones.
      // NOTE: This assumes the production DB already matches (or supersets) the init schema.
      const baselineMigrations = [
        '20250911053620_init',
        '20250211120000_p0_patch_modifiers_allergens_audit',
      ]
      for (const m of baselineMigrations) {
        run('npx', ['prisma', 'migrate', 'resolve', '--applied', m])
      }
      // If a previous deploy attempt left a failed migration record, mark it rolled back so it can be re-applied.
      if (isP3018) {
        try {
          run('npx', ['prisma', 'migrate', 'resolve', '--rolled-back', '20260211004624_order_customer_contact'])
        } catch {
          // ignore
        }
      }
      run('npx', ['prisma', 'migrate', 'deploy'])
    } else {
      throw e
    }
  }
}

run('npx', ['next', 'build'])


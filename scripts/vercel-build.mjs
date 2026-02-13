import { spawnSync } from 'node:child_process'

function run(cmd, args, { inherit = true } = {}) {
  const res = spawnSync(cmd, args, {
    stdio: inherit ? 'inherit' : 'pipe',
    encoding: inherit ? undefined : 'utf8',
    env: process.env,
    shell: process.platform === 'win32',
  })
  if (res.status !== 0) {
    const out = inherit ? '' : `${res.stdout || ''}\n${res.stderr || ''}`
    const err = new Error(`Command failed: ${cmd} ${args.join(' ')}${out ? `\n\n${out}` : ''}`)
    // @ts-expect-error attach status
    err.status = res.status
    // @ts-expect-error attach output
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
        // Use inherit to show progress in build logs
        run('npx', ['prisma', 'migrate', 'resolve', '--applied', m])
      }
      run('npx', ['prisma', 'migrate', 'deploy'])
    } else {
      throw e
    }
  }
}

run('npx', ['next', 'build'])


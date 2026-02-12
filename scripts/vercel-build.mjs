import { spawnSync } from 'node:child_process'

function run(cmd, args) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', env: process.env, shell: process.platform === 'win32' })
  if (res.status !== 0) process.exit(res.status ?? 1)
}

// On Vercel, prefer running migrations during build so production DB stays in sync with code.
// Safe no-op when DATABASE_URL is missing (e.g., static demo builds).
if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
  run('npx', ['prisma', 'migrate', 'deploy'])
}

run('npx', ['next', 'build'])


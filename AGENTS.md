# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This is a **Next.js 14 (App Router)** digital restaurant menu SaaS platform ("TCC Menus") with PostgreSQL (Prisma ORM), NextAuth, Stripe, Twilio, and OpenAI integrations. See `docs/FOUNDATION_CONTEXT.md` for full architecture details.

### Services

| Service | Command | Notes |
|---------|---------|-------|
| Next.js dev server | `pnpm dev` | Runs on port 3000 |
| PostgreSQL | `sudo pg_ctlcluster 16 main start` | Must be started before the dev server |

### Key commands

Standard dev commands are in `package.json` scripts. Key ones:
- `pnpm dev` — start dev server
- `pnpm lint` — ESLint via `next lint`
- `pnpm test` — vitest (passes with no test files via `--passWithNoTests`)
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm db:generate` — regenerate Prisma client
- `pnpm db:push` — push schema to database
- `pnpm db:studio` — open Prisma Studio GUI

### Non-obvious caveats

- **Prisma CLI reads `.env`, not `.env.local`**: The Next.js app reads `.env.local`, but `prisma db push` / `prisma generate` reads `.env`. Both files must contain `DATABASE_URL`. The `.env` file is gitignored.
- **Database seeding**: The `prisma.seed` config is not set in `package.json`, so `npx prisma db seed` silently does nothing. Run the seed manually with `SEED_SUPERADMIN_PASSWORD=superadmin123 SEED_OWNER_PASSWORD=restaurant123 npx tsx prisma/seed.ts`.
- **Demo credentials**: Super Admin: `admin@digitalmenusaas.com` / `superadmin123`, Restaurant Owner: `owner@bellavista.com` / `restaurant123` (set via seed env vars).
- **pnpm build scripts**: pnpm v10 blocks build scripts for untrusted packages. After `pnpm install`, esbuild's binary may not be installed. If vitest fails with esbuild errors, run: `node node_modules/.pnpm/esbuild@0.21.5/node_modules/esbuild/install.js` (version may vary — check `node_modules/.pnpm/esbuild@*/`).
- **File-based tenant data fallback**: The app falls back to JSON files in `data/tenants/<slug>/` when database records are missing. The "demo" tenant uses file-based data from `data/tenants/demo/`.
- **Optional services**: OpenAI, Stripe, Twilio, and Google OAuth all degrade gracefully when their environment variables are not set. The menu browsing experience works fully without them.
- **Rate limiting**: Distributed rate limiting uses Upstash Redis (`@upstash/ratelimit`). Requires `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. When not configured, rate limiting is silently skipped (graceful degradation).
- **Assistant CORS**: The `/api/assistant` endpoint uses `ASSISTANT_ALLOWED_ORIGINS` (comma-separated) to restrict cross-origin requests. When not set, all origins are allowed (development default).
- **Kitchen PINs**: All kitchen PINs are stored in `Tenant.settings.kitchenPin` — there are no hardcoded universal PINs. The demo tenant's PIN must be set via the seed script or admin panel.
- **Ops health**: `GET /api/admin/ops/health` requires `X-Admin-Token` header and returns the status of all configured services (DB, Stripe, Upstash, AI, Twilio).
- **Security docs**: See `docs/GO_NO_GO.md` for the production launch checklist and `docs/SECURITY_ROTATION.md` for the secret rotation runbook.

# Foundation Context (Source of Truth)

## Vision
- Multi-tenant restaurant menu SaaS with per-tenant theming and a lean AI assistant.
- File-based data now (`data/tenants/<id>`), DB (Postgres/Prisma) later with same return shapes.

## Data Model
- categories: { id, name, items[] }
- items: { id, name, description?, price, tags[], imageUrl? }

## Theming
- theme.json per tenant: { name?, tone?, primary, accent, radius }
- CSS vars applied in layout: `--primary`, `--accent`, `--radius`; background/header handled separately.

## Assistant
- Single multi-tenant route at `app/api/assistant/route.ts`.
- Uses LLaMA/OpenAI-compatible provider, guarded: returns 501 if key missing.

## Onboarding Flow
1) Intake prompt → collect public business info.
2) Bootstrap tenant folder with stub menu & theme.
3) Import real menu via admin or API.
4) Pick brand variant; tweak theme.
5) Verify on `/menu?tenant=<id>`; generate QR.

## Deploy Notes
- Vercel preferred; wildcard subdomains for tenants. Later: map `<tenant>.domain.com` → tenant resolver.

This document captures minimal context for ongoing development. Keep it short; link paths instead of pasting code.

## Goals
- Multi-tenant, onboarding-ready Next.js + TS
- File-backed tenant data now; Prisma/Postgres later
- Safe env handling; no secrets in code
- One LLaMA-compatible assistant API with lean prompts
- Small, testable edits; visible at http://localhost:3001

## Key Decisions
- Tenant resolution: query param `tenant` (default from `NEXT_PUBLIC_DEFAULT_TENANT`)
- Data today: `data/tenants/<id>/menu.json` (fallback demo)
- Theme: `data/tenants/<id>/theme.json` → CSS vars (`--primary`, `--accent`, `--radius`, `--bg`, `--header`)
- Assistant: POST `/api/assistant` using `lib/ai/model.ts` + `lib/ai/prompt.ts`
  - Provider via env: `AI_PROVIDER`, `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`
  - Prompt: 1 system + 1 user; menu snippet truncated
- Search: client-side filtering (no API refetch per keystroke)

## Routes
- UI: `app/menu/page.tsx` → `components/MenuClient.tsx`
- Admin (dev): `app/admin/tenant/page.tsx`
- API: `GET /api/menu`, `POST /api/assistant`, `POST /api/tenant/import`, `GET /api/tenant/list`

## Important Files
- Types: `types/api.ts`
- Data: `lib/data/menu.ts` (getMenuForTenant, filters, snippet)
- AI: `lib/ai/model.ts`, `lib/ai/prompt.ts`
- Theme: `lib/theme.ts`, `app/layout.tsx`, `app/globals.css`
- Tenant: `lib/tenant.ts`

## Env (env.example)
- `NEXT_PUBLIC_DEFAULT_TENANT="demo"`
- AI: `AI_PROVIDER`, `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`
- Auth/DB (future): `NEXTAUTH_SECRET`, `DATABASE_URL`

## Assistant Rules (lean)
- Only system + user message
- Keep system short; avoid boilerplate
- Use `snippet(menu, limit)` (≤12; reduce if needed)
- Respect filters; suggest closest if none
- Do not attach chat history

### Optional per-tenant rules
- Global defaults: `data/ai.defaults.json`
- Tenant rules: `data/tenants/<tenantId>/ai.json`
- Keep under ~1KB; example schema includes: restaurantName, tone, language, guidelines[], preferTags[], disallowedIngredients[], budget, maxBullets

## UX
- Theming via CSS vars
- Desktop category sidebar with smooth scroll
- Image placeholders if `imageUrl` missing

## Security
- Secrets only via env; placeholders in `env.example`
- `/api/assistant` returns 501 if missing key (non-Ollama)
- `.gitignore` covers envs and keys

## Performance / Context Safety
- Client-side search to prevent API thrash
- Short prompts; lower snippet limit if needed
- Summarize any long per-tenant rules before embedding

## Next Tasks
- Per-request theming from request (layout)
- Tenant scaffold (menu/theme/ai) action
- Optional: Prisma read path
- Deployment presets (Vercel envs, Dockerfile/compose)

## Usage
- Refer to this file in prompts instead of long chat history
- Keep this doc ≤300 lines; update as decisions change

---

## Workflow & CHANGE REPORT Rubric

1) Before edits
- Ask up to 10 precise questions (ports, env, run strategy, DB, provider).
- Propose a short First‑Pass Plan: files to touch, commands to run, env keys needed, and a verification checklist. Wait for confirmation.

2) During edits
- Make the smallest change that works; keep diffs minimal and readable.
- Use `process.env.*` for secrets; update `env.example` with placeholders only.
- Keep the stack stable; no new frameworks unless approved.

3) After edits (always return a short CHANGE REPORT)
- What changed (2–6 bullets)
- Why (1–3 bullets)
- How to verify (exact local URL/steps)
- Draft Conventional Commit message
- Any new env vars (names) and the placeholder lines for `env.example`

4) Local health checks
- Prefer running: `npm test` and `npm run build`.
- If failing, explain briefly and propose a minimal fix.

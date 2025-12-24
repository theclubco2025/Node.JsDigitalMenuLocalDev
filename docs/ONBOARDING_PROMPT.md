### Onboarding Agent Prompt (use for every client)

You are the onboarding agent for `<BUSINESS_NAME>`. Follow this flow exactly so draft → live stays in sync and the assistant works for every tenant.

#### Non‑negotiable guardrails (protect reputation + isolation)
- You MUST operate on **exactly one tenant slug** per onboarding: `<slug>` and `<slug>-draft`. No other tenants.
- You MUST NOT read, write, seed, promote, or “clean up” any other tenant (no “while I’m here…” changes).
- You MUST NOT run batch tools (e.g. `deploy-tenants.mjs` with multiple slugs) unless explicitly approved for the exact slugs listed.
- You MUST treat the tenant slug as the security boundary:
  - Verify every command includes the correct `--slug` / `--from` / `--to`.
  - Verify every URL includes `tenant=<slug>` (or path `/t/<slug>`).
- You MUST NOT change Vercel settings, domains, env vars, Stripe settings, or third‑party systems unless explicitly instructed.
- You MUST NOT paste or commit real secrets/tokens. Use placeholders like `<ADMIN_TOKEN>`.
- You MUST stop and ask if any step would impact tenants other than `<slug>` / `<slug>-draft`.

#### 0. Inputs (fill before starting)
- Tenant slugs: `<slug>-draft` (draft) and `<slug>` (live)
- Client questionnaire responses (brand voice, specials, imagery, AI tone)
- Final menu JSON (items with diet/allergen tags), logos, hero images

#### 1. Prep draft data (`data/tenants/<slug>-draft/`)
- Update `brand.json`, `style.json`, `copy.json`, `menu.json` with the client’s answers.
- Add any feature flags (e.g. `"flags": { "hideCart": true, "emailCapture": true }`).
- Dietary/allergen filtering (sellable + safe):
  - The app supports **diet tags**: `vegetarian`, `vegan`
  - The app supports **explicit free-from tags** when the menu states them: `gluten-free`, `dairy-free`, `nut-free`
  - The app supports **â€œNo X listedâ€** filters (UI) by using inferred `contains-*` tags from the itemâ€™s name/description.
  - **Do not claim â€œgluten-free / dairy-free / nut-freeâ€ unless the menu explicitly states it or the client confirms.**
  - Always keep the on-page disclaimer visible under filters (already in UI). If you change filter UX, preserve/restore that disclaimer.

  Minimum requirement for onboarding tomorrow: ensure items have a reasonable description; the system will infer `contains-*` tags to power â€œNo X listedâ€ filters.

#### 2. Seed draft → Neon (no redeploy needed)
```powershell
node scripts/seed-tenant.mjs --slug <slug>-draft --admin <ADMIN_TOKEN> --base https://tccmenus.com
```
- Verify: `GET https://tccmenus.com/api/menu?tenant=<slug>-draft`
- Preview: Vercel draft URL or `/t/<slug>-draft`

#### 3. Promote draft to live (exact copy)
```powershell
node scripts/promote-tenant.mjs --from <slug>-draft --to <slug> --admin <ADMIN_TOKEN> --base https://tccmenus.com
```
- Verify: `GET https://tccmenus.com/api/menu?tenant=<slug>`
- Live path-first URL: `https://tccmenus.com/t/<slug>`

#### 4. Smoke test and purge cache (ensures UI + API match)
```powershell
node scripts/smoke.mjs --slug <slug> --base https://tccmenus.com
node scripts/deploy-tenants.mjs --base https://tccmenus.com --admin <ADMIN_TOKEN> --slugs <slug>
```
- `smoke.mjs` checks `/api/menu`, `/api/tenant/config`, `/api/theme`, and `/menu`
- `deploy-tenants.mjs` promotes + smokes + cache busts (use for batch updates, e.g. `--slugs benes,independent`)

#### 4. Assistant checks (fallback first)
- `GET https://tccmenus.com/api/assistant` → `{ ok: true }` (or `{ ok: true, fallback: true }`)
- `POST https://tccmenus.com/api/assistant` with sample query → expect retrieval answer
- If you get `"Assistant error"`, grab the Function log entry (`/api/assistant`) and fix `AI_MODEL`/keys before retrying.

#### 5. Optional: enable full AI model
- Env vars (All Environments):
  - `AI_API_KEY` / `AI_KEYS` / `OPENAI_API_KEY`
  - `AI_MODEL` (e.g. `gpt-4o-mini`) — ensure the key is allowed to use it
  - `OPENAI_PROJECT = proj_qrbbVFdxZPwQ7CTSQKulBaL4`
- Redeploy `main` after any code change.
- Failure path: assistant now logs the provider’s response; adjust and redeploy.

#### 6. Final checklist
- `https://tccmenus.com` defaults to Benes (fallback tenant)
- `https://tccmenus.com/<slug>` matches the draft exactly (logo, hero, flags)
- Assistant answers menu questions without unexpected diet warnings
- QR codes stay the same; no new build needed after seeding data

#### 7. Documentation / logging
- Update `docs/FAIL_LOG.md` if a new issue/solution appears
- Note any new feature flags or schema additions for future agents

That’s it. Always work in draft first, seed to live when approved, and rely on feature flags to toggle tenant-specific behavior.


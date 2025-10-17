### Onboarding Agent Prompt (use for every client)

You are the onboarding agent for `<BUSINESS_NAME>`. Follow this flow exactly so draft → live stays in sync and the assistant works for every tenant.

#### 0. Inputs (fill before starting)
- Tenant slugs: `<slug>-draft` (draft) and `<slug>` (live)
- Client questionnaire responses (brand voice, specials, imagery, AI tone)
- Final menu JSON (items with diet/allergen tags), logos, hero images

#### 1. Prep draft data (`data/tenants/<slug>-draft/`)
- Update `brand.json`, `style.json`, `copy.json`, `menu.json` with the client’s answers.
- Add any feature flags (e.g. `"flags": { "hideCart": true, "emailCapture": true }`).
- Ensure diet/allergen tags are present so the assistant responds correctly.

#### 2. Seed draft → Neon (no redeploy needed)
```powershell
node scripts/seed-tenant.mjs --slug <slug>-draft --admin 22582811 --base https://tccmenus.com
```
- Verify: `GET https://tccmenus.com/api/menu?tenant=<slug>-draft`
- Preview: Vercel draft URL or `/t/<slug>-draft`

#### 3. Promote draft to live (exact copy)
```powershell
node scripts/seed-tenant.mjs --slug <slug> --admin 22582811 --base https://tccmenus.com
```
- Verify: `GET https://tccmenus.com/api/menu?tenant=<slug>`
- Live path-first URL: `https://tccmenus.com/t/<slug>`

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


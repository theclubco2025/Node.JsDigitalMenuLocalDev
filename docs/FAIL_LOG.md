Digital Menu SaaS – Fail Log and Resolutions

1) Preview shows “rough draft” or wrong tenant
- Symptom: Branch preview renders generic stub (title “Menu”) instead of tenant-specific content.
- Root cause: Tenant resolution inconsistencies and DB settings/menu empty; preview query param mismatched.
- Fixes in repo:
  - middleware: normalize /menu to Vercel branch slug in preview; add path-first alias and root → benes.
  - config API: prefer non-empty DB values; fall back to filesystem and then draft tenant (DB→FS).
  - menu loader: prefer live, then draft FS; avoid stub for non-demo tenants.
- SOP:
  - Ensure data/tenants/<slug>-draft/*.json are committed.
  - Use /t/<slug> or /<slug> path to verify rendering.

2) Promote draft → live fails with “Source tenant not found”
- Symptom: POST /api/tenant/promote returns 404 Source tenant not found.
- Root cause: Draft tenant doesn’t exist in DB yet (filesystem only).
- New ubiquitous fix:
  - promote route now falls back to filesystem when DB source missing. It copies brand/images/style/copy/theme/menu from data/tenants/<from> into live <to>.
- SOP:
  - If 404, retry promote. If still blocked, seed via /api/tenant/config, /api/theme, /api/tenant/import.

3) Assistant shows “disabled in dev”
- Symptom: Chat assistant badge shows disabled when AI keys are not configured.
- Root cause: AI provider guard required OPENAI/compatible keys.
- New ubiquitous fix:
  - Assistant endpoint now returns a retrieval-only fallback response (top-k menu items) when no keys are set.
- SOP:
  - To enable full AI, set AI_API_KEY (or AI_KEYS) and AI_MODEL. Otherwise fallback remains active.

4) Vercel deployment protection blocks automated calls
- Symptom: 401/403 from preview when scripting.
- Fixes:
  - Use X-Admin-Token header and bypass cookie in scripts.
- SOP:
  - Include 'X-Admin-Token' and (if needed) bypass cookie in requests.

5) Env var scope mismatches (DATABASE_URL)
- Symptom: 501 DATABASE_URL required on production writes.
- SOP:
  - In Vercel → Project → Settings → Environment Variables, set DATABASE_URL + ADMIN_TOKEN for Production and Preview. Re-deploy.



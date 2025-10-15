### Tenant Onboarding Prompt (Reusable for every client)

- Goal: Onboard a new tenant using the existing app as the foundation. Keep backend features intact; personalize frontend (theme, assets, copy) and import the client’s menu. Persist all data to Neon Postgres. Use draft first, then promote to live.

- Environment
  - Dev Main: http://localhost:3000 (Neon main branch)
  - Dev Test: http://localhost:3001 (Neon test branch)
  - Database: Neon Postgres (one database per environment; many tenants). Do NOT create per-client DBs/URLs.

- Inputs (fill before starting)
  - Tenant slug(s): {TENANT_SLUG} and optional {TENANT_SLUG}-draft
  - Sources: menu links (Sirved/site/Yelp) and/or menu photos for OCR
  - Branding inputs: logo URL or homepage URL (derive palette), optional accent/font

- Core endpoints (data-only, no redeploy)
  - Health: GET /api/health
  - Menu read: GET /api/menu?tenant={TENANT_SLUG}
  - Tenant config read/write: GET/POST /api/tenant/config?tenant={TENANT_SLUG}
    - Fields: brand, images, style (heroVariant/navVariant/flags/featuredIds), copy
  - Theme read/write: GET/POST /api/theme?tenant={TENANT_SLUG}
    - Fields: primary, accent, radius (and optional text/ink/card/muted)
  - Menu import (replace): POST /api/tenant/import
  - Promote draft→live: POST /api/tenant/promote { from, to }

- Draft → Live model
  - Simple path: use two slugs: {TENANT_SLUG}-draft for editing; {TENANT_SLUG} for live
  - Optional: add a publish flag on Menu later; until then, use the draft slug

### Agent-led onboarding (data-first; no repo edits)
1) Choose slugs: `{TENANT_SLUG}-draft` for editing; `{TENANT_SLUG}` for live
2) Prepare inputs (no local files needed):
   - menu JSON, images map (id→url), brand (name/logoUrl/header), theme (colors/radius), style (variants/flags), copy
3) Set theme
   - POST /api/theme?tenant={TENANT_SLUG}-draft → { ok: true }
4) Set config (brand/images/style/copy)
   - POST /api/tenant/config?tenant={TENANT_SLUG}-draft → { ok: true }
5) Import menu
   - POST /api/tenant/import with { tenant: "{TENANT_SLUG}-draft", menu }
6) Verify
  - GET /api/menu?tenant={TENANT_SLUG}-draft
  - Live preview on Vercel: open preview host + /menu (tenant auto-derived); pretty path `/t/{TENANT_SLUG}-draft` also supported
7) Promote to live (no redeploy)
   - POST /api/tenant/promote with { from: "{TENANT_SLUG}-draft", to: "{TENANT_SLUG}" }
   - Live view: /t/{TENANT_SLUG}

### Verification checklist
- 3001 (test)
  - GET /api/health → ok
  - POST /api/theme?tenant={TENANT_SLUG}-draft → { ok: true }
  - POST /api/tenant/import (draft) → { ok: true }
  - GET /api/menu?tenant={TENANT_SLUG}-draft → includes items/categories
  - Admin Save All on /menu?tenant={TENANT_SLUG}-draft&admin=1 persists to DB
- 3000 (main) repeat with {TENANT_SLUG}

### Security (prod)
- POST /api/tenant/import requires header X-Admin-Token: {ADMIN_TOKEN}
- CORS allows Content-Type, Authorization, X-Admin-Token

### Data model (summary)
- Tenant (slug, name, settings)
- Menu → MenuCategory → MenuItem → MenuItemTag
- Theme stored in Tenant.settings.theme

### Commands (reference)
- Start main: npm run dev -- -p 3000
- Start test (with Neon test branch DATABASE_URL): npm run dev -- -p 3001
- Prisma Studio (DB inspect): npx prisma studio

### Deliverables
- Draft tenant at 3001: /menu?tenant={TENANT_SLUG}-draft (on-brand)
- Live tenant at 3000: /menu?tenant={TENANT_SLUG}
- Short note of theme values and any asset URLs used

### LAN-first preview (dev) and Vercel (prod)
- Find LAN IP (Windows):
  - PowerShell: `ipconfig | findstr /R "IPv4"` → pick Wi‑Fi IPv4 (e.g., 10.0.0.138)
- Start dev bound to LAN:
  - `npm run dev -- -p 3000 -H <LAN_IP>`
- Optional tunnel (phone-friendly HTTPS):
  - `npx --yes cloudflared@latest tunnel --url http://<LAN_IP>:3000 --no-autoupdate`
  - Wait for `https://*.trycloudflare.com` URL in output.

Required agent output (dev)
- LAN URL: `http://<LAN_IP>:3000/menu?tenant={TENANT_SLUG}`
- Tunnel URL (if started): `https://<sub>.trycloudflare.com/menu?tenant={TENANT_SLUG}`
- QR for LAN preview:
  - `node scripts/generate-qr.mjs {TENANT_SLUG} http://<LAN_IP>:3000`
  - Paste PNG URL.
- 5 screenshots: hero, chips, two categories, one item with calories visible.
- Changelog: one paragraph describing brand/theme/style/copy/images changes.
- PR: only `data/tenants/{TENANT_SLUG}/**` files.

After deploy (prod)
- Path-first live URL: `https://tccmenus.com/t/{TENANT_SLUG}`
- Update QR with production domain (if requested):
  - `node scripts/generate-qr.mjs {TENANT_SLUG} https://tccmenus.com`

Guardrails
- No edits outside `data/tenants/{TENANT_SLUG}/**` for tenant PRs.
- Lint/typecheck must pass.
- California disclaimer + calories visible.
- Variants/flags driven by `style.json` (no tenant-name checks in code).

### Notes
- One DATABASE_URL per environment; many tenants share the same DB.
- Occasional pooled connection “closed” logs from Neon are normal; retries succeed.


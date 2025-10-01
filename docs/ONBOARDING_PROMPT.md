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

- Core endpoints
  - Health: GET /api/health
  - Menu read: GET /api/menu?tenant={TENANT_SLUG}
  - Tenant config: GET /api/tenant/config?tenant={TENANT_SLUG}
  - Theme read/write: GET/POST /api/theme?tenant={TENANT_SLUG}
  - Menu import: POST /api/tenant/import

- Draft → Live model
  - Simple path: use two slugs: {TENANT_SLUG}-draft for editing; {TENANT_SLUG} for live
  - Optional: add a publish flag on Menu later; until then, use the draft slug

### Agent-led onboarding (test branch first on 3001)
1) Create tenant folder `data/tenants/{TENANT_SLUG}-draft`
2) Scrape/OCR menu → generate:
   - `menu.json` (flat categories/items)
   - `images.json` (itemId → imageUrl)
   - `brand.json` (header mode/logo/links)
   - `theme.json` (colors/radius)
3) Set theme (dev: filesystem via theme.json; prod: DB)
   - POST http://localhost:3001/api/theme?tenant={TENANT_SLUG}-draft
   - Body (example)
     {
       "primary": "#111827",
       "accent": "#16a34a",
       "radius": "12px"
     }
   - Note: Use Postman/Insomnia to avoid shell JSON escaping issues
4) Import menu (DB-backed or FS fallback)
   - POST http://localhost:3001/api/tenant/import
   - Body
     {
       "tenant": "{TENANT_SLUG}-draft",
       "menu": {MENU_JSON}
     }
5) Verify reads
   - GET http://localhost:3001/api/menu?tenant={TENANT_SLUG}-draft → JSON reflects import
6) Inline admin edit
   - http://localhost:3001/menu?tenant={TENANT_SLUG}-draft&admin=1
   - Make edits → Save All → confirm persisted via GET /api/menu
7) Promote to live (3000)
   - Repeat theme and import for {TENANT_SLUG} on http://localhost:3000
   - Live view: /menu?tenant={TENANT_SLUG}
   - Admin: /menu?tenant={TENANT_SLUG}&admin=1

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
- Vercel URL: `https://<project>.vercel.app/menu?tenant={TENANT_SLUG}`
- Update QR with Vercel base if requested:
  - `node scripts/generate-qr.mjs {TENANT_SLUG} https://<project>.vercel.app`

Guardrails
- No edits outside `data/tenants/{TENANT_SLUG}/**` for tenant PRs.
- Lint/typecheck must pass.
- California disclaimer + calories visible.
- Variants/flags driven by `style.json` (no tenant-name checks in code).

### Notes
- One DATABASE_URL per environment; many tenants share the same DB.
- Occasional pooled connection “closed” logs from Neon are normal; retries succeed.


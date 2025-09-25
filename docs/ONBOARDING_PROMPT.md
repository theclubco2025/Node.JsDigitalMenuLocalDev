### Tenant Onboarding Prompt (Reusable for every client)

- Goal: Onboard a new tenant using the existing app as the foundation. Keep backend features intact; personalize frontend (theme, assets, copy) and import the client’s menu. Persist all data to Neon Postgres. Use draft first, then promote to live.

- Environment
  - Dev Main: http://localhost:3000 (Neon main branch)
  - Dev Test: http://localhost:3001 (Neon test branch)
  - Database: Neon Postgres (one database per environment; many tenants). Do NOT create per-client DBs/URLs.

- Inputs (fill before starting)
  - Tenant slug(s): {TENANT_SLUG} and optional {TENANT_SLUG}-draft
  - Menu source: {MENU_URL} or structured items (name, description, price, tags, imageUrl, calories)
  - Branding: primary color, accent color, border radius, logo/image URLs; or “derive from site”

- Core endpoints
  - Health: GET /api/health
  - Menu read: GET /api/menu?tenant={TENANT_SLUG}
  - Theme read/write: GET/POST /api/theme?tenant={TENANT_SLUG}
  - Menu import: POST /api/tenant/import

- Draft → Live model
  - Simple path: use two slugs: {TENANT_SLUG}-draft for editing; {TENANT_SLUG} for live
  - Optional: add a publish flag on Menu later; until then, use the draft slug

### Step-by-step (test branch first on 3001)
1) Create/ensure tenant exists implicitly during writes
2) Set theme (DB-backed)
   - POST http://localhost:3001/api/theme?tenant={TENANT_SLUG}-draft
   - Body (example)
     {
       "primary": "#111827",
       "accent": "#16a34a",
       "radius": "12px"
     }
   - Note: Use Postman/Insomnia to avoid shell JSON escaping issues
3) Import menu (DB-backed)
   - POST http://localhost:3001/api/tenant/import
   - Body
     {
       "tenant": "{TENANT_SLUG}-draft",
       "menu": {MENU_JSON}
     }
4) Verify reads
   - GET http://localhost:3001/api/menu?tenant={TENANT_SLUG}-draft → JSON reflects import
5) Inline admin edit
   - http://localhost:3001/menu?tenant={TENANT_SLUG}-draft&admin=1
   - Make edits → Save All → confirm persisted via GET /api/menu
6) Promote to live (3000)
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

### Notes
- One DATABASE_URL per environment; many tenants share the same DB.
- Occasional pooled connection “closed” logs from Neon are normal; retries succeed.


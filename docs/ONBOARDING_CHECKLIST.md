# Onboarding Checklist (≤ 60 minutes)

1) Create tenant id
- Pick a unique, kebab-case `tenantId` (e.g., `oak-street-bistro`).

2) Bootstrap tenant folder
```bash
node scripts/bootstrap-tenant.mjs oak-street-bistro "Oak Street Bistro" --tone="upscale" --preset=lux
```

3) Run dev and verify
```bash
npm run dev -- -p 3001
# Visit: http://localhost:3001/menu?tenant=oak-street-bistro
```

4) Import real menu (optional now)
- Paste JSON in `/admin/tenant` (dev page) or:
```bash
curl -X POST http://localhost:3001/api/tenant/import \
  -H "Content-Type: application/json" \
  -d '{"tenant":"oak-street-bistro","menu":{ "categories": [] }}'
```

5) Pick brand variant
- Edit `data/tenants/<id>/theme.json` or choose a preset from `docs/prompts/brand_variants.md`.

6) Generate QR to share
```bash
node scripts/generate-qr.mjs oak-street-bistro
```
Open the printed URL; it should land on `/menu?tenant=<id>`.

7) Finalize
- Set default tenant for demo/testing in `.env.local`: `NEXT_PUBLIC_DEFAULT_TENANT=<id>`
- Commit and push.



### Onboarding Checklist (Path-first; fast)

1) Choose slug (short): `<slug>`; draft branch: `<slug>-draft`.
2) Push draft branch; open preview `/menu` (tenant auto-derived).
3) Seed draft:
   - `node scripts/seed-tenant.mjs --slug <slug>-draft --admin <ADMIN_TOKEN> --bypass <TOKEN?> --base https://<preview-host>`
4) Verify:
   - `node scripts/verify-tenant.mjs --slug <slug>-draft --base https://<preview-host>` and refresh page.
5) Approve → Promote:
   - `node scripts/promote-tenant.mjs --from <slug>-draft --to <slug> --admin <ADMIN_TOKEN> --base https://<preview-host>`
6) Live QR (stable):
   - `node scripts/generate-qr.mjs <slug> https://tccmenus.com`

Notes
- Never use preview URLs for QR codes.
- Data edits do not require redeploys; refresh to see changes.
- Code changes redeploy without altering the live path.

Ordering (optional)
- Ordering is **off by default**; enable per-tenant via `Tenant.settings.ordering.enabled=true`.
- Scheduling defaults for testing: PST (`America/Los_Angeles`), 15-min slots, 30-min lead time, 24/7 hours until configured.
- Stripe food-order webhooks require `STRIPE_ORDERS_WEBHOOK_SECRET` (separate from subscription billing webhook).
- Admin orders page: `/admin/orders`

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



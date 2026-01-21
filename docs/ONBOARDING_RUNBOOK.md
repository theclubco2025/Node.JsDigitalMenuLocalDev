## Onboarding Runbook (20–30 minutes per tenant)

### Prereqs
- env: fill `.env.local` from `env.example` (DATABASE_URL, NEXTAUTH_SECRET, ADMIN_TOKEN, AI keys if used).
- Local build: `npm run build` once to catch lint/type issues.

### Flow
1) Create draft tenant
- Generate slug `<slug>-draft`. Seed menu/theme/images/style/copy in Neon (or import via `/api/tenant/import`).

2) Live edit in preview
- Open `/menu?tenant=<slug>-draft&admin=1`.
- Sign in (NextAuth) as the tenant owner to Save without a token, or append `&token=YOUR_ADMIN_TOKEN` for super edits.
- Make edits inline, click Save (writes to Neon). Refresh to verify.

3) Verify assistant
- Use the Ask button. Assistant only recommends items from this tenant, respects dietary filters.

3.5) (Optional) Enable Ordering (preview-only until approved)
- Ordering is **disabled by default** and must be enabled per-tenant via `Tenant.settings.ordering.enabled=true`.
- Defaults (for testing): timezone **PST** (`America/Los_Angeles`) and **24/7 hours** if hours are not configured yet.
- Stripe orders webhook uses a separate secret: `STRIPE_ORDERS_WEBHOOK_SECRET` (do not reuse the billing webhook secret).
- Admin orders queue (after login): `/admin/orders`

4) Publish
- Click Publish in the admin bar to promote `<slug>-draft` → `<slug>`.

5) (Optional) Subdomain
- In Vercel, add wildcard domain (e.g. `*.menu.yourdomain.com`).
- Map subdomains to tenant slugs in resolver when you’re ready.

### Troubleshooting
- 405 on `/api/assistant`: ensure GET/POST/OPTIONS/HEAD are present; CORS echoing Origin; `dynamic='force-dynamic'`.
- White screen in dev: middleware matcher must exclude `/_next/*`.
- Edits not showing: confirm Neon `DATABASE_URL` and that config endpoint prefers DB.



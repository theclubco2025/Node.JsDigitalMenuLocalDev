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

4) Publish
- Click Publish in the admin bar to promote `<slug>-draft` → `<slug>`.

5) (Optional) Subdomain
- In Vercel, add wildcard domain (e.g. `*.menu.yourdomain.com`).
- Map subdomains to tenant slugs in resolver when you’re ready.

### Demo Admin (POC) Flow
- Share `/demo-admin/setup` with restaurant stakeholders. They enter the shared `DEMO_ADMIN_ACCESS_CODE` (only) and optionally set a display name.
- On unlock, we upsert/refresh a tenant owner using `DEMO_ADMIN_EMAIL`, hash the access code as the password, and automatically sign them into `/admin/demo`.
- `/admin/demo` shows the live demo menu (`demo`) with inline fields for name, description, price, tags. Blur to persist each field.
- Promotion requires the same access code and calls `/api/admin/demo/promote`, which mirrors draft → live via the standard promote API.
- Update `env` with both `DEMO_ADMIN_ACCESS_CODE` and `DEMO_ADMIN_EMAIL` before deploying a demo branch.

### Troubleshooting
- 405 on `/api/assistant`: ensure GET/POST/OPTIONS/HEAD are present; CORS echoing Origin; `dynamic='force-dynamic'`.
- White screen in dev: middleware matcher must exclude `/_next/*`.
- Edits not showing: confirm Neon `DATABASE_URL` and that config endpoint prefers DB.



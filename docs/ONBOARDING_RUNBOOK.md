## Onboarding Runbook (20–30 minutes per tenant)

### Tenant isolation rules (must follow)
- Treat the tenant slug as the boundary. During one onboarding you may touch **only**:
  - `<slug>-draft` (draft)
  - `<slug>` (live)
- Do not seed/promote/verify any other tenant. No “cleanup” on other tenants.
- Never run batch scripts with multiple slugs unless explicitly approved and listed.
- Never change domains/env vars/Stripe/third‑party systems unless explicitly requested.

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

3.5) (Optional) Enable Ordering
- Ordering is **disabled by default** and must be enabled per-tenant via `Tenant.settings.ordering.enabled=true`.
- Defaults (for testing): timezone **PST** (`America/Los_Angeles`) and **24/7 hours** if hours are not configured yet.
- Stripe orders webhook uses a separate secret: `STRIPE_ORDERS_WEBHOOK_SECRET` (do not reuse the billing webhook secret).
  - Endpoint URL: `https://YOURDOMAIN.com/api/orders/stripe-webhook`
  - Required events:
    - `checkout.session.completed`
    - `checkout.session.async_payment_succeeded`
- In **production**, ordering requires `STRIPE_ORDERS_WEBHOOK_SECRET` to be set (checkout is blocked without it).
- Health check: `/api/orders/health`
- Admin orders queue (after login): `/admin/orders`

3.6) Kitchen Display System (KDS) setup + verification
- Set a **Kitchen PIN** in the admin editor:
  - Login → `/admin/menu`
  - Restaurant settings → **Kitchen PIN** → Save
- Verify staff flow:
  - Staff goes to `/kds`, enters the PIN, and lands on `/kitchen?tenant=<slug>`.
- Verify status transitions (must work before you ship):
  - Place an order and confirm it appears in **New Orders**.
  - Tap **Start Preparing** → order moves to **Preparing**.
  - Tap **Mark Ready** → order moves to **Ready**.
  - Tap **Complete** (or swipe right) → order clears from the active board and appears in History.

3.7) Customer order-status copy (editable per restaurant)
- In the admin editor (`/admin/menu`), set:\n+  - Pickup final step label + ready message\n+  - Dine-in final step label + ready message\n+  - Pickup-code helper text\n+- Verify:\n+  - On the customer Order Confirmed screen (`/order/success?order=...`), the final step label and “ready” message reflect your saved copy.\n+  - If you edit this copy while the page is open, it should update automatically within ~15 seconds.\n+
4) Publish
- Click Publish in the admin bar to promote `<slug>-draft` → `<slug>`.

5) (Optional) Subdomain
- In Vercel, add wildcard domain (e.g. `*.menu.yourdomain.com`).
- Map subdomains to tenant slugs in resolver when you’re ready.

### Troubleshooting
- 405 on `/api/assistant`: ensure GET/POST/OPTIONS/HEAD are present; CORS echoing Origin; `dynamic='force-dynamic'`.
- White screen in dev: middleware matcher must exclude `/_next/*`.
- Edits not showing: confirm Neon `DATABASE_URL` and that config endpoint prefers DB.



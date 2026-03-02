# Go / No-Go Checklist (Before Selling)

Use this checklist before going live with a new deployment or onboarding paying customers.

---

## Security

- [ ] No hard-coded tokens/pins in repo
- [ ] Kitchen PINs stored per-tenant in `Tenant.settings.kitchenPin` (no universal PINs)
- [ ] `/api/debug/*` returns 404 in production without admin token
- [ ] `/api/assistant` rejects disallowed browser origins (CORS via `ASSISTANT_ALLOWED_ORIGINS`)
- [ ] Rate limiting enabled in production (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`)
- [ ] `ADMIN_TOKEN` set and required for `/api/admin/ops/health`

**Verification:**
```bash
# Should return 404 or require auth in production
curl -s https://tccmenus.com/api/debug/fingerprint | jq

# Should show upstashConfigured: true
curl -s -H "X-Admin-Token: YOUR_TOKEN" https://tccmenus.com/api/admin/ops/health | jq
```

---

## Environment Variables

- [ ] `DATABASE_URL` configured and DB accessible
- [ ] `NEXTAUTH_SECRET` set (32+ random characters)
- [ ] `NEXTAUTH_URL` matches production domain
- [ ] `ADMIN_TOKEN` set for protected endpoints
- [ ] `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` configured
- [ ] `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` configured (billing)
- [ ] `STRIPE_ORDERS_SECRET_KEY` + `STRIPE_ORDERS_WEBHOOK_SECRET` configured (ordering)
- [ ] `ASSISTANT_ALLOWED_ORIGINS` set to production domains

**Verification:**
```bash
# Run the env verification script in docs/VERCEL_ENV_VARS.md
./verify-env.sh https://tccmenus.com YOUR_ADMIN_TOKEN
```

---

## Core Flows

### Menu
- [ ] Menu loads for an ACTIVE tenant
- [ ] Menu displays categories, items, prices, and images
- [ ] Search/filter works on menu
- [ ] Theme/branding applies correctly

**Verification:** Visit `https://tccmenus.com/t/YOUR-TENANT`

### Billing
- [ ] Unpaid tenant is consistently gated (billing redirect / 402 API response)
- [ ] Billing checkout creates Stripe session
- [ ] After payment, tenant becomes ACTIVE
- [ ] QR code displays on billing success page (properly sized on desktop)

**Verification:** Test checkout flow with Stripe test card

### Ordering
- [ ] Checkout creates order and Stripe Checkout Session
- [ ] Stripe webhook marks paid orders (`status: NEW`)
- [ ] Paid orders appear in KDS immediately
- [ ] Order success page shows pickup code
- [ ] Status updates propagate to customer page (without aggressive polling)

**Verification:**
```bash
curl -s https://tccmenus.com/api/orders/health | jq '.env.ordersWebhookOk'
# Expected: true
```

### Kitchen Display (KDS)
- [ ] KDS PIN entry works at `/kds`
- [ ] Orders flow: NEW → PREPARING → READY → COMPLETED
- [ ] Sound notifications work when enabled
- [ ] Allergy flags display for orders with allergy notes

**Verification:** Place test order and process through KDS

### SMS Notifications (Optional)
- [ ] Twilio credentials configured (if enabled)
- [ ] READY notifications sent to opted-in customers
- [ ] SMS status shows in KDS

---

## UI/UX Quality

- [ ] Landing page loads and displays correctly
- [ ] QR code visible and properly sized on both mobile and desktop
- [ ] Menu mobile experience smooth and responsive
- [ ] Cart/checkout flow intuitive
- [ ] Order success page displays all relevant info
- [ ] KDS readable on tablet/desktop screens

---

## Performance Targets (Minimum)

| Endpoint | p95 Latency | Max Error Rate |
|----------|-------------|----------------|
| Menu browsing | < 400ms | < 0.5% |
| Order status | < 500ms | < 1% |
| AI Assistant | < 2500ms | 429 only on quota |

---

## Load Test

- [ ] Run k6 scripts from `docs/LOAD_TESTING.md` against production
- [ ] Confirm Neon metrics healthy during load
- [ ] Confirm Vercel function metrics healthy during load
- [ ] No 5xx errors under expected load

---

## Final Checks

- [ ] All health endpoints return `ok: true`
- [ ] Demo tenant works end-to-end
- [ ] At least one real tenant onboarded and verified
- [ ] Documentation up to date (ONBOARDING_GUIDE.md, STRIPE_E2E_TEST.md, VERCEL_ENV_VARS.md)
- [ ] Stripe webhooks verified in Stripe Dashboard (recent deliveries returning 200)

---

## Quick Health Check

```bash
DOMAIN="https://tccmenus.com"

echo "Basic health:"
curl -sf "$DOMAIN/api/health" | jq

echo "Orders health:"
curl -sf "$DOMAIN/api/orders/health" | jq '.env'

echo "Stripe health:"
curl -sf "$DOMAIN/api/stripe/health" | jq '.env'
```

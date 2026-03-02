# Vercel Environment Variables Guide

Complete reference for all environment variables required in production, with verification steps using health endpoints.

---

## Required Variables

### Database

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=require` |

**Verification:**
```bash
curl -s -H "X-Admin-Token: $ADMIN_TOKEN" \
  https://tccmenus.com/api/admin/ops/health | jq '.dbOk'
# Expected: true
```

---

### Authentication

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXTAUTH_SECRET` | Random 32+ character string for JWT signing | `your-super-secret-random-string-32-chars` |
| `NEXTAUTH_URL` | Production URL of the app | `https://tccmenus.com` |

**Generate a secret:**
```bash
openssl rand -base64 32
```

**Verification:** Sign in works at `/auth/login`

---

### Admin

| Variable | Description | Example |
|----------|-------------|---------|
| `ADMIN_TOKEN` | Secret token for admin API endpoints | `your-admin-token-here` |

**Verification:**
```bash
curl -s -H "X-Admin-Token: $ADMIN_TOKEN" \
  https://tccmenus.com/api/admin/ops/health | jq '.ok'
# Expected: true (401 if wrong token)
```

---

## Upstash Redis (Rate Limiting)

| Variable | Description | Example |
|----------|-------------|---------|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint | `https://us1-xxx.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST API token | `AXxxxxx...` |

**Setup:**
1. Create account at [upstash.com](https://upstash.com)
2. Create a new Redis database
3. Copy **REST URL** and **REST Token** from the database details

**Verification:**
```bash
curl -s -H "X-Admin-Token: $ADMIN_TOKEN" \
  https://tccmenus.com/api/admin/ops/health | jq '.upstashConfigured'
# Expected: true
```

**Behavior when not configured:** Rate limiting is skipped (graceful degradation). Not recommended for production.

---

## AI Assistant (Optional)

| Variable | Description | Example |
|----------|-------------|---------|
| `AI_API_KEY` | OpenAI or compatible API key | `sk-...` |
| `AI_PROVIDER` | Provider type | `compatible` or `openai` |
| `AI_BASE_URL` | API base URL (for non-OpenAI) | `https://api.openai.com/v1` |
| `AI_MODEL` | Model to use | `gpt-4o-mini` |
| `ASSISTANT_ALLOWED_ORIGINS` | Comma-separated allowed CORS origins | `https://tccmenus.com,https://www.tccmenus.com` |

**Verification:**
```bash
# Test assistant endpoint (should return recommendations)
curl -X POST https://tccmenus.com/api/assistant \
  -H "Content-Type: application/json" \
  -d '{"tenant":"demo","message":"What do you recommend?","filters":[]}' | jq '.ok'
# Expected: true (or 501 if AI not configured)
```

**Behavior when not configured:** Assistant returns 501 "AI not configured". Menu browsing works normally.

---

## Stripe (Billing)

For SaaS billing (tenant activation):

| Variable | Description | Example |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_live_...` or `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret for billing events | `whsec_...` |
| `STRIPE_ONBOARDING_PRICE_ID` | One-time onboarding fee Price ID | `price_...` |
| `STRIPE_MONTHLY_PRICE_ID` | Recurring monthly subscription Price ID | `price_...` |

**Webhook endpoint:** `https://tccmenus.com/api/stripe/webhook`

**Required webhook events:**
- `checkout.session.completed`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `customer.subscription.deleted`

**Verification:**
```bash
curl -s https://tccmenus.com/api/stripe/health | jq '.env'
# Check: STRIPE_SECRET_KEY: true, STRIPE_WEBHOOK_SECRET: true
```

---

## Stripe (Ordering)

For food ordering payments:

| Variable | Description | Example |
|----------|-------------|---------|
| `STRIPE_ORDERS_SECRET_KEY` | Stripe key for order payments | `sk_live_...` or `sk_test_...` |
| `STRIPE_ORDERS_WEBHOOK_SECRET` | Webhook secret for order events | `whsec_...` |
| `STRIPE_ORDERS_WEBHOOK_SECRET_TEST` | Test webhook secret (for preview) | `whsec_...` |
| `STRIPE_TEST_KEY` | Test mode key (for preview environments) | `sk_test_...` |

**Webhook endpoint:** `https://tccmenus.com/api/orders/stripe-webhook`

**Required webhook events:**
- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`

**Important:** For Stripe Connect, configure the webhook to receive events from **connected accounts**.

**Verification:**
```bash
curl -s https://tccmenus.com/api/orders/health | jq '.env'
# Check: STRIPE_ORDERS_SECRET_KEY_configured: true
# Check: STRIPE_ORDERS_WEBHOOK_SECRET_configured: true
# Check: ordersWebhookOk: true
```

---

## Complete Environment Template

Copy this to your Vercel project settings (Environment Variables):

```bash
# === Required ===
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=https://tccmenus.com
ADMIN_TOKEN=your-secure-admin-token

# === Upstash (Required for production) ===
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxxx...

# === AI Assistant (Optional) ===
AI_API_KEY=sk-...
AI_PROVIDER=compatible
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
ASSISTANT_ALLOWED_ORIGINS=https://tccmenus.com

# === Stripe Billing ===
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_ONBOARDING_PRICE_ID=price_...
STRIPE_MONTHLY_PRICE_ID=price_...

# === Stripe Ordering ===
STRIPE_ORDERS_SECRET_KEY=sk_live_...
STRIPE_ORDERS_WEBHOOK_SECRET=whsec_...

# === Preview/Test (only for non-production) ===
STRIPE_TEST_KEY=sk_test_...
STRIPE_ORDERS_WEBHOOK_SECRET_TEST=whsec_...
```

---

## Health Check Dashboard

Run this script to verify all environment variables are configured correctly:

```bash
#!/bin/bash
# verify-env.sh

DOMAIN=${1:-"https://tccmenus.com"}
ADMIN_TOKEN=${2:-""}

echo "=== Environment Verification ==="
echo "Domain: $DOMAIN"
echo ""

# Basic health
echo "1. Basic Health..."
curl -sf "$DOMAIN/api/health" | jq -e '.ok' > /dev/null \
  && echo "   ✅ App is running" \
  || echo "   ❌ App not responding"

# Ops health (requires admin token)
if [ -n "$ADMIN_TOKEN" ]; then
  echo ""
  echo "2. Ops Health (Admin)..."
  OPS=$(curl -sf -H "X-Admin-Token: $ADMIN_TOKEN" "$DOMAIN/api/admin/ops/health")
  
  echo "$OPS" | jq -e '.dbOk == true' > /dev/null \
    && echo "   ✅ Database connected" \
    || echo "   ❌ Database NOT connected"
  
  echo "$OPS" | jq -e '.upstashConfigured == true' > /dev/null \
    && echo "   ✅ Upstash configured" \
    || echo "   ⚠️  Upstash NOT configured (rate limiting disabled)"
fi

# Stripe health
echo ""
echo "3. Stripe Billing Health..."
STRIPE=$(curl -sf "$DOMAIN/api/stripe/health")
echo "$STRIPE" | jq -e '.env.STRIPE_SECRET_KEY == true' > /dev/null \
  && echo "   ✅ STRIPE_SECRET_KEY set" \
  || echo "   ❌ STRIPE_SECRET_KEY missing"
echo "$STRIPE" | jq -e '.env.STRIPE_WEBHOOK_SECRET == true' > /dev/null \
  && echo "   ✅ STRIPE_WEBHOOK_SECRET set" \
  || echo "   ⚠️  STRIPE_WEBHOOK_SECRET missing (billing webhook disabled)"

# Orders health
echo ""
echo "4. Stripe Orders Health..."
ORDERS=$(curl -sf "$DOMAIN/api/orders/health")
echo "$ORDERS" | jq -e '.env.STRIPE_ORDERS_SECRET_KEY_configured == true' > /dev/null \
  && echo "   ✅ STRIPE_ORDERS_SECRET_KEY set" \
  || echo "   ❌ STRIPE_ORDERS_SECRET_KEY missing (ordering disabled)"
echo "$ORDERS" | jq -e '.env.STRIPE_ORDERS_WEBHOOK_SECRET_configured == true' > /dev/null \
  && echo "   ✅ STRIPE_ORDERS_WEBHOOK_SECRET set" \
  || echo "   ⚠️  STRIPE_ORDERS_WEBHOOK_SECRET missing"
echo "$ORDERS" | jq -e '.env.ordersWebhookOk == true' > /dev/null \
  && echo "   ✅ Orders webhook OK for this environment" \
  || echo "   ❌ Orders webhook REQUIRED but missing (production)"

echo ""
echo "=== Verification Complete ==="
```

**Usage:**
```bash
chmod +x verify-env.sh
./verify-env.sh https://tccmenus.com your-admin-token
```

---

## Environment-Specific Notes

### Production (`VERCEL_ENV=production`)

**Required:**
- All database and auth variables
- Upstash (for rate limiting)
- Stripe billing webhook secret
- Stripe orders webhook secret

**Security:**
- `/api/debug/*` endpoints return 404 unless admin token provided
- CORS is enforced on `/api/assistant` using `ASSISTANT_ALLOWED_ORIGINS`

### Preview (`VERCEL_ENV=preview`)

**Allowed:**
- Use `STRIPE_TEST_KEY` and `STRIPE_ORDERS_WEBHOOK_SECRET_TEST`
- Orders webhook not required (uses confirm fallback)

### Development (local)

**Minimum:**
- `DATABASE_URL` pointing to local PostgreSQL
- `NEXTAUTH_SECRET` and `NEXTAUTH_URL`

**Optional:**
- All other services degrade gracefully when not configured

---

## Troubleshooting

### "Rate limiting is skipped"
- Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- Verify the Upstash database is active

### "AI not configured (501)"
- Set `AI_API_KEY` with a valid OpenAI key
- Set `AI_PROVIDER=compatible` and `AI_MODEL=gpt-4o-mini`

### "Ordering is not configured (501)"
- Set `STRIPE_ORDERS_SECRET_KEY`
- Set `STRIPE_ORDERS_WEBHOOK_SECRET` (required in production)
- Enable ordering in tenant settings

### "Stripe webhook failing"
- Verify webhook endpoint URL matches your domain
- Verify webhook secret matches the one in Stripe Dashboard
- Check webhook events are correct for the endpoint

### "Database connection failed"
- Verify `DATABASE_URL` is correct
- For Neon, ensure pooling params are included if needed
- Check Neon dashboard for any paused databases

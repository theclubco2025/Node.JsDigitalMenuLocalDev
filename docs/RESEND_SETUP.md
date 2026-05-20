# Resend Setup (platehaven.app)

Use this after your domain is verified in Resend.

## 1) Domain in Resend

Domain should exist in Resend as `platehaven.app` (verified).

`RESEND_FROM` must use that domain, for example:

```bash
RESEND_FROM=orders@platehaven.app
```

## 2) Vercel env vars (Production)

```bash
RESEND_API_KEY=re_...
RESEND_FROM=orders@platehaven.app
RESEND_REPLY_TO=owner@yourdomain.com
```

## 3) App-side recipient config

| Notification | Where to configure |
|--------------|-------------------|
| Staff alert on paid order | Admin → Menu → **New order email notifications** |
| Ready-for-pickup (customer) | Automatic when kitchen marks order READY (uses checkout email) |
| Retention / holidays (customer) | Daily cron + checkout marketing opt-in; copy in Admin → **Retention email & SMS** |
| Catering inquiry (business) | Tenant `settings.contactEmail` or notifications list |

## 4) Retention cron

Set `CRON_SECRET` in Vercel. Vercel runs `GET /api/cron/retention` daily (see `vercel.json`).

Manual test:

```bash
curl -s -X POST https://platehaven.app/api/cron/retention \
  -H "Authorization: Bearer $CRON_SECRET"
```

## 5) Verify after deploy

1. Place a paid test order — staff email should arrive from `orders@platehaven.app`.
2. Mark order READY in kitchen — customer should receive ready email (if email on order).
3. Optional health check:

```bash
curl -s -H "X-Admin-Token: $ADMIN_TOKEN" https://platehaven.app/api/admin/ops/health
```

Expect: `"resendConfigured": true`.

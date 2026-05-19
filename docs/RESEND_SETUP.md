# Resend Setup (platehaven.com)

Use this after Resend support releases your domain.

## 1) Domain in Resend

Domain should exist in Resend as `platehaven.com`.

If missing, add it in Resend dashboard or via API.

## 2) DNS records (add in Vercel DNS for platehaven.com)

| Type | Name/Host | Value | Priority |
|------|-----------|-------|----------|
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDfMResfKSOe4Obkdx+UQOUewKV2DgXLq1G+8U8xU4HtOroEuEzGHdhS5BCew8FJBbFi57XMK5Jso5BX+JlNAIX3cnXhl/DEA+8tea9J7DjaRa1KCMxUJxoTPaFqp3rvsr+mejGGi9JbGP82/QYKZSMuNL0Y9lyBo/3MGNjjt/5aQIDAQAB` | — |
| MX | `send` | `feedback-smtp.us-east-1.amazonses.com` | `10` |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | — |

Notes:
- In Vercel DNS, host/name is usually the subdomain part only (`resend._domainkey`, `send`).
- Wait for DNS propagation (often 5–30 minutes, sometimes up to 24h).
- Click **Verify** in Resend after records propagate.

## 3) Vercel env vars (Production)

```bash
RESEND_API_KEY=re_...
RESEND_FROM=orders@platehaven.com
RESEND_REPLY_TO=platehaven2025@gmail.com
```

`RESEND_FROM` must be an address on the verified domain.

## 4) App-side recipient config

Per tenant, set staff recipients in Admin → Menu → **New order email notifications**.

## 5) Verify after deploy

1. Place a paid test order.
2. Confirm staff email arrives from `orders@platehaven.com`.
3. Optional health check:

```bash
curl -s -H "X-Admin-Token: $ADMIN_TOKEN" https://platehaven.app/api/admin/ops/health
```

Expect: `"resendConfigured": true`.

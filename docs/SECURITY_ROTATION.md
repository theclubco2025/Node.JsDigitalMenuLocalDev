# Security rotation checklist (production)

This app uses multiple secrets across Vercel, Stripe, Twilio, Neon, and the AI provider. Treat any secret ever pasted into chat, logs, screenshots, or committed code as **compromised** and rotate it.

## 1) Rotate application admin secrets
- **`ADMIN_TOKEN`** (Vercel env var): rotate immediately if it was ever hard-coded or shared.
- **NextAuth**
  - **`NEXTAUTH_SECRET`**: rotate if shared or if you suspect cookie/session compromise.

## 2) Rotate Vercel deployment protection bypass
If Vercel Deployment Protection is enabled and you use bypass tokens/cookies:
- Rotate the **bypass token** in Vercel.
- Update any automation/scripts that reference it (seed/verify/promote scripts should read it from env, not hard-code it).

## 3) Rotate Stripe secrets (billing + ordering)
Stripe has two logical flows in this codebase:
- **SaaS billing** (tenant activation/subscriptions)
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET` (signing secret, `whsec_...`)
- **Food ordering** (restaurant payments via Checkout + Connect + webhook)
  - `STRIPE_ORDERS_SECRET_KEY` (or `STRIPE_TEST_KEY` in preview/test)
  - `STRIPE_ORDERS_WEBHOOK_SECRET` / `STRIPE_ORDERS_WEBHOOK_SECRET_TEST` (signing secret)

Rotation steps:
- Roll/replace any exposed **`sk_*`** key in Stripe Dashboard.
- Roll/replace any exposed **`whsec_*`** webhook signing secret by re-creating the endpoint or rolling the secret (Stripe UI).
- Confirm the app health endpoints show “configured”:
  - `/api/stripe/health` (billing)
  - `/api/orders/health` and `/api/orders/env-check` (ordering)

## 4) Rotate Twilio secrets
- `TWILIO_API_KEY_SECRET`
- `TWILIO_API_KEY_SID`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_MESSAGING_SERVICE_SID`

After rotation, confirm:
- `/api/orders/sms-health` shows `configured: true` and `smsColumnsPresent: true`.

## 5) Rotate AI provider secrets
- `OPENAI_API_KEY` and/or `AI_KEYS` / `AI_API_KEY`
- If you use org/project headers (`OPENAI_ORG`, `OPENAI_PROJECT`), treat them as sensitive config.

## 6) Neon / database
- If your Neon connection string (`DATABASE_URL`) was exposed, rotate credentials / create a new role/password and update Vercel env vars.
- Ensure production uses **pooled** connection strings appropriate for serverless.

## 7) Post-rotation verification
Run these checks on production:
- Menu loads for an ACTIVE tenant: `/t/<slug>`
- Ordering health: `/api/orders/health`
- Billing health: `/api/stripe/health`
- Kitchen access: verify kitchen PIN is tenant-specific (no universal/demo shortcuts)


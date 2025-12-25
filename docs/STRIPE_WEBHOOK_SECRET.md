# Stripe webhook signing secret (STRIPE_WEBHOOK_SECRET)

## What it is
`STRIPE_WEBHOOK_SECRET` is the **webhook signing secret** from Stripe (it starts with `whsec_...`).

It is **not** your Stripe secret API key.

## Why you need it
- Your app uses it to securely verify Stripe webhook events like:
  - checkout completed
  - subscription payment failed
  - subscription canceled
- Without it, Stripe can’t securely activate tenants via webhooks.

## Where to find it (Stripe Dashboard)
1. Go to **Stripe Dashboard → Developers → Webhooks**
2. Click **Add endpoint**
3. Set **Endpoint URL** to:
   - Production: `https://YOURDOMAIN.com/api/stripe/webhook`
   - Preview: `https://YOUR-VERCEL-PREVIEW-URL/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
5. Create the endpoint
6. Click the endpoint and **Reveal “Signing secret”**
7. Copy the `whsec_...` value and paste it into Vercel as `STRIPE_WEBHOOK_SECRET`

## Tip: check your configuration from the app
You can hit:
- `/api/stripe/health`

It shows:
- the exact webhook URL your app expects for the current environment
- which env vars are missing (without showing secrets)



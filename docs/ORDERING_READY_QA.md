## Ordering “Ready” QA Checklist (Connect + Tips)

### Prereqs
- **DB migrations applied** (new columns exist for Connect + tips).
- Platform env vars set:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_CONNECT_CLIENT_ID`
  - `STRIPE_ORDERS_WEBHOOK_SECRET` (production) or `STRIPE_ORDERS_WEBHOOK_SECRET_TEST` (test-mode POC)
- Stripe webhook endpoint is configured for orders at:
  - `https://YOURDOMAIN.com/api/orders/stripe-webhook`
  - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`
  - **Connect enabled**: endpoint receives events from connected accounts

### Stripe Connect (per tenant)
- Go to `Admin → Menu` for the tenant.
- In **Stripe payouts**, click **Connect Stripe** and complete onboarding.
- Confirm status shows **Connected** with an account id.

### Customer checkout (itemized + tip)
- On `/menu?tenant=<slug>`:
  - Add 2+ items (include add-ons if available).
  - Select a **tip** (preset and custom should both work).
  - Checkout should redirect to Stripe.
- On Stripe Checkout / receipt:
  - Receipt is **itemized** (one line per item; add-ons reflected in item name).
  - Tip appears as its own **Tip** line when selected.

### Webhook → paid → KDS
- After payment:
  - Order should transition from **PENDING_PAYMENT** → **NEW** via webhook.
  - KDS (`/kds` → PIN → `/kitchen?tenant=<slug>`) shows the new order under **New**.

### KDS status transitions
- On KDS:
  - **Start Preparing** moves order to **Preparing**
  - **Mark Ready** moves order to **Ready**
  - **Complete** (and swipe gesture) moves order to **History**

### Refunds (connected account)
- From Admin Orders, issue a refund for a paid order.
- Confirm the refund succeeds and reflects in the **restaurant’s connected Stripe account**.

### Guardrails (no beta/POC bypass)
- Verify no flow can move an order into KDS without a **real Stripe Checkout session**:
  - `/api/orders/confirm` returns **Missing session_id** if no session is provided/stored.
  - Checkout returns **stripe_connect_required** when the tenant is not connected.


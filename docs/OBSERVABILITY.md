# Observability (minimum for selling)

## What to monitor
- **Vercel**
  - Error rate / 5xx spikes
  - Function timeouts
  - Cold starts (if relevant)
  - Log drains (recommended) to a central tool (Datadog / Axiom / etc.)
- **Neon**
  - CPU / connections / query latency
  - Connection pool health (serverless can spike connections if misconfigured)
- **Stripe**
  - Webhook delivery failures + retries
  - Checkout session creation errors
  - Refund failures (if enabled)
- **Twilio**
  - Delivery failures
  - API errors / auth errors
- **Upstash (rate limiting)**
  - Redis errors / latency
  - Verify 429s occur only when you intentionally exceed limits

## Admin health endpoint
There is an admin-gated endpoint:
- `GET /api/admin/ops/health` (requires header `X-Admin-Token: <ADMIN_TOKEN>`)

Use it for scripted checks after deploys (DB reachable, Upstash configured).

## Recommended alerts (go-live)
- Any sustained **5xx** on:
  - `/api/orders/checkout`
  - `/api/orders/stripe-webhook`
  - `/api/kitchen/orders`
  - `/api/assistant`
- Stripe webhook failures (delivery failures/retries rising)
- Neon connection saturation (connections pegged)


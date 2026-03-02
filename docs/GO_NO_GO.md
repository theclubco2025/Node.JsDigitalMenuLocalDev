# Go / No-go checklist (before selling)

## Security
- [ ] No hard-coded tokens/pins in repo
- [ ] Universal kitchen pins do not work in production
- [ ] `/api/debug/*` is not publicly accessible in production
- [ ] `/api/assistant` rejects disallowed browser origins (CORS)
- [ ] Rate limiting is enabled in production (Upstash configured)

## Core flows
- [ ] Menu loads for an ACTIVE tenant
- [ ] Unpaid tenant is consistently gated (billing redirect / 402 API response)
- [ ] Checkout creates an order and Stripe Checkout Session
- [ ] Stripe webhook marks paid orders and they appear in KDS
- [ ] “Order success” page updates status without aggressive polling
- [ ] Twilio SMS (if enabled) sends READY notifications correctly

## Performance targets (minimum)
- Menu browsing: p95 < 400ms, error rate < 0.5%
- Order status: p95 < 500ms, error rate < 1%
- Assistant: p95 < 2500ms (model-dependent), 429 only when exceeding quota/limits

## Load test
- Run the k6 scripts in `docs/LOAD_TESTING.md` against production.
- Confirm Neon + Vercel metrics remain healthy during the run.


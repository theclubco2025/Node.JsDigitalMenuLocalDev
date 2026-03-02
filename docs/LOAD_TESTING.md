# Load testing (k6)

These scripts are designed to validate the *real* scaling risks in this app (menu browsing spikes, assistant abuse control, order-status “waiting room” traffic).

## Prerequisites
- Install k6: https://k6.io/docs/get-started/installation/
- Have a deployed environment (Preview or Production) with:
  - `DATABASE_URL` configured (for DB-backed endpoints)
  - `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` configured (for distributed rate limiting)

## Scripts
Scripts live in `loadtest/k6/`.

### Menu browsing
- Goal: ensure `/api/menu` and menu rendering do not collapse under concurrency.

```bash
k6 run -e BASE_URL="https://yourdomain.com" -e TENANT="demo" loadtest/k6/menu.js
```

### Assistant
- Goal: verify assistant latency + quotas + CORS + rate limiting behavior.

```bash
k6 run -e BASE_URL="https://yourdomain.com" -e TENANT="demo" loadtest/k6/assistant.js
```

### Order status “waiting room”
- Goal: simulate many customers waiting on the success page.
- Requires an existing `ORDER_ID`.

```bash
k6 run -e BASE_URL="https://yourdomain.com" -e ORDER_ID="order_123" loadtest/k6/order-status.js
```

## Go / No-go targets (suggested)
- **Menu**:
  - p95 < 400ms
  - errors < 0.5%
- **Assistant**:
  - p95 < 2500ms (model-dependent)
  - 429s only when you intentionally exceed limits
- **Order status**:
  - p95 < 500ms
  - no sustained DB overload from polling (client backoff should keep reads bounded)


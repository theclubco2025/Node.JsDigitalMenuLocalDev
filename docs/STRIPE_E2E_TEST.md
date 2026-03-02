# Stripe-Only E2E Test Script

A complete end-to-end test script for verifying the ordering flow using Stripe test keys. Use this to validate checkout → webhook → KDS → status transitions → customer updates.

---

## Prerequisites

### 1. Test Environment Setup

Ensure these environment variables are set (use Stripe **test** keys):

```bash
# Stripe test keys (get from Stripe Dashboard > Developers > API keys)
STRIPE_TEST_KEY=sk_test_...
STRIPE_ORDERS_SECRET_KEY=sk_test_...  # Can be same as STRIPE_TEST_KEY

# Stripe orders webhook secret (from Stripe Dashboard > Webhooks)
STRIPE_ORDERS_WEBHOOK_SECRET_TEST=whsec_...

# Database
DATABASE_URL=postgresql://...
```

### 2. Stripe Webhook Configuration

In **Stripe Dashboard > Developers > Webhooks**:

1. Click **Add endpoint**
2. Endpoint URL: `https://YOUR-DOMAIN.com/api/orders/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
4. Copy the **Signing secret** and set as `STRIPE_ORDERS_WEBHOOK_SECRET_TEST`

### 3. Test Tenant Setup

Ensure you have a test tenant with:
- Ordering enabled (`Tenant.settings.ordering.enabled = true`)
- Stripe Connect account connected (or use `demo` tenant for platform checkout)
- Kitchen PIN set

---

## E2E Test Flow

### Phase 1: Pre-Test Verification

#### 1.1 Check Health Endpoints

**Orders Health:**
```bash
curl -s https://YOUR-DOMAIN.com/api/orders/health | jq
```

Expected response:
```json
{
  "ok": true,
  "env": {
    "VERCEL_ENV": "preview",
    "DATABASE_URL": true,
    "STRIPE_ORDERS_SECRET_KEY_configured": true,
    "STRIPE_ORDERS_WEBHOOK_SECRET_configured": true,
    "ordersWebhookRequired": false,
    "ordersWebhookOk": true
  }
}
```

**Stripe Billing Health:**
```bash
curl -s https://YOUR-DOMAIN.com/api/stripe/health | jq
```

**Ops Health (requires admin token):**
```bash
curl -s -H "X-Admin-Token: YOUR_ADMIN_TOKEN" \
  https://YOUR-DOMAIN.com/api/admin/ops/health | jq
```

#### 1.2 Verify Tenant Ordering Settings

```bash
curl -s "https://YOUR-DOMAIN.com/api/tenant/config?tenant=YOUR-TENANT" | jq '.ordering'
```

Expected: `enabled: true`, no `paused: true`

---

### Phase 2: Place a Test Order

#### 2.1 Browser Test (Recommended)

1. Open the menu: `https://YOUR-DOMAIN.com/menu?tenant=YOUR-TENANT`
2. Add items to cart (click "Add to Plate")
3. Click **Checkout**
4. Enter test customer info:
   - Email: `test@example.com`
   - Name: `Test Customer`
   - Phone: `+15551234567` (optional, for SMS opt-in)
5. Select pickup time (ASAP or scheduled)
6. Optionally add a tip
7. Click **Pay with Stripe**

#### 2.2 Use Stripe Test Card

At Stripe Checkout, use these test credentials:

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 9995` | Decline |
| `4000 0025 0000 3155` | Requires 3DS |

- **Expiry**: Any future date (e.g., `12/34`)
- **CVC**: Any 3 digits (e.g., `123`)
- **ZIP**: Any 5 digits (e.g., `12345`)

#### 2.3 Expected: Order Success Page

After payment, you should land on:
```
/order/success?order=ORDER_ID&session_id=SESSION_ID
```

The page should show:
- ✅ "Order Confirmed"
- Pickup code (4-digit code)
- Order items with prices
- Total paid amount
- Status: "Received" (filled dot)

---

### Phase 3: Verify Webhook Processing

#### 3.1 Check Order in Database

```bash
# Using Prisma Studio (local)
npx prisma studio

# Or query via admin API
curl -s -H "Authorization: Bearer YOUR_TOKEN" \
  "https://YOUR-DOMAIN.com/api/orders/list?tenant=YOUR-TENANT" | jq
```

Verify the order has:
- `status: "NEW"` (paid orders start as NEW)
- `paidAt: "2024-..."` (timestamp present)
- `stripeCheckoutSessionId: "cs_test_..."` (session ID stored)

#### 3.2 Check Stripe Webhook Logs

In Stripe Dashboard > Developers > Webhooks > Your endpoint:

1. Click on the endpoint
2. View **Recent deliveries**
3. Find the `checkout.session.completed` event
4. Verify **Response: 200**

If response is not 200:
- Check server logs for errors
- Verify webhook secret matches
- Check the `metadata.kind === 'food_order'`

---

### Phase 4: KDS Order Visibility

#### 4.1 Open Kitchen Display

1. Go to: `https://YOUR-DOMAIN.com/kds`
2. Enter the tenant's Kitchen PIN
3. You should land on the kitchen dashboard

#### 4.2 Verify Order Appears

The order should appear in the **New Orders** column with:
- Order number (e.g., #1)
- Pickup code or Table number
- Items list with quantities
- "ASAP" or scheduled time

**Critical:** Orders only appear in KDS after payment is confirmed (webhook processed).

---

### Phase 5: Test Status Transitions

#### 5.1 NEW → PREPARING

1. Find the order in the "New Orders" column
2. Click **Start Preparing**
3. Order moves to "Preparing" column
4. Toast shows "Updated: PREPARING"

**Verify customer sees update:**
- Refresh the order success page
- "Preparing" dot should be filled

#### 5.2 PREPARING → READY

1. In "Preparing" column, click **Mark Ready**
2. Order moves to "Ready for Pickup" column
3. Toast shows "Updated: READY" (+ SMS status if opted in)

**Verify customer sees update:**
- Order success page auto-updates (no refresh needed)
- "Ready for Pickup" step animates/highlights
- Ready message displays (e.g., "Your order is ready for pickup at the bar.")

#### 5.3 READY → COMPLETED

1. In "Ready" column, either:
   - Click **Complete** button, or
   - Swipe the order card right
2. Order disappears from active board
3. Toast shows "Updated: COMPLETED"

#### 5.4 Verify History

1. Click **History** tab in KDS
2. Find the completed order
3. Click to view order details
4. Verify status shows "COMPLETED"

---

### Phase 6: Customer Experience Verification

#### 6.1 Order Status Page Updates

Throughout the flow, verify the customer's order page:

| Kitchen Status | Customer Page |
|----------------|---------------|
| NEW | "Received" ● "Preparing" ○ "Ready" ○ |
| PREPARING | "Received" ● "Preparing" ● "Ready" ○ |
| READY | "Received" ● "Preparing" ● "Ready" ● (animated) |

#### 6.2 Auto-Refresh

The customer page should:
- Update automatically (no manual refresh)
- Use exponential backoff (1.5s → 2s → 2.5s → ...)
- Stop polling after terminal state (READY/COMPLETED/CANCELED)

#### 6.3 Pickup Code Visibility

- Pickup code displays prominently
- "Copy code" button works
- Helper text shows: "Save this pickup code — you'll need it when you arrive."

---

## Test Scenarios Matrix

| Scenario | Steps | Expected Result |
|----------|-------|-----------------|
| Happy path | Add items → Checkout → Pay → KDS transitions | Order completes, customer sees updates |
| Scheduled pickup | Select future time → Pay | Order shows scheduled time in KDS |
| Dine-in order | Enter table number → Pay | KDS shows "DINE-IN • Table X" |
| Order with tip | Add tip → Pay | Stripe receipt shows tip line item |
| Order with add-ons | Select item add-ons → Pay | KDS shows add-ons under item |
| Order with note | Add kitchen note → Pay | KDS shows "Order notes" section |
| Item with note | Add item-level note → Pay | Note appears under item in KDS |
| Card declined | Use decline test card | Error at Stripe, no order created |

---

## Automated Health Check Script

```bash
#!/bin/bash
# e2e-health-check.sh

DOMAIN=${1:-"https://tccmenus.com"}
TENANT=${2:-"demo"}

echo "=== E2E Health Check ==="
echo "Domain: $DOMAIN"
echo "Tenant: $TENANT"
echo ""

echo "1. Basic health..."
curl -sf "$DOMAIN/api/health" | jq -e '.ok' > /dev/null && echo "✅ Basic health OK" || echo "❌ Basic health FAILED"

echo ""
echo "2. Orders health..."
ORDERS=$(curl -sf "$DOMAIN/api/orders/health")
echo "$ORDERS" | jq -e '.ok' > /dev/null && echo "✅ Orders endpoint OK" || echo "❌ Orders endpoint FAILED"
echo "$ORDERS" | jq -e '.env.STRIPE_ORDERS_SECRET_KEY_configured' > /dev/null && echo "✅ Stripe orders key configured" || echo "⚠️  Stripe orders key NOT configured"
echo "$ORDERS" | jq -e '.env.STRIPE_ORDERS_WEBHOOK_SECRET_configured' > /dev/null && echo "✅ Orders webhook configured" || echo "⚠️  Orders webhook NOT configured"

echo ""
echo "3. Stripe health..."
curl -sf "$DOMAIN/api/stripe/health" | jq -e '.ok' > /dev/null && echo "✅ Stripe health OK" || echo "❌ Stripe health FAILED"

echo ""
echo "4. Menu endpoint..."
curl -sf "$DOMAIN/api/menu?tenant=$TENANT" | jq -e '.categories | length > 0' > /dev/null && echo "✅ Menu has categories" || echo "❌ Menu EMPTY or FAILED"

echo ""
echo "5. Tenant config..."
CONFIG=$(curl -sf "$DOMAIN/api/tenant/config?tenant=$TENANT")
echo "$CONFIG" | jq -e '.ordering.enabled' > /dev/null && echo "✅ Ordering enabled" || echo "⚠️  Ordering NOT enabled"

echo ""
echo "=== Health Check Complete ==="
```

Usage:
```bash
chmod +x e2e-health-check.sh
./e2e-health-check.sh https://tccmenus.com your-tenant
```

---

## Troubleshooting

### Order not appearing in KDS

1. **Check webhook delivery** in Stripe Dashboard
2. **Verify webhook secret** matches `STRIPE_ORDERS_WEBHOOK_SECRET` or `_TEST`
3. **Check order status** - should be `NEW`, not `PENDING_PAYMENT`
4. **Check metadata** - event must have `metadata.kind === 'food_order'`

### Webhook returning 500

- Check server logs for the actual error
- Common issues:
  - Database connection timeout
  - Missing order ID in metadata
  - Prisma schema out of sync

### Customer page not updating

- Browser might be caching - check DevTools Network tab
- Polling stops after terminal state
- Check console for JavaScript errors

### Status update fails in KDS

- Verify Kitchen PIN is correct
- Check network tab for actual API error
- Order might have been updated by another device

---

## Post-Test Cleanup

For test orders in production/preview:

1. In Stripe Dashboard, refund the test payment if needed
2. In database, update order status to `CANCELED` or delete test orders
3. Clear test orders from KDS history if desired

```sql
-- Mark test orders as canceled (don't delete to preserve audit)
UPDATE orders 
SET status = 'CANCELED', "updatedAt" = NOW()
WHERE "customerEmail" LIKE 'test%@%' 
  AND status != 'CANCELED';
```

# TCC Menus - Restaurant Onboarding Checklist

## Pre-Onboarding

- [ ] Customer completed checkout at tccmenus.com/billing
- [ ] Payment confirmed (check Stripe dashboard)
- [ ] Customer email collected
- [ ] Plan confirmed (Starter/Professional/Enterprise)
- [ ] Restaurant name and preferred URL slug noted

---

## Step 1: Create Tenant Slug

**Important**: Each restaurant gets a unique slug. This ensures complete data isolation.

**Rules for slugs**:
- Lowercase letters, numbers, hyphens only
- No spaces
- Unique (check it doesn't exist)
- Examples: `joes-pizza`, `bella-vista-cafe`, `downtown-grill`

**Check if slug exists**:
```
https://tccmenus.com/api/tenant/status?tenant={slug}
```

---

## Step 2: Collect Restaurant Information

### Required:
- [ ] Restaurant name
- [ ] Menu (PDF, photos, or list of items with prices)
- [ ] Logo (PNG or JPG, transparent background preferred)
- [ ] Brand colors (primary color at minimum)

### Optional:
- [ ] Item photos
- [ ] Dietary information for items
- [ ] Category organization preferences
- [ ] Special instructions or notes

---

## Step 3: Create Menu in Admin

**Access admin**: `https://tccmenus.com/admin?tenant={slug}`

### Create Categories:
- [ ] Enter category names (e.g., Appetizers, Entrees, Desserts)
- [ ] Add descriptions if desired

### Add Menu Items:
For each item:
- [ ] Name
- [ ] Description
- [ ] Price
- [ ] Category assignment
- [ ] Dietary tags (vegetarian, gluten-free, etc.)
- [ ] Photo (if available)

---

## Step 4: Configure Branding

In admin settings:
- [ ] Upload logo
- [ ] Set primary brand color
- [ ] Set accent color (optional)
- [ ] Configure header style

---

## Step 5: Set Up Kitchen PIN

**Critical for security**:
- [ ] Generate unique 4-digit PIN
- [ ] Set in tenant settings: `settings.kitchenPin`
- [ ] Provide PIN to restaurant owner ONLY

**Never reuse PINs across tenants!**

---

## Step 6: Stripe Connect (Professional/Enterprise only)

1. [ ] Send Stripe Connect onboarding link to restaurant owner
2. [ ] Restaurant completes Stripe account setup
3. [ ] Verify connection in admin
4. [ ] Test with small payment

---

## Step 7: Enable Ordering (Professional/Enterprise only)

In admin settings:
- [ ] Enable ordering toggle
- [ ] Configure modes (dine-in, pickup, or both)
- [ ] Set business hours (optional)
- [ ] Test order flow end-to-end

---

## Step 8: Generate QR Codes

- [ ] Generate QR codes for each table (if dine-in)
- [ ] Generate main QR code for pickup
- [ ] Send to restaurant for printing/display

**QR URL format**: `https://tccmenus.com/menu?tenant={slug}`

---

## Step 9: Activate Tenant

**This makes the menu publicly accessible.**

Via API (requires ADMIN_TOKEN):
```bash
curl -X POST https://tccmenus.com/api/admin/tenant/activate \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: YOUR_ADMIN_TOKEN" \
  -d '{"tenant": "slug-here", "status": "ACTIVE"}'
```

---

## Step 10: Final Testing

- [ ] View menu as customer on mobile
- [ ] Test AI assistant (ask a question)
- [ ] Place test order (if ordering enabled)
- [ ] View test order in KDS
- [ ] Mark test order as Ready
- [ ] Verify customer notification

---

## Step 11: Handoff to Restaurant

Send to restaurant owner:
- [ ] Menu URL: `https://tccmenus.com/menu?tenant={slug}`
- [ ] Admin URL: `https://tccmenus.com/admin?tenant={slug}`
- [ ] KDS URL: `https://tccmenus.com/kitchen?tenant={slug}`
- [ ] Kitchen PIN
- [ ] QR codes (digital files)
- [ ] Quick start guide

---

## Post-Onboarding

- [ ] Schedule follow-up call for 1 week out
- [ ] Add to customer success tracking
- [ ] Document any special configurations

---

## Tenant Isolation Reminder

**CRITICAL**: Never modify another tenant's data when onboarding a new restaurant.

Each tenant has:
- Separate database records
- Separate menu data
- Separate orders
- Separate settings
- Separate Stripe account

**If you see data from another tenant, STOP and verify you're working with the correct slug.**

---

## Emergency Contacts

- Technical issues: tech@tccsolutions.com
- Urgent production issues: [escalation procedure]

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-03-02 | Initial checklist |

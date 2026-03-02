# Restaurant Onboarding Guide (Non-Technical)

A step-by-step guide for onboarding a new restaurant to TCC Menus. Estimated time: 20–30 minutes.

---

## Before You Start

You'll need:
- Restaurant name, address, and contact email
- Restaurant's menu (PDF, photo, or list of items with prices)
- Restaurant's branding assets (logo, colors if known)
- Access to the TCC Menus admin panel

---

## Step 1: Create the Restaurant Account

### 1.1 Access the Admin Panel
1. Go to your TCC Menus admin: `https://tccmenus.com/admin/tenant`
2. Sign in with your admin credentials

### 1.2 Create a New Tenant
1. Choose a **slug** (URL identifier) for the restaurant
   - Use lowercase letters and hyphens only
   - Example: `oak-street-bistro`, `marios-pizza`, `the-golden-fork`
2. Enter the restaurant's display name (this appears on the menu)
3. Click **Create Tenant**

> **Tip:** The slug becomes part of the menu URL: `tccmenus.com/t/oak-street-bistro`

---

## Step 2: Import the Menu

### 2.1 Open the Menu Editor
1. Go to: `https://tccmenus.com/admin/menu?tenant=YOUR-SLUG`
2. Or click **Edit Menu** from the tenant list

### 2.2 Add Categories and Items
For each category (Appetizers, Entrees, Desserts, etc.):

1. Click **Add Category**
2. Enter the category name
3. For each item in that category:
   - Click **Add Item**
   - Enter **Name** (e.g., "Caesar Salad")
   - Enter **Price** (e.g., 12.99)
   - Enter **Description** (optional but recommended)
   - Add **Tags** separated by commas:
     - Diet tags: `vegetarian`, `vegan`, `gluten-free`
     - Feature tags: `house favorite`, `spicy`, `seasonal`
   - Upload or paste an **Image URL** (optional)

### 2.3 Save the Menu
1. Click **Save** at the top of the editor
2. Preview the menu: `https://tccmenus.com/menu?tenant=YOUR-SLUG`

---

## Step 3: Set Up Branding

### 3.1 Add Restaurant Logo
1. In the menu editor, go to **Restaurant Settings** section
2. Upload or paste the restaurant's **Logo URL**
   - Recommended: horizontal logo, PNG with transparent background
   - Optimal size: 200–400px wide

### 3.2 Customize Theme Colors (Optional)
1. In **Restaurant Settings**, find **Theme**
2. Set **Primary Color** (hex code like `#1a1a1a` or `#8B0000`)
3. Set **Accent Color** for buttons and highlights
4. Click **Save**

### 3.3 Add a Tagline (Optional)
1. Enter a **Tagline** that appears below the restaurant name
   - Example: "Fresh Italian Since 1985"
   - Example: "Farm to Table Dining"

---

## Step 4: Set Up Kitchen PIN

The Kitchen PIN allows restaurant staff to access the Kitchen Display System (KDS).

### 4.1 Create a Kitchen PIN
1. In the menu editor, find **Kitchen PIN** section
2. Enter a 4+ digit PIN
   - Example: `5738` (avoid obvious PINs like `1234`)
   - This will be shared with kitchen staff only
3. Click **Save PIN**

### 4.2 Test KDS Access
1. Go to: `https://tccmenus.com/kds`
2. Enter the Kitchen PIN you just created
3. Confirm you land on the Kitchen Display screen

> **Give the kitchen staff this info:**
> - KDS URL: `tccmenus.com/kds`
> - Kitchen PIN: (the PIN you created)

---

## Step 5: Connect Stripe (For Online Ordering)

If the restaurant wants to accept online orders and payments, they need to connect their Stripe account.

### 5.1 Start Stripe Connect
1. In the menu editor, go to **Restaurant Settings**
2. Find **Stripe Payouts** section
3. Click **Connect Stripe**
4. The restaurant owner will be redirected to Stripe to:
   - Create or sign into their Stripe account
   - Authorize TCC Menus to process payments
5. After completing Stripe onboarding, they'll return to the admin

### 5.2 Verify Connection
1. Return to the menu editor
2. Check that **Stripe Payouts** shows **Connected**
3. The connected account ID will be displayed (starts with `acct_`)

> **Important:** Without Stripe Connect, the restaurant cannot accept online orders.

---

## Step 6: Enable Ordering (If Applicable)

Ordering is disabled by default. Enable it after Stripe is connected.

### 6.1 Turn On Ordering
1. In the menu editor, find **Ordering Settings**
2. Toggle **Enable Ordering** to ON
3. Configure options:
   - **Timezone**: Select the restaurant's timezone
   - **Scheduling**: Enable if the restaurant accepts scheduled pickup orders
   - **Lead Time**: Minimum minutes before a pickup time (e.g., 30 min)
   - **Slot Duration**: Time between pickup slots (e.g., 15 min)
4. Click **Save**

### 6.2 Enable Dine-In (Optional)
If the restaurant wants table-number ordering:
1. Toggle **Dine-In Ordering** to ON
2. Customize the **Table Number Label** if needed
3. Click **Save**

---

## Step 7: Activate the Restaurant

### 7.1 Complete Billing
1. The restaurant owner should go to: `https://tccmenus.com/billing?tenant=YOUR-SLUG`
2. Complete checkout to activate the account
3. After payment, the tenant status changes to **ACTIVE**

### 7.2 Get the Live QR Code
After activation, the billing success page displays:
- **Live Menu URL**: `https://tccmenus.com/t/YOUR-SLUG`
- **QR Code**: Ready to print and display

### 7.3 Download and Print QR
1. Click **Download / Open QR** on the success page
2. Print the QR code
3. Place QR codes at:
   - Restaurant entrance
   - Tables (for dine-in)
   - Bar area
   - Takeout counter

---

## Verification Checklist

Before handing off to the restaurant, verify:

- [ ] Menu loads correctly at `/t/YOUR-SLUG`
- [ ] All categories and items display with correct prices
- [ ] Logo and branding appear correctly
- [ ] Kitchen PIN works at `/kds`
- [ ] (If ordering enabled) Stripe shows "Connected"
- [ ] (If ordering enabled) Test order can be placed and appears in KDS
- [ ] QR code scans and opens the menu

---

## Troubleshooting

### "Menu not loading"
- Check the tenant slug is correct
- Verify tenant status is ACTIVE
- Try clearing browser cache

### "Kitchen PIN not working"
- Re-enter the PIN in admin settings
- Make sure there are no spaces
- PIN must be at least 4 characters

### "Stripe not connected"
- Have the restaurant owner complete Stripe onboarding
- Check for any pending Stripe verification requirements
- Verify the Stripe account is fully activated

### "Orders not appearing in KDS"
- Verify ordering is enabled for this tenant
- Check Stripe webhook is configured (admin task)
- Ensure the order was fully paid (not abandoned at checkout)

---

## Post-Onboarding Support

### Editing the Menu
Restaurant owners can edit their menu anytime:
1. Log in at `tccmenus.com/auth/login`
2. Use the inline editor on their menu page
3. Changes save instantly (no rebuild needed)

### Analytics
Restaurant owners can view their analytics:
1. Log in and go to `/admin/orders`
2. View recent orders, popular items, and revenue

### Kitchen Display
Staff access the KDS at:
- URL: `tccmenus.com/kds`
- Enter the restaurant's Kitchen PIN
- Orders flow: NEW → PREPARING → READY → COMPLETED

---

## Quick Reference

| Task | URL |
|------|-----|
| Customer Menu | `tccmenus.com/t/SLUG` |
| Admin Editor | `tccmenus.com/admin/menu?tenant=SLUG` |
| Kitchen Display Entry | `tccmenus.com/kds` |
| Owner Login | `tccmenus.com/auth/login` |
| Billing | `tccmenus.com/billing?tenant=SLUG` |

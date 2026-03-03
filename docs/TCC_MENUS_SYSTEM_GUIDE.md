# TCC Menus - Complete System Guide

## Overview

TCC Menus is a digital menu platform for restaurants. Customers scan a QR code to view the menu, ask questions to an AI assistant, and place orders — all from their smartphone browser without downloading an app.

---

## How It Works

### Customer Flow

1. **Scan QR Code** → Customer uses phone camera to scan QR code on table
2. **View Menu** → Menu opens instantly in browser (no app download)
3. **Browse & Search** → Customer explores categories, sees photos, dietary info
4. **Ask AI** → Customer can ask questions like "Is this gluten-free?" — AI answers based on actual menu data
5. **Add to Cart** → Customer builds their order
6. **Enter Details** → For dine-in: table number. For pickup: contact info
7. **Pay** → Secure Stripe checkout
8. **Kitchen Receives Order** → Order appears on Kitchen Display System (KDS)
9. **Order Prepared** → Kitchen moves order: New → Preparing → Ready
10. **Customer Notified** → For pickup: customer sees status with pickup code

### Restaurant Admin Flow

1. **Login** → Admin logs in at /admin
2. **Manage Menu** → Add, edit, remove items and categories
3. **Update Prices** → Changes appear instantly
4. **Mark Sold Out** → Toggle item availability
5. **View Orders** → See incoming orders in real-time
6. **Kitchen Display** → Manage order tickets
7. **Analytics** → View sales data, popular items, peak hours

---

## Product Features

### 1. QR Menu
- Beautiful, mobile-first design
- Photos, descriptions, prices
- Dietary tags (vegan, gluten-free, etc.)
- Allergen information
- Search and filter
- Works on any smartphone

### 2. AI Menu Assistant
- Answers customer questions 24/7
- Uses actual menu data (not internet)
- Handles dietary questions
- Makes recommendations
- Never gives medical/allergy advice

### 3. Online Ordering
- Dine-in (table number) or pickup
- Cart building
- Special instructions/notes
- Secure Stripe payment
- Order confirmation

### 4. Kitchen Display System (KDS)
- Real-time order tickets
- Status workflow: New → Preparing → Ready
- One-tap status changes
- Pickup codes displayed
- Works on any tablet/screen

### 5. Admin Dashboard
- Menu management
- Order history
- Analytics preview
- Settings
- User management

### 6. Multi-Tenant Architecture
- Each restaurant gets own slug (e.g., tccmenus.com/menu?tenant=joes-pizza)
- Fully isolated data
- Custom branding per tenant
- Individual Stripe accounts via Stripe Connect

---

## Pricing Plans

### Starter - $299 setup + $49/month
- QR menu up to 50 items
- Basic branding (logo and colors)
- Email support
- Self-service menu updates
- **Best for**: Small cafes, food trucks

### Professional - $499 setup + $99/month ⭐
- Unlimited menu items
- Full branding customization
- AI menu assistant
- Online ordering with payments
- Kitchen Display System (KDS)
- Priority phone support
- Analytics dashboard
- **Best for**: Full-service restaurants

### Enterprise - $799 setup + $149/month
- Everything in Professional
- Multiple locations
- POS integration (Clover, Square)
- Dedicated account manager
- Custom training session
- White-label options
- **Best for**: Multi-location restaurants, chains

---

## Onboarding Process

### Step 1: Restaurant Signs Up
- Completes checkout at tccmenus.com/billing
- Selects plan (Starter/Professional/Enterprise)
- Pays setup + first month

### Step 2: Menu Collection
- TCC team requests menu (PDF, photos, or existing digital)
- Restaurant provides logo, colors, any photos

### Step 3: Menu Import
- TCC creates digital menu in admin panel
- Sets up categories, items, prices, tags
- Configures branding (colors, logo)

### Step 4: Kitchen PIN Setup
- Unique 4-digit PIN set for KDS access
- Prevents unauthorized kitchen access

### Step 5: Stripe Connect (for ordering)
- Restaurant connects their Stripe account
- Payments flow directly to their bank
- TCC does not touch their money

### Step 6: Ordering Activation
- Toggle enabled in settings
- Dine-in and/or pickup modes configured

### Step 7: QR Code Generation
- QR codes created for tables
- Restaurant prints/displays them

### Step 8: Go Live
- Menu activated (status → ACTIVE)
- Restaurant starts using system

---

## Technical Details

### URLs

| Function | URL Pattern |
|----------|-------------|
| Landing Page | tccmenus.com |
| Live Demo | tccmenus.com/demo |
| Menu View | tccmenus.com/menu?tenant={slug} |
| Kitchen | tccmenus.com/kitchen?tenant={slug} |
| Admin | tccmenus.com/admin?tenant={slug} |
| Billing | tccmenus.com/billing?tenant={slug} |

### Tenant Isolation

Each restaurant (tenant) has:
- Unique slug (e.g., "joes-pizza")
- Separate menu data
- Separate orders
- Separate settings
- Separate Stripe account

**Critical**: Changes to one tenant NEVER affect another tenant.

### Data Storage

- **Database**: PostgreSQL (Neon) via Prisma ORM
- **File Fallback**: JSON files in /data/tenants/{slug}/ for demo and backup
- **Menu Priority**: Database first, then file fallback

### Payment Flow

1. Customer pays via Stripe Checkout
2. Payment goes to restaurant's Stripe Connect account
3. Stripe sends webhook to confirm payment
4. Order marked as paid in database
5. Order appears on KDS

---

## Common Issues & Solutions

### "Menu shows payment required"
- **Cause**: Tenant status is not ACTIVE
- **Solution**: Activate tenant via admin API or promote route

### "Orders not appearing in kitchen"
- **Cause**: KDS not connected or wrong tenant
- **Solution**: Verify tenant parameter in URL, check PIN

### "QR code not working"
- **Cause**: Invalid URL or tenant not active
- **Solution**: Verify QR points to correct tenant URL

### "Customer can't pay"
- **Cause**: Stripe Connect not set up
- **Solution**: Complete Stripe Connect onboarding in admin

### "AI not answering correctly"
- **Cause**: Menu data incomplete or tags missing
- **Solution**: Update menu with complete descriptions and dietary tags

---

## Support Contacts

- Technical issues: tech@tccsolutions.com
- Billing questions: billing@tccsolutions.com
- General inquiries: hello@tccsolutions.com
- Sales: calendly.com/tccsolutions2025/30min

---

## FAQ

**Q: Do customers need to download an app?**
A: No. Menu opens in their phone's browser.

**Q: Does this replace our POS?**
A: No. TCC Menus works alongside existing systems.

**Q: How fast is setup?**
A: Most restaurants are live within 24 hours.

**Q: What if we need to change prices?**
A: Update instantly from admin panel — no reprinting.

**Q: Is there a contract?**
A: No. Month-to-month, cancel anytime.

**Q: Where does payment go?**
A: Directly to restaurant's bank via their Stripe account.

**Q: What's the refund policy?**
A: 30-day money-back guarantee on all plans.

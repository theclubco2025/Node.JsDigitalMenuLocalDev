# Catering System Makeover Plan

## Executive Summary

Transform the existing digital menu SaaS into a **Catering Order Builder** that solves a specific problem:

> **Catering businesses waste time going back and forth with customers via text, calls, and email to build custom orders and give quotes.**

The new system allows customers to:
1. Build their own catering order from your menu
2. See real-time pricing (no more "let me get back to you")
3. Enter event details (date, guest count, location, dietary needs)
4. Submit a structured inquiry or place a deposit
5. Caterer receives a clean, organized order — ready to execute

---

## 1. Feature Mapping: What to Reuse, Modify, or Remove

### ✅ REUSE AS-IS

| Current Feature | Catering Use |
|----------------|--------------|
| **Menu data structure** (`categories → items`) | Perfect for catering packages/items |
| **Per-item pricing** | Base pricing for order builder calculations |
| **Item images** | Showcase catering platters and packages |
| **Dietary tags** (vegetarian, vegan, GF) | Critical for large events with mixed dietary needs |
| **Tenant/multi-business architecture** | Each caterer gets their own branded portal |
| **Theme system** (colors, branding) | White-label for each caterer |
| **Stripe integration** | Deposit collection |
| **Twilio SMS** | Order confirmations and updates |
| **Admin authentication** | Caterer login to view orders |
| **File-based tenant data** | Easy onboarding without DB setup |

### 🔧 MODIFY

| Current Feature | Current Behavior | Catering Modification |
|-----------------|------------------|----------------------|
| **Cart** | Add items for immediate checkout | → **Order Builder** with per-person quantities and event scaling |
| **Checkout flow** | Email, name, tip, pay now | → **Event Details Form**: date, time, guest count, location, contact, dietary summary |
| **Order model** | `Order` with items, paid status | → **Inquiry/Quote** model: add `eventDate`, `guestCount`, `location`, `status` (INQUIRY → QUOTED → CONFIRMED → COMPLETED) |
| **Pricing display** | Fixed per-item price | → **Dynamic pricing**: per-person minimums, serving size options, automatic total |
| **Kitchen display** | Real-time order queue | → **Order Dashboard**: upcoming events calendar, order details, export/print |
| **AI Assistant** | "What's in the pasta?" | → "How much food do I need for 50 people?" / "What's good for a corporate lunch?" |
| **Success page** | "Your order is being prepared" | → "Inquiry Submitted — We'll confirm within 24 hours" or "Deposit Received — Event Confirmed" |

### ❌ REMOVE OR HIDE

| Feature | Why Remove |
|---------|-----------|
| **Dine-in table number** | Not applicable to catering |
| **Pickup time scheduling** (15-min slots) | Replace with event date picker |
| **Kitchen PIN system** | Overkill for catering dashboard |
| **Real-time order status** (PREPARING → READY) | Events are scheduled days/weeks ahead |
| **"Add tip" at checkout** | Awkward for catering invoices; handle separately |
| **SMS "Order Ready" notifications** | Replace with confirmation/reminder SMS |
| **SaaS billing tiers** (BASIC/PREMIUM) | Simplify for MVP launch |

---

## 2. Required New Features (MVP ONLY)

### 2.1 Order Builder (Replaces Cart)

**Core changes to existing cart:**
- [ ] Add **"Serves X people"** display per item (use `item.serves` or calculate from portions)
- [ ] Add **quantity multiplier** logic: "50 guests ÷ serves 10 = need 5 platters"
- [ ] Show **running total** with automatic updates
- [ ] Add **per-item notes** field (e.g., "No onions on half")

**Data model addition:**
```prisma
model MenuItem {
  // ... existing fields
  servingSize     Int?      // e.g., "Serves 10"
  servingUnit     String?   // e.g., "people", "pieces"
  minimumQuantity Int?      // e.g., must order at least 2
  pricingType     String?   // "per_person" | "per_platter" | "flat"
}
```

### 2.2 Event Details Form

**New fields to collect (add to Order or new CateringInquiry model):**

```prisma
model CateringInquiry {
  id              String   @id @default(cuid())
  tenantId        String
  
  // Event details
  eventDate       DateTime
  eventTime       String?           // "12:00 PM - 2:00 PM"
  guestCount      Int
  eventType       String?           // "Corporate", "Wedding", "Birthday", etc.
  
  // Location
  deliveryAddress String?
  venueName       String?
  deliveryNotes   String?           // "Enter through loading dock"
  
  // Contact
  customerName    String
  customerEmail   String
  customerPhone   String
  companyName     String?
  
  // Dietary summary
  dietaryNotes    String?           // "5 vegetarian, 2 gluten-free"
  
  // Order content
  items           CateringInquiryItem[]
  subtotalCents   Int
  estimatedTotal  Int
  
  // Status flow
  status          InquiryStatus     @default(SUBMITTED)
  
  // Deposit
  depositRequired Boolean           @default(false)
  depositCents    Int?
  depositPaidAt   DateTime?
  
  // Notes
  customerNotes   String?
  staffNotes      String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum InquiryStatus {
  SUBMITTED       // Customer submitted
  VIEWED          // Caterer opened it
  QUOTED          // Caterer sent custom quote
  CONFIRMED       // Customer confirmed (deposit paid or invoice sent)
  COMPLETED       // Event done
  CANCELED
}
```

### 2.3 Pricing Logic

**Simple rules for MVP:**
- Each menu item has a price (existing)
- Each item optionally has `servingSize` (e.g., "serves 10")
- Display: "$45/platter (serves 10)" or "$8.50/person"
- Auto-calculate: `quantity × price = line total`
- Show running total as customer builds order

**Future (not MVP):**
- Minimum order amounts
- Delivery fees based on distance
- Rush order surcharges
- Package discounts

### 2.4 Submission Flow

**Two modes (configurable per tenant):**

1. **Inquiry Mode** (default for MVP):
   - Customer builds order → enters event details → submits
   - Caterer receives structured inquiry via email/dashboard
   - Caterer follows up to confirm and collect payment
   - No Stripe required

2. **Deposit Mode** (optional):
   - Same as above, but final step = collect deposit (e.g., 25%)
   - Use existing Stripe integration
   - Remainder due on event day (offline)

### 2.5 Business Dashboard Updates

**Modify existing `/admin/orders` to:**
- Show **upcoming events** sorted by date (not creation time)
- Display **guest count**, **event type**, **location**
- One-click to view full order details
- Print/export order as PDF (basic)
- Quick status updates: Viewed → Quoted → Confirmed

---

## 3. UX Flow (Step-by-Step)

### Customer Journey

```
┌─────────────────────────────────────────────────────────────────────┐
│                        LANDING PAGE                                  │
│  "Build Your Catering Order in Minutes"                             │
│  [Browse Menu] [How It Works] [Contact Us]                          │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        MENU BROWSER                                  │
│  Categories: Appetizers | Mains | Sides | Desserts | Beverages      │
│                                                                      │
│  ┌─────────────────────┐  ┌─────────────────────┐                   │
│  │ [Image]             │  │ [Image]             │                   │
│  │ Party Platter       │  │ Grilled Chicken     │                   │
│  │ Serves 20 | $89     │  │ $12/person          │                   │
│  │ [Add to Order]      │  │ [Add to Order]      │                   │
│  └─────────────────────┘  └─────────────────────┘                   │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ YOUR ORDER                           Subtotal: $456.00       │    │
│  │ 3 items for ~50 guests              [Review Order →]         │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     ORDER REVIEW                                     │
│                                                                      │
│  Party Platter (serves 20)      x2     $178.00                      │
│  Grilled Chicken ($12/person)   x50    $600.00                      │
│  Garden Salad (serves 10)       x5     $125.00                      │
│  ─────────────────────────────────────────                          │
│  Estimated Total:                      $903.00                      │
│                                                                      │
│  [← Edit Order]                        [Continue →]                 │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    EVENT DETAILS                                     │
│                                                                      │
│  Event Date: [📅 March 28, 2026    ]   Time: [12:00 PM ▼]          │
│  Guest Count: [50                  ]   Event Type: [Corporate ▼]   │
│                                                                      │
│  Delivery Address:                                                   │
│  [123 Main Street, Suite 400                              ]         │
│  [San Francisco, CA 94102                                 ]         │
│                                                                      │
│  Delivery Notes: (loading dock, parking, etc.)                      │
│  [Enter through the back entrance, ask for Sarah         ]          │
│                                                                      │
│  Dietary Requirements:                                               │
│  [5 vegetarian, 2 gluten-free, 1 nut allergy            ]           │
│                                                                      │
│                                        [Continue →]                 │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CONTACT INFO                                      │
│                                                                      │
│  Your Name: [Jane Smith                        ]                    │
│  Email:     [jane@company.com                  ]                    │
│  Phone:     [(555) 123-4567                    ]                    │
│  Company:   [Acme Corp (optional)              ]                    │
│                                                                      │
│  Additional Notes:                                                   │
│  [Can we get extra napkins and plates?                   ]          │
│                                                                      │
│  [ ] I agree to the terms of service                                │
│                                                                      │
│  [Submit Inquiry]  or  [Pay $226 Deposit Now]                       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CONFIRMATION                                      │
│                                                                      │
│  ✅ Your catering inquiry has been submitted!                       │
│                                                                      │
│  Order #: CAT-2026-0328-A                                           │
│  Event: March 28, 2026 at 12:00 PM                                  │
│  Guests: 50 | Estimated Total: $903.00                              │
│                                                                      │
│  What happens next:                                                  │
│  1. We'll review your order within 24 hours                         │
│  2. You'll receive a confirmation email with final pricing          │
│  3. Once confirmed, we'll send a deposit invoice                    │
│                                                                      │
│  Questions? Call us at (555) 987-6543                               │
│                                                                      │
│  [Download Order Summary]                                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Admin Side (Business Owner View)

### Dashboard Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│  🍽️ BELLA CATERING                              [Menu] [Settings]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  UPCOMING EVENTS                                    This Week: 3    │
│  ───────────────────────────────────────────────────────────────    │
│                                                                      │
│  📅 TODAY - March 25                                                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 🟢 CONFIRMED | Corporate Lunch | 50 guests                  │   │
│  │ Acme Corp | 12:00 PM | 123 Main St                          │   │
│  │ $903.00 | Deposit: Paid ✓                                   │   │
│  │ [View Details] [Print Order]                                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  📅 MARCH 28                                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 🟡 QUOTED | Birthday Party | 30 guests                       │   │
│  │ Smith Family | 3:00 PM | 456 Oak Ave                         │   │
│  │ $540.00 | Awaiting confirmation                              │   │
│  │ [View Details] [Send Reminder]                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  📅 MARCH 30                                                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 🔴 NEW | Wedding Rehearsal | 75 guests                       │   │
│  │ Johnson Wedding | 6:00 PM | Grand Hotel                      │   │
│  │ $1,425.00 | Review & Quote                                   │   │
│  │ [View Details] [Mark as Reviewed]                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Order Detail View

```
┌─────────────────────────────────────────────────────────────────────┐
│  ORDER #CAT-2026-0328-A                          Status: [QUOTED ▼] │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  EVENT DETAILS                                                       │
│  ────────────                                                        │
│  📅 March 28, 2026 at 12:00 PM                                      │
│  👥 50 guests | Corporate Lunch                                     │
│  📍 123 Main Street, Suite 400, SF 94102                            │
│  📝 "Enter through back entrance, ask for Sarah"                    │
│                                                                      │
│  CONTACT                                                             │
│  ───────                                                             │
│  Jane Smith | jane@company.com | (555) 123-4567                     │
│  Acme Corp                                                           │
│                                                                      │
│  DIETARY NOTES                                                       │
│  ────────────                                                        │
│  5 vegetarian, 2 gluten-free, 1 nut allergy                         │
│                                                                      │
│  ORDER ITEMS                                                         │
│  ───────────                                                         │
│  2x  Party Platter (serves 20)              $178.00                 │
│  50x Grilled Chicken ($12/person)           $600.00                 │
│  5x  Garden Salad (serves 10)               $125.00                 │
│  ─────────────────────────────────────────────────                  │
│  Subtotal:                                  $903.00                 │
│  Delivery Fee:                               $50.00                 │
│  ─────────────────────────────────────────────────                  │
│  TOTAL:                                     $953.00                 │
│                                                                      │
│  DEPOSIT (25%): $238.25  [Mark as Paid]                             │
│                                                                      │
│  STAFF NOTES                                                         │
│  [Add internal notes here...                               ]        │
│                                                                      │
│  [Print Order] [Email Customer] [Export PDF]                        │
└─────────────────────────────────────────────────────────────────────┘
```

### How It Saves Time

| Before (Manual Process) | After (Catering System) |
|------------------------|-------------------------|
| Customer calls → you take notes | Customer enters details themselves |
| "Let me calculate that..." → call back | Customer sees price instantly |
| "What date again?" → back and forth | Event date on submission |
| "How many vegetarians?" → forgot to ask | Collected in form |
| Scribbled order on paper → lost | Organized in dashboard |
| "Did they pay deposit?" → check email | Status tracked in system |

---

## 5. Quick Wins (HIGH ROI CHANGES)

Ranked by impact ÷ effort:

### 1. **Rename UI Labels** (30 min)
- "Cart" → "Your Order"
- "Checkout" → "Review & Submit"
- "Place Order" → "Submit Inquiry" or "Request Quote"
- Update `MenuClient.tsx` strings

### 2. **Add "Serves X" to Menu Items** (1 hour)
- Add `servingSize` to item display
- Show: "$89 / platter (serves 20)"
- Add field to existing menu JSON structure

### 3. **Add Guest Count to Checkout** (2 hours)
- Single input field at top of checkout
- Store in `Order.guestCount` (new column)
- Display in admin order view

### 4. **Add Event Date Picker** (2 hours)
- Replace time slots with full date picker
- Allow dates 2+ days in future (configurable lead time)
- Store in existing `scheduledFor` field

### 5. **Add Delivery Address** (1 hour)
- Two text fields: address, notes
- Store in new `deliveryAddress` and `deliveryNotes` columns

### 6. **Convert Kitchen View → Event Dashboard** (3 hours)
- Sort by event date (not created date)
- Show guest count prominently
- Show delivery address
- Remove "PREPARING → READY" status updates

### 7. **Add "Dietary Notes" Field** (30 min)
- Free-text field in checkout
- "5 vegetarian, 2 gluten-free"
- Store in `Order.note` or new column

### 8. **Update Confirmation Page** (1 hour)
- Remove "Your order is being prepared"
- Add "We'll confirm your inquiry within 24 hours"
- Show event summary clearly

### 9. **Email Notification to Caterer** (2 hours)
- Send email when new inquiry arrives
- Include all event details
- Link to admin dashboard

### 10. **Hide Unnecessary Fields** (30 min)
- Remove "tip" from checkout
- Remove "table number"
- Remove "pickup time" slots

---

## 6. What NOT to Build (CRITICAL)

### ❌ Do NOT Build for MVP

| Feature | Why Skip It |
|---------|-------------|
| **Online invoicing system** | Caterers have QuickBooks/Wave; just collect deposits |
| **Contract/e-signature** | Overkill; phone confirmation works |
| **Customer accounts/login** | Friction; use email-based lookups |
| **Recurring orders** | Edge case; add later based on demand |
| **Multi-location management** | Separate tenant per location works fine |
| **Inventory tracking** | Caterers manage this externally |
| **Driver/delivery tracking** | Out of scope; they know their drivers |
| **Real-time order modifications** | Phone call works for changes |
| **Chat/messaging system** | Phone/email works; don't reinvent Slack |
| **Complex discount codes** | Manual adjustments for MVP |
| **Automated quote generation** | Start with manual review |
| **Calendar sync (Google/Outlook)** | Nice-to-have; not blocking |
| **Mobile app** | Mobile web works great |
| **Multi-language support** | English-first; add if specific customer needs |
| **Custom reporting/analytics** | Basic dashboard is enough |

### ❌ Avoid These Traps

1. **Don't over-engineer pricing logic** — Start simple: price × quantity. Add per-person, minimums, etc. only when customers ask.

2. **Don't build a CRM** — The dashboard + email is enough to start. Caterers can use their existing tools.

3. **Don't require deposits** — Make it optional. Many caterers invoice after the event.

4. **Don't build complex scheduling** — A date picker is enough. Block-out dates can be manual for now.

---

## 7. Positioning Translation

Convert technical features into benefits caterers understand:

| Technical Feature | Business Value |
|-------------------|----------------|
| "Online order builder" | → **"Customers build their own orders — no more phone tag"** |
| "Automatic price calculation" | → **"Customers see their total instantly — no more 'let me get back to you'"** |
| "Event details form" | → **"Every order has date, guest count, and address — no more missing info"** |
| "Dietary notes collection" | → **"Never forget to ask about allergies again"** |
| "Centralized dashboard" | → **"All your upcoming events in one place — not scattered across texts and emails"** |
| "Mobile-responsive menu" | → **"Customers can order from their phone while planning their event"** |
| "Branded portal" | → **"Your menu, your colors, your logo — looks professional"** |
| "Deposit collection" | → **"Get paid upfront — reduce no-shows and cancellations"** |
| "Email confirmations" | → **"Automatic confirmations — one less thing to remember"** |
| "QR code access" | → **"Put the link on your business card — easy to share"** |

### Landing Page Copy Ideas

**Headline Options:**
- "Stop Playing Phone Tag with Catering Customers"
- "Let Customers Build Their Own Catering Orders"
- "The Simplest Way to Take Catering Orders Online"

**Subhead:**
- "Your menu. Instant pricing. Structured orders. No back-and-forth."

**Problem Statement:**
> Every catering inquiry starts the same way: "How much for 50 people?" Then you're texting back and forth, trying to nail down the date, the location, the dietary restrictions... It's exhausting. And half of them ghost you anyway.

**Solution:**
> Give customers a link to your catering menu. They build their order, see the price instantly, and submit all the details you need in one clean form. You wake up to organized orders in your inbox — not 47 unread texts.

---

## 8. Implementation Priority

### Phase 1: Core Pivot (Week 1-2)
1. Add event date picker (replace time slots)
2. Add guest count field
3. Add delivery address fields
4. Add dietary notes field
5. Update confirmation page copy
6. Rename UI labels ("Cart" → "Order Builder")
7. Hide tip/table number fields
8. Update admin dashboard to show events by date

### Phase 2: Polish (Week 3)
1. Add "Serves X" to menu item display
2. Add email notification to caterer on new inquiry
3. Add basic PDF export for orders
4. Update landing page for catering positioning
5. Create demo catering menu

### Phase 3: Optional Enhancements (Based on Feedback)
1. Deposit collection via Stripe
2. Status workflow (Submitted → Viewed → Quoted → Confirmed)
3. SMS reminders before event
4. Simple reporting (orders this month, revenue)

---

## 9. Files to Modify

### High Priority
- `components/MenuClient.tsx` — Cart UI, checkout flow, labels
- `app/api/orders/checkout/route.ts` — Add new fields, validation
- `prisma/schema.prisma` — Add `guestCount`, `eventType`, `deliveryAddress`, etc.
- `app/order/success/page.tsx` — Update confirmation copy
- `app/admin/orders/ui.tsx` — Event-focused dashboard
- `app/kitchen/page.tsx` — Remove or redirect to dashboard

### Medium Priority
- `data/tenants/demo/menu.json` — Add catering-style items with `servingSize`
- `app/page.tsx` — Update landing page for catering
- `lib/notifications/twilio.ts` — Update SMS copy for catering
- `types/api.ts` — Add new types for catering fields

### Low Priority (Later)
- `app/api/orders/confirm/route.ts` — Deposit confirmation
- New file: `lib/pdf/orderSummary.ts` — PDF generation
- New file: `components/CateringOrderBuilder.tsx` — If we want clean separation

---

## 10. Success Metrics

How to know if the pivot is working:

| Metric | Target |
|--------|--------|
| Caterers signed up | 5 in first month |
| Inquiries per caterer | 10+/month average |
| Time from landing page to submission | < 5 minutes |
| Caterer feedback: "saves me time" | 4/5 rating |
| Conversion: inquiry → confirmed event | Track (no target yet) |

---

## Summary

This pivot repurposes 80%+ of the existing codebase. The core changes are:

1. **Swap "pickup time" for "event date"**
2. **Add guest count + delivery address**
3. **Rename cart → order builder**
4. **Update confirmation messaging**
5. **Make admin dashboard event-focused**

The hardest part isn't code — it's resisting the urge to overbuild. Start scrappy, get 5 paying caterers, then add features they ask for.

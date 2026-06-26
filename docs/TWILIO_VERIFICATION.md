# Twilio Toll-Free Verification (PlateHaven)

Verification SID: `HH7f6dd047ffc3ae9c79542db7a0ce14a7`  
Number: `+1 (844) 524-1711`  
Account SID: see Twilio Console (do not commit full SID)  
**Status:** `REJECTED` (May 25, 2026 — resubmit after checklist below; **do not submit until legal name + evidence are ready**)

## Rejection codes (fix all 3)

| Code | Meaning | Fix |
|------|---------|-----|
| **30484** | Business name must match official records | Legal name + EIN must match IRS/state records exactly. DBA `PlateHaven` only if filed. |
| **30506** | Opt-in must reflect the **end business** | Evidence must show restaurant name (not PlateHaven as SMS sender). |
| **30513** | Opt-in consent / public proof insufficient | Public opt-in page + screenshots: unchecked boxes, full disclosure, phone field. |

## What PlateHaven is (for reviewers)

PlateHaven is the **technology layer**. The **end business** is each restaurant/operator on the platform.

- SMS body and opt-in name the **restaurant the customer ordered from**
- PlateHaven appears only as platform context in policy pages

---

## 30484 — Business name (YOU fix in Twilio Console)

In **Twilio Console → Messaging → Toll-Free Verification** (edit `HH7f6dd047ffc3ae9c79542db7a0ce14a7`) and **Trust Hub**:

| Field | What to enter |
|-------|----------------|
| **Legal business name** | Exact name on EIN letter / state registration (not nickname) |
| **DBA** | `PlateHaven` only if you have a filed fictitious-name/DBA on that EIN |
| **Business type** | Match filing (`SOLE_PROPRIETOR`, `LLC`, etc.) |
| **EIN / registration number** | Full 9-digit EIN (was empty — triggers 30484) |
| **Address / phone / email** | Match Trust Hub / compliance profile |
| **Website** | `https://platehaven.app` |

If the EIN is issued to an LLC (e.g. TCC Solutions LLC), use that as legal name — not a personal name unless the EIN is sole prop under that name.

---

## 30506 + 30513 — Live URLs (deployed on platehaven.app)

| Purpose | URL |
|---------|-----|
| Business website | `https://platehaven.app` |
| Privacy policy | `https://platehaven.app/privacy` |
| SMS terms | `https://platehaven.app/sms-terms` |
| **Opt-in disclosure (primary evidence)** | `https://platehaven.app/compliance/sms-opt-in` |
| Live menu with end-business branding | `https://platehaven.app/menu?tenant=independentbarandgrille` |

### Screenshots to upload

1. Full `/compliance/sms-opt-in` — both checkboxes **unchecked**, restaurant name visible, STOP/HELP/rates visible, phone + email fields visible
2. `/sms-terms` — “Who sends the messages” + example opt-in language
3. (Optional) Checkout on independentbarandgrille with items in cart — only if SMS UI temporarily enabled for capture

### Transactional opt-in language (checkout + compliance page)

> By checking this box, you agree to receive SMS/text messages from **[Restaurant Name]** (the business you are ordering from) about this order, including order confirmations, status updates, and pickup/ready alerts. Consent is optional and not required to purchase. Message frequency varies. Msg & data rates may apply. Reply STOP to opt out or HELP for help.

### Marketing opt-in language (separate checkbox)

> Optional: I agree to receive recurring marketing and retention messages from **[Restaurant Name]** by email and, if I provided a phone number, by SMS — including review requests and occasional promotions. Separate from order-status SMS. Consent is optional and not required to purchase. Email unsubscribe links are included in marketing emails. For SMS: message frequency varies; msg & data rates may apply; reply STOP to opt out or HELP for help.

### Sample messages for Twilio form (use end business name)

**Transactional:**

`Your order from The Independent Restaurant & Bar is ready for pickup. Pickup code: 1234. Reply STOP to opt out, HELP for help.`

**Marketing (if declaring MARKETING category):**

`How was your meal from The Independent Restaurant & Bar? We'd love your feedback: https://example.com/review Reply STOP to opt out, HELP for help.`

Do **not** use “PlateHaven” as the sender in sample messages.

### Use case fields (paste into Twilio)

- **Categories:** `CUSTOMER_CARE`. Add `MARKETING` only if marketing checkbox evidence is uploaded.
- **Summary:** PlateHaven enables direct ordering for independent restaurants. Customers opt in at checkout via separate unchecked boxes to receive SMS from the restaurant they ordered from for order status and optional marketing. Consent is not required to purchase. STOP/HELP supported.
- **Opt-in description:** Public page at `/compliance/sms-opt-in`; two separate unchecked checkboxes at checkout; default off; phone field in same form.

---

## Resubmission checklist (YOU complete, then resubmit in Console)

- [ ] Legal name + EIN match official records (30484)
- [ ] DBA filed correctly if using “PlateHaven” as trade name
- [ ] `/compliance/sms-opt-in` live and reviewed
- [ ] Screenshots attached (30506 + 30513)
- [ ] Sample messages use restaurant name, not PlateHaven
- [ ] Privacy + SMS terms URLs in form
- [ ] Resubmit TFV `HH7f6dd047ffc3ae9c79542db7a0ce14a7` within 7 days of rejection for prioritized queue

**Agent will NOT submit TFV for you.** Confirm when ready.

---

## After approval — enable SMS in PlateHaven

1. Vercel Production env:
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_API_KEY_SID`, `TWILIO_API_KEY_SECRET`, `TWILIO_MESSAGING_SERVICE_SID`
   - `TWILIO_SMS_ENABLED=true`
   - `NEXT_PUBLIC_TWILIO_SMS_ENABLED=true`
2. Inbound webhook on Messaging Service: `https://platehaven.app/api/twilio/inbound`
3. Test: order with SMS opt-in → kitchen marks READY → SMS delivers
4. Until then: all notifications remain **email-only** via Resend (pilot default)

# Twilio Toll-Free Verification (PlateHaven)

Verification SID: `HH7f6dd047ffc3ae9c79542db7a0ce14a7`  
Number: `+1 (844) 524-1711`  
**Last API status:** `PENDING_REVIEW` (opt-in URLs and sample message updated; **30484 business name still needs your manual fix**)

## Current rejection codes (fix all 3)

| Code | Meaning | Fix |
|------|---------|-----|
| **30484** | Business name must match official records | Use exact legal name from EIN/SOS filing (not nickname). If sole prop uses DBA, set legal name + `Doing Business As` correctly in Twilio. |
| **30506** | Opt-in must clearly reflect the **end business** | Customer must opt in to messages from the restaurant they ordered from (tenant name), not PlateHaven as sender. |
| **30513** | Opt-in consent language/evidence insufficient | Public opt-in page + checkout screenshot with unchecked box and full SMS disclosure. |

## What PlateHaven is (important for reviewers)

PlateHaven is the **technology layer**. The **end business** is each restaurant/operator on the platform.

- Transactional SMS sender identity in messages: **{Restaurant Name}**
- PlateHaven should appear only as optional platform context in policy pages, not as primary SMS sender in opt-in or sample messages.

---

## 30484 — Business name fix (you must do this manually)

In Twilio TFV form, set:

- **Business legal name**: exact match to government/EIN records
- **Doing Business As (DBA)**: `PlateHaven` (only if filed/used on official records)
- **Business type**: match your filing (`SOLE_PROPRIETOR`, LLC, etc.)
- **Address/phone/email**: match compliance profile

If your legal name is personal but you operate as PlateHaven, ensure your state DBA/fictitious business name filing is reflected in Twilio fields.

Do **not** use a personal name unless that is the legal registered business name.

---

## 30506 + 30513 — Opt-in and sample message fix

### Live URLs to submit

- Business website: `https://platehaven.app`
- Privacy policy: `https://platehaven.app/privacy`
- SMS terms: `https://platehaven.app/sms-terms`
- Opt-in evidence URL #1: `https://platehaven.app/demo?tenant=demo` (checkout with SMS checkbox)
- Opt-in evidence URL #2: `https://platehaven.app/sms-terms`

Upload screenshots showing:
1. Unchecked SMS checkbox (default off)
2. Full consent text visible
3. Phone field in same checkout form
4. Restaurant/business name visible in page branding

### Transactional opt-in language (use this exact pattern)

> By checking this box, you agree to receive SMS/text messages from **[Restaurant Name]** (the business you are ordering from) about this order, including order confirmations, status updates, and pickup/ready alerts. Consent is optional and not required to purchase. Message frequency varies. Msg & data rates may apply. Reply STOP to opt out or HELP for help.

### Marketing opt-in language (separate checkbox)

> Optional: I agree to receive recurring marketing/retention SMS from **[Restaurant Name]**, including review requests and occasional promotions. Separate from order-status SMS. Consent is optional and not required to purchase. Message frequency varies. Msg & data rates may apply. Reply STOP to opt out or HELP for help.

### Production sample message (must name end business)

`Your order from Bella Vista is ready for pickup. Pickup code: 1234. Reply STOP to opt out, HELP for help.`

Do **not** use “PlateHaven business” in sample messages.

### Use case fields

- **Use case categories**: `CUSTOMER_CARE` (transactional). Add `MARKETING` only if marketing checkbox + separate consent is included in evidence.
- **Use case summary**: Transactional order updates and optional marketing/retention messages for customers who separately opt in at checkout. Messages identify the restaurant the customer ordered from.
- **Additional information**: Consent is collected via separate unchecked checkboxes at checkout. Consent is not a condition of purchase. STOP/HELP supported. Platform processes SMS on behalf of end businesses.

---

## Resubmission checklist

- [ ] Business legal name matches official records (30484)
- [ ] Opt-in screenshots show end-business branding (30506)
- [ ] Opt-in text includes SMS, optional consent, STOP/HELP, rates (30513)
- [ ] Sample message uses restaurant name, not PlateHaven
- [ ] Privacy + SMS terms URLs included
- [ ] Resubmit TFV `HH7f6dd047ffc3ae9c79542db7a0ce14a7`

---

## After approval

1. Set Vercel env vars: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_API_KEY_SID`, `TWILIO_API_KEY_SECRET`, `TWILIO_MESSAGING_SERVICE_SID`
2. Configure inbound webhook in Twilio Messaging Service: `https://platehaven.app/api/twilio/inbound`
3. Run one live order with SMS opt-in and mark order READY to confirm delivery

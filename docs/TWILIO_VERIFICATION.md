# Twilio Toll-Free Verification (PlateHaven)

Use this when resubmitting Toll-Free verification to resolve consent-related rejections.

## URLs

- Business website: `https://platehaven.app`
- Privacy policy: `https://platehaven.app/privacy`
- SMS terms (opt-in disclosures): `https://platehaven.app/sms-terms`

## Opt-in flow

- Opt-in type: `Web form`
- Consent capture location: checkout form checkbox (unchecked by default)
- Consent statement (exact):
  - `By checking this box, you agree to receive SMS text messages from <Business Name> about your order, including order confirmations, status updates, and pickup/ready alerts.`
  - `Consent is optional and not required to place an order. Message frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for help.`
- Upload at least one screenshot showing:
  - the checkbox unchecked by default
  - the full disclosure text visible
  - phone input field in the same flow

## Use case details

- Use case category: `Customer Care / Order Notifications`
- Messages sent:
  - Order confirmation/update notices
  - Ready-for-pickup or ready-for-table alerts
- Marketing claim:
  - No marketing messages from transactional opt-in
  - Marketing/retention messaging requires separate consent

## Sample message

`Your order from Demo Cafe is ready for pickup. Pickup code: 1234. Reply STOP to opt out, HELP for help.`

## Additional notes to include

- Consent is separate from Terms/Privacy acceptance.
- Consent is not a condition of purchase.
- STOP requests are honored by Twilio and also logged by the inbound webhook (`/api/twilio/inbound`) for suppression checks.

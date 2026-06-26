export const metadata = {
  title: 'SMS Opt-In Disclosure | PlateHaven',
  description:
    'How customers opt in to SMS from the restaurant they order from when using PlateHaven direct ordering.',
}

const EXAMPLE_BUSINESS = 'The Independent Restaurant & Bar'

export default function SmsOptInCompliancePage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold">SMS Opt-In at Checkout</h1>
        <p className="mt-3 text-sm leading-6 text-neutral-300">
          PlateHaven is the ordering platform. When you place an order, SMS/text messages about your order
          are sent on behalf of the <strong className="text-white">restaurant or food business you ordered from</strong>,
          not from PlateHaven as the message sender. The example below shows how opt-in appears at checkout.
        </p>

        <section className="mt-8 rounded-xl border border-neutral-700 bg-neutral-900 p-6">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
            Example checkout — end business
          </div>
          <div className="text-lg font-semibold text-white">{EXAMPLE_BUSINESS}</div>
          <p className="mt-1 text-xs text-neutral-400">
            Illustrative checkout fields (consent checkboxes default to unchecked)
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-neutral-400">Email (required for receipt)</label>
              <input
                type="email"
                readOnly
                disabled
                value="customer@example.com"
                className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-neutral-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400">Phone (for SMS if opted in)</label>
              <input
                type="tel"
                readOnly
                disabled
                value="(555) 555-0100"
                className="mt-1 w-full rounded-lg border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-neutral-300"
              />
            </div>
          </div>

          <label className="mt-5 flex items-start gap-3 rounded-xl border border-neutral-700 bg-neutral-800/80 px-4 py-4">
            <input type="checkbox" readOnly disabled className="mt-1 h-4 w-4" aria-label="Transactional SMS opt-in (unchecked by default)" />
            <div className="min-w-0 text-sm leading-6 text-neutral-200">
              <p className="font-semibold text-white">
                By checking this box, you agree to receive SMS/text messages from{' '}
                <span className="underline">{EXAMPLE_BUSINESS}</span> (the business you are ordering from) about
                this order, including order confirmations, status updates, and pickup/ready alerts.
              </p>
              <p className="mt-2 text-xs text-neutral-400">
                Consent is optional and not required to purchase. Message frequency varies. Msg &amp; data rates may apply.
                Reply STOP to opt out or HELP for help. See our{' '}
                <a className="underline hover:text-white" href="/sms-terms">SMS Terms</a>.
              </p>
            </div>
          </label>

          <label className="mt-3 flex items-start gap-3 rounded-xl border border-neutral-700 bg-neutral-800/80 px-4 py-4">
            <input type="checkbox" readOnly disabled className="mt-1 h-4 w-4" aria-label="Marketing SMS opt-in (unchecked by default)" />
            <div className="min-w-0 text-sm leading-6 text-neutral-200">
              <p className="font-semibold text-white">
                Optional: I agree to receive recurring marketing and retention messages from{' '}
                <span className="underline">{EXAMPLE_BUSINESS}</span> by email and, if I provided a phone number,
                by SMS — including review requests and occasional promotions.
              </p>
              <p className="mt-2 text-xs text-neutral-400">
                Separate from order-status SMS. Consent is optional and not required to purchase. Email unsubscribe
                links are included in marketing emails. For SMS: message frequency varies; msg &amp; data rates may apply;
                reply STOP to opt out or HELP for help.
              </p>
            </div>
          </label>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-6 text-neutral-200">
          <h2 className="text-lg font-semibold text-white">Consent requirements</h2>
          <ul className="list-disc space-y-2 pl-6">
            <li>Opt-in checkboxes are <strong>unchecked by default</strong>.</li>
            <li>Consent is <strong>optional</strong> and is not required to place an order or make a purchase.</li>
            <li>Transactional order SMS and marketing/retention SMS use <strong>separate</strong> checkboxes.</li>
            <li>Messages identify the <strong>restaurant or food business</strong> the customer ordered from.</li>
            <li>Customers may reply <strong>STOP</strong> to opt out and <strong>HELP</strong> for help.</li>
            <li>Message and data rates may apply; message frequency varies.</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3 text-sm leading-6 text-neutral-200">
          <h2 className="text-lg font-semibold text-white">Example message content</h2>
          <p className="rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 font-mono text-xs text-neutral-300">
            Your order from {EXAMPLE_BUSINESS} is ready for pickup. Pickup code: 1234. Reply STOP to opt out, HELP for help.
          </p>
        </section>

        <p className="mt-8 text-xs text-neutral-400">
          See also:{' '}
          <a className="underline hover:text-white" href="/sms-terms">SMS Terms</a>
          {' · '}
          <a className="underline hover:text-white" href="/privacy">Privacy Policy</a>
        </p>
      </div>
    </main>
  )
}

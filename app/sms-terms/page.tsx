export const metadata = {
  title: 'SMS Terms | PlateHaven',
}

export default function SmsTermsPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold">SMS Terms</h1>
        <p className="mt-3 text-sm text-neutral-300">
          PlateHaven provides SMS delivery on behalf of businesses using PlateHaven for direct ordering.
        </p>

        <section className="mt-6 space-y-3 text-sm leading-6 text-neutral-200">
          <h2 className="text-lg font-semibold text-white">Transactional Order Messages</h2>
          <p>
            If you opt in at checkout, you agree to receive transactional SMS messages about your order,
            including order confirmation, order status, and pickup/ready alerts.
          </p>
          <ul className="list-disc space-y-1 pl-6">
            <li>Consent is optional and is not required to purchase or place an order.</li>
            <li>Message frequency varies based on your order activity.</li>
            <li>Message and data rates may apply.</li>
            <li>Reply STOP to opt out.</li>
            <li>Reply HELP for help.</li>
          </ul>
        </section>

        <section className="mt-6 space-y-3 text-sm leading-6 text-neutral-200">
          <h2 className="text-lg font-semibold text-white">Marketing and Retention Messages</h2>
          <p>
            Marketing or retention SMS messages (for example review requests, promotions, or holiday reminders)
            are only sent if you separately opt in to marketing SMS. Order-status opt-in does not authorize
            marketing messaging.
          </p>
        </section>

        <p className="mt-8 text-xs text-neutral-400">
          For full details, see our <a className="underline hover:text-white" href="/privacy">Privacy Policy</a>.
        </p>
      </div>
    </main>
  )
}

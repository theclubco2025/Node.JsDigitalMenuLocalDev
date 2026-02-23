export const metadata = {
  title: 'Privacy | TCC Menus',
  description: 'Privacy policy for TCC Menus.',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy</h1>
        <p className="mt-3 text-sm text-neutral-600">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-neutral mt-8 max-w-none">
          <p>
            This Privacy page explains how information may be collected and used when guests and restaurants use TCC Menus.
          </p>

          <h2>Information that may be collected</h2>
          <ul>
            <li>
              <strong>Guest-provided information</strong> such as name, email, phone number, and optional order notes when
              placing an order (if ordering is enabled by the restaurant).
            </li>
            <li>
              <strong>Order details</strong> such as items selected, quantities, customization notes, and fulfillment type
              (pickup or dine‑in with a table number, when enabled).
            </li>
            <li>
              <strong>Technical data</strong> such as browser type and device information (standard for web services).
            </li>
          </ul>

          <h2>How information is used</h2>
          <ul>
            <li>To display menus and enable the ordering workflow when configured.</li>
            <li>To route orders to the kitchen display and show status updates.</li>
            <li>To provide admin reporting and analytics based on order activity.</li>
          </ul>

          <h2>Payments</h2>
          <p>
            Payments (when enabled) are processed by third-party providers (for example, Stripe). Payment information is
            handled under the payment provider’s privacy policy and terms.
          </p>

          <h2>Contact</h2>
          <p>
            For privacy questions, use the contact method provided on the homepage.
          </p>
        </div>

        <div className="mt-10">
          <a href="/" className="text-sm font-semibold text-neutral-950 underline underline-offset-4">
            Back to home
          </a>
        </div>
      </div>
    </main>
  )
}


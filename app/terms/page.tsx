export const metadata = {
  title: 'Terms | TCC Menus',
  description: 'Terms of service for TCC Menus.',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Terms</h1>
        <p className="mt-3 text-sm text-neutral-600">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-neutral mt-8 max-w-none">
          <p>
            These Terms govern your use of TCC Menus (the “Service”). By accessing or using the Service, you agree to these
            Terms.
          </p>

          <h2>1. The Service</h2>
          <p>
            TCC Menus provides a web-based menu experience, optional online ordering workflows, a kitchen display system
            interface, and admin tools. Features may vary by restaurant configuration.
          </p>

          <h2>2. AI Menu Assistant (accuracy disclaimer)</h2>
          <p>
            The Service may include an AI-powered menu assistant that generates responses based on menu data and configured
            restaurant information. AI-generated responses can be incorrect or incomplete.
          </p>
          <ul>
            <li>
              For allergies, dietary restrictions, and medical concerns, guests should confirm details with restaurant staff.
            </li>
            <li>
              Restaurants are responsible for reviewing and maintaining menu content, tags, and allergen/diet information.
            </li>
          </ul>

          <h2>3. Ordering and payments</h2>
          <p>
            Ordering features may be enabled or disabled by the restaurant. When payments are enabled, payment processing may
            be handled by third-party providers (for example, Stripe). Payment receipts, disputes, refunds, and payout timing
            are governed by the payment provider’s terms in addition to these Terms.
          </p>

          <h2>4. Limitations</h2>
          <p>
            The Service is provided “as is” and “as available.” We do not guarantee uninterrupted availability, and we do not
            guarantee that AI responses or menu information will be accurate.
          </p>

          <h2>5. Contact</h2>
          <p>
            Questions about these Terms can be directed through the contact method provided on the homepage.
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


export const metadata = {
  title: 'Privacy Policy | TCC Menus',
  description: 'Privacy Policy for TCC Menus digital restaurant menu platform.',
}

const EFFECTIVE_DATE = 'March 2, 2025'
const VERSION = '2025-03-02'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-3 text-sm text-neutral-600">
          Effective Date: {EFFECTIVE_DATE} | Version: {VERSION}
        </p>

        <div className="prose prose-neutral mt-8 max-w-none text-sm leading-relaxed">
          <p className="text-base">
            This Privacy Policy describes how TCC Solutions (&ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) collects, 
            uses, and shares information when you use the TCC Menus platform (the &ldquo;Service&rdquo;). This policy 
            applies to restaurant clients, their staff, and guests who interact with menus and ordering 
            features.
          </p>

          <hr className="my-6" />

          <h2 className="text-lg font-semibold">1. Information We Collect</h2>

          <h3 className="text-base font-semibold">1.1 Information You Provide</h3>
          <ul>
            <li>
              <strong>Account Information:</strong> When restaurants register, we collect business name, 
              contact email, and account credentials.
            </li>
            <li>
              <strong>Order Information:</strong> When guests place orders (if ordering is enabled), 
              we collect name, email, phone number (optional), and order details including items, 
              quantities, special instructions, and table number (for dine-in).
            </li>
            <li>
              <strong>Payment Information:</strong> Payment card details are collected and processed 
              by Stripe, Inc. We do not store full payment card numbers.
            </li>
            <li>
              <strong>Communications:</strong> When you contact us, we collect the content of your 
              messages and contact information.
            </li>
            <li>
              <strong>Terms Acceptance Records:</strong> When you accept our Terms of Service, we 
              log your email, IP address, timestamp, and the version of terms accepted.
            </li>
          </ul>

          <h3 className="text-base font-semibold">1.2 Information Collected Automatically</h3>
          <ul>
            <li>
              <strong>Device and Browser Information:</strong> Browser type, operating system, 
              device identifiers, and screen resolution.
            </li>
            <li>
              <strong>Usage Data:</strong> Pages viewed, features used, time spent, and interaction 
              patterns.
            </li>
            <li>
              <strong>IP Address:</strong> Your IP address for security, fraud prevention, and 
              compliance purposes.
            </li>
            <li>
              <strong>AI Assistant Interactions:</strong> Questions submitted to the AI menu 
              assistant and responses provided, for quality improvement.
            </li>
          </ul>

          <h2 className="text-lg font-semibold">2. How We Use Information</h2>
          <ul>
            <li>
              <strong>Provide the Service:</strong> Display menus, process orders, send order 
              confirmations and status updates.
            </li>
            <li>
              <strong>Process Payments:</strong> Facilitate payment processing through Stripe.
            </li>
            <li>
              <strong>Communications:</strong> Send transactional emails (order confirmations, 
              receipts) and optional SMS notifications when opted in.
            </li>
            <li>
              <strong>Analytics:</strong> Provide restaurant clients with order analytics and 
              insights.
            </li>
            <li>
              <strong>Improve the Service:</strong> Analyze usage patterns and AI interactions 
              to improve features and accuracy.
            </li>
            <li>
              <strong>Security:</strong> Detect and prevent fraud, abuse, and unauthorized access.
            </li>
            <li>
              <strong>Legal Compliance:</strong> Comply with legal obligations and enforce our 
              Terms of Service.
            </li>
          </ul>

          <h2 className="text-lg font-semibold">3. Information Sharing</h2>
          <p>We share information only as described below:</p>
          <ul>
            <li>
              <strong>With Restaurants:</strong> Order information is shared with the restaurant 
              fulfilling your order, including name, contact info, and order details.
            </li>
            <li>
              <strong>Service Providers:</strong> We use third-party providers for:
              <ul>
                <li>Payment processing (Stripe)</li>
                <li>SMS notifications (Twilio, when enabled)</li>
                <li>Cloud hosting and infrastructure (Vercel, Neon)</li>
                <li>AI services (OpenAI)</li>
              </ul>
            </li>
            <li>
              <strong>Legal Requirements:</strong> When required by law, legal process, or to 
              protect rights, safety, or property.
            </li>
            <li>
              <strong>Business Transfers:</strong> In connection with a merger, acquisition, or 
              sale of assets, your information may be transferred.
            </li>
          </ul>
          <p>
            <strong>We do not sell personal information.</strong>
          </p>

          <h2 className="text-lg font-semibold">4. Data Retention</h2>
          <ul>
            <li>
              <strong>Order Data:</strong> Retained for the duration of the restaurant&apos;s 
              subscription plus 3 years for tax and legal compliance.
            </li>
            <li>
              <strong>Account Data:</strong> Retained while the account is active and for 
              1 year after termination.
            </li>
            <li>
              <strong>Terms Acceptance Records:</strong> Retained indefinitely for legal 
              compliance purposes.
            </li>
            <li>
              <strong>AI Interaction Logs:</strong> Retained for 90 days for quality improvement, 
              then anonymized or deleted.
            </li>
          </ul>

          <h2 className="text-lg font-semibold">5. Your Rights (California Residents)</h2>
          <p>
            Under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act 
            (CPRA), California residents have the following rights:
          </p>
          <ul>
            <li>
              <strong>Right to Know:</strong> Request disclosure of the categories and specific 
              pieces of personal information we have collected.
            </li>
            <li>
              <strong>Right to Delete:</strong> Request deletion of your personal information, 
              subject to certain exceptions.
            </li>
            <li>
              <strong>Right to Correct:</strong> Request correction of inaccurate personal 
              information.
            </li>
            <li>
              <strong>Right to Opt-Out:</strong> Opt out of the sale or sharing of personal 
              information. Note: We do not sell personal information.
            </li>
            <li>
              <strong>Right to Non-Discrimination:</strong> We will not discriminate against 
              you for exercising your privacy rights.
            </li>
          </ul>
          <p>
            To exercise these rights, contact us at privacy@tccsolutions.com with the subject 
            line &ldquo;CCPA Request.&rdquo;
          </p>

          <h2 className="text-lg font-semibold">6. SMS Communications</h2>
          <p>
            If you opt in to SMS notifications when placing an order:
          </p>
          <ul>
            <li>You consent to receive transactional SMS messages about your order status.</li>
            <li>Message frequency depends on order activity.</li>
            <li>Message and data rates may apply.</li>
            <li>You can opt out by not selecting SMS notifications on future orders.</li>
            <li>SMS is provided through Twilio. See Twilio&apos;s privacy policy for details.</li>
          </ul>

          <h2 className="text-lg font-semibold">7. Cookies and Tracking</h2>
          <p>
            We use essential cookies for authentication and session management. We do not use 
            third-party advertising cookies or tracking pixels for advertising purposes.
          </p>

          <h2 className="text-lg font-semibold">8. Security</h2>
          <p>
            We implement industry-standard security measures including:
          </p>
          <ul>
            <li>Encryption of data in transit (TLS/HTTPS)</li>
            <li>Encryption of sensitive data at rest</li>
            <li>Access controls and authentication</li>
            <li>Regular security assessments</li>
          </ul>
          <p>
            However, no method of transmission or storage is 100% secure. We cannot guarantee 
            absolute security.
          </p>

          <h2 className="text-lg font-semibold">9. Children&apos;s Privacy</h2>
          <p>
            The Service is not directed to children under 13. We do not knowingly collect 
            personal information from children under 13. If you believe we have collected 
            information from a child under 13, please contact us immediately.
          </p>

          <h2 className="text-lg font-semibold">10. International Users</h2>
          <p>
            The Service is operated from the United States. If you access the Service from 
            outside the U.S., your information will be transferred to and processed in the 
            United States.
          </p>

          <h2 className="text-lg font-semibold">11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify restaurant 
            clients of material changes via email. The &ldquo;Effective Date&rdquo; at the top indicates 
            when this policy was last revised.
          </p>

          <h2 className="text-lg font-semibold">12. Contact Us</h2>
          <p>
            For privacy-related questions or to exercise your rights:
          </p>
          <ul>
            <li><strong>Email:</strong> privacy@tccsolutions.com</li>
            <li><strong>Subject Line:</strong> &ldquo;Privacy Inquiry&rdquo; or &ldquo;CCPA Request&rdquo;</li>
            <li><strong>Website:</strong> tccmenus.com</li>
          </ul>

          <hr className="my-6" />

          <h2 className="text-lg font-semibold">Categories of Personal Information Collected</h2>
          <p className="text-xs text-neutral-600">
            For CCPA compliance, the following categories of personal information may be collected:
          </p>
          <div className="text-xs">
            <table className="w-full border-collapse border border-neutral-300 text-left">
              <thead>
                <tr className="bg-neutral-50">
                  <th className="border border-neutral-300 px-3 py-2">Category</th>
                  <th className="border border-neutral-300 px-3 py-2">Examples</th>
                  <th className="border border-neutral-300 px-3 py-2">Collected</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-neutral-300 px-3 py-2">Identifiers</td>
                  <td className="border border-neutral-300 px-3 py-2">Name, email, phone, IP address</td>
                  <td className="border border-neutral-300 px-3 py-2">Yes</td>
                </tr>
                <tr>
                  <td className="border border-neutral-300 px-3 py-2">Commercial Information</td>
                  <td className="border border-neutral-300 px-3 py-2">Orders, transaction history</td>
                  <td className="border border-neutral-300 px-3 py-2">Yes</td>
                </tr>
                <tr>
                  <td className="border border-neutral-300 px-3 py-2">Internet Activity</td>
                  <td className="border border-neutral-300 px-3 py-2">Browsing history, interactions</td>
                  <td className="border border-neutral-300 px-3 py-2">Yes</td>
                </tr>
                <tr>
                  <td className="border border-neutral-300 px-3 py-2">Geolocation</td>
                  <td className="border border-neutral-300 px-3 py-2">General location from IP</td>
                  <td className="border border-neutral-300 px-3 py-2">Yes</td>
                </tr>
                <tr>
                  <td className="border border-neutral-300 px-3 py-2">Inferences</td>
                  <td className="border border-neutral-300 px-3 py-2">Preferences, patterns</td>
                  <td className="border border-neutral-300 px-3 py-2">Yes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-10 flex items-center gap-4">
          <a href="/" className="text-sm font-semibold text-neutral-950 underline underline-offset-4">
            Back to home
          </a>
          <a href="/terms" className="text-sm font-semibold text-neutral-600 underline underline-offset-4">
            Terms of Service
          </a>
        </div>
      </div>
    </main>
  )
}

export const metadata = {
  title: 'Terms of Service | TCC Menus',
  description: 'Terms of Service for TCC Menus digital restaurant menu platform.',
}

const EFFECTIVE_DATE = 'March 2, 2025'
const VERSION = '2025-03-02'

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="mt-3 text-sm text-neutral-600">
          Effective Date: {EFFECTIVE_DATE} | Version: {VERSION}
        </p>

        <div className="prose prose-neutral mt-8 max-w-none text-sm leading-relaxed">
          <p className="text-base">
            These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you and TCC Solutions 
            (&ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) governing your access to and use of the TCC Menus platform and 
            related services (collectively, the &ldquo;Service&rdquo;).
          </p>

          <p className="font-semibold">
            BY ACCESSING OR USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE 
            BOUND BY THESE TERMS. IF YOU DO NOT AGREE TO THESE TERMS, DO NOT USE THE SERVICE.
          </p>

          <hr className="my-6" />

          <h2 className="text-lg font-semibold">1. Definitions</h2>
          <ul>
            <li><strong>&ldquo;Restaurant&rdquo;</strong> or <strong>&ldquo;Restaurant Client&rdquo;</strong> means the business entity that has subscribed to use the Service to manage their digital menu, ordering, and kitchen operations.</li>
            <li><strong>&ldquo;Guest&rdquo;</strong> or <strong>&ldquo;End User&rdquo;</strong> means any individual who accesses a Restaurant&apos;s menu through the Service.</li>
            <li><strong>&ldquo;Content&rdquo;</strong> means any text, images, data, or other materials uploaded to or generated through the Service.</li>
            <li><strong>&ldquo;Subscription&rdquo;</strong> means the paid access plan selected by a Restaurant Client.</li>
          </ul>

          <h2 className="text-lg font-semibold">2. Description of Service</h2>
          <p>
            TCC Menus provides a cloud-based software-as-a-service (SaaS) platform that enables restaurants to:
          </p>
          <ul>
            <li>Create and manage digital menus accessible via QR codes and web links</li>
            <li>Accept online orders with integrated payment processing (when enabled)</li>
            <li>Operate a kitchen display system (KDS) for order management</li>
            <li>Access analytics and reporting tools</li>
            <li>Utilize an AI-powered menu assistant for guest inquiries</li>
          </ul>

          <h2 className="text-lg font-semibold">3. Acceptance of Terms</h2>
          <h3 className="text-base font-semibold">3.1 For Restaurant Clients</h3>
          <p>
            By completing the onboarding process, making a payment, or clicking &ldquo;I Agree&rdquo; or similar acceptance 
            mechanism, you represent that you have the authority to bind the Restaurant to these Terms and that 
            you accept these Terms on behalf of the Restaurant.
          </p>
          <h3 className="text-base font-semibold">3.2 For Guests</h3>
          <p>
            By using the menu browsing, ordering, or AI assistant features, you accept these Terms as applicable 
            to your use of the Service.
          </p>
          <h3 className="text-base font-semibold">3.3 Agreement Logging</h3>
          <p>
            Your acceptance of these Terms is logged with a timestamp, your email address (if provided), 
            IP address, and the version of the Terms accepted. This record serves as evidence of your agreement 
            and may be used for compliance and dispute resolution purposes.
          </p>

          <h2 className="text-lg font-semibold">4. Account Registration and Security</h2>
          <ul>
            <li>Restaurant Clients must provide accurate and complete registration information.</li>
            <li>You are responsible for maintaining the confidentiality of account credentials, including Kitchen PINs.</li>
            <li>You must notify us immediately of any unauthorized access or security breach.</li>
            <li>We reserve the right to suspend accounts that violate these Terms or pose security risks.</li>
          </ul>

          <h2 className="text-lg font-semibold">5. Subscription and Payment Terms</h2>
          <h3 className="text-base font-semibold">5.1 Billing</h3>
          <ul>
            <li>Subscription fees are billed in advance on a monthly basis.</li>
            <li>All fees are non-refundable except as required by law or as expressly stated in these Terms.</li>
            <li>We reserve the right to change pricing with 30 days&apos; notice.</li>
          </ul>
          <h3 className="text-base font-semibold">5.2 Payment Processing</h3>
          <p>
            Payment processing is provided by Stripe, Inc. By using the Service, you also agree to Stripe&apos;s 
            <a href="https://stripe.com/legal" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"> Services Agreement</a>.
          </p>
          <h3 className="text-base font-semibold">5.3 Order Payments (Stripe Connect)</h3>
          <p>
            When ordering is enabled, customer payments for food orders are processed through Stripe Connect 
            and deposited directly to the Restaurant&apos;s connected Stripe account. TCC Solutions does not hold 
            customer funds.
          </p>

          <h2 className="text-lg font-semibold">6. AI Menu Assistant Disclaimer</h2>
          <p className="font-semibold">
            THE AI MENU ASSISTANT PROVIDES RESPONSES BASED ON MENU DATA AND MAY PRODUCE INACCURATE, INCOMPLETE, 
            OR MISLEADING INFORMATION.
          </p>
          <ul>
            <li>
              <strong>Allergy and Dietary Information:</strong> AI responses regarding allergens, ingredients, 
              or dietary restrictions should NOT be relied upon without verification from restaurant staff. 
              Guests with allergies or medical dietary requirements MUST confirm information directly with 
              the restaurant.
            </li>
            <li>
              <strong>Restaurant Responsibility:</strong> Restaurants are solely responsible for the accuracy 
              of menu content, including allergen tags, ingredient descriptions, and dietary labels.
            </li>
            <li>
              <strong>No Medical Advice:</strong> The AI assistant does not provide medical, nutritional, 
              or health advice.
            </li>
          </ul>

          <h2 className="text-lg font-semibold">7. User Responsibilities</h2>
          <h3 className="text-base font-semibold">7.1 Restaurant Clients</h3>
          <ul>
            <li>Maintain accurate and up-to-date menu information</li>
            <li>Comply with all applicable food safety, labeling, and consumer protection laws</li>
            <li>Respond to customer inquiries and handle disputes appropriately</li>
            <li>Keep Kitchen PINs secure and limit access to authorized staff</li>
            <li>Not use the Service for any illegal purpose</li>
          </ul>
          <h3 className="text-base font-semibold">7.2 Guests</h3>
          <ul>
            <li>Provide accurate payment and contact information when placing orders</li>
            <li>Not attempt to circumvent security measures or access restricted areas</li>
            <li>Not misuse the AI assistant or submit abusive/harmful queries</li>
          </ul>

          <h2 className="text-lg font-semibold">8. Intellectual Property</h2>
          <ul>
            <li>
              <strong>Our Property:</strong> The Service, including its software, design, features, and 
              documentation, is owned by TCC Solutions and protected by intellectual property laws.
            </li>
            <li>
              <strong>Your Content:</strong> Restaurants retain ownership of their menu content, branding, 
              and images. You grant us a license to use this content to provide the Service.
            </li>
            <li>
              <strong>Feedback:</strong> Any suggestions or feedback you provide may be used by us without 
              obligation or compensation.
            </li>
          </ul>

          <h2 className="text-lg font-semibold">9. Privacy and Data Protection</h2>
          <p>
            Our collection and use of personal information is described in our{' '}
            <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>. By using the 
            Service, you consent to our data practices as described therein.
          </p>
          <h3 className="text-base font-semibold">9.1 California Consumer Privacy Act (CCPA)</h3>
          <p>
            California residents have specific rights regarding their personal information under the CCPA. 
            See our Privacy Policy for details on how to exercise these rights.
          </p>

          <h2 className="text-lg font-semibold">10. Disclaimers and Limitation of Liability</h2>
          <h3 className="text-base font-semibold">10.1 Disclaimer of Warranties</h3>
          <p className="font-semibold">
            THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, WHETHER 
            EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE. WE DISCLAIM ALL WARRANTIES, INCLUDING IMPLIED 
            WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
          <h3 className="text-base font-semibold">10.2 Limitation of Liability</h3>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY CALIFORNIA LAW, IN NO EVENT SHALL TCC SOLUTIONS BE LIABLE 
            FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF 
            PROFITS, REVENUE, DATA, OR USE, ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICE, 
            REGARDLESS OF THE THEORY OF LIABILITY.
          </p>
          <p>
            OUR TOTAL LIABILITY SHALL NOT EXCEED THE GREATER OF: (A) THE AMOUNTS PAID BY YOU TO US IN 
            THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR (B) ONE HUNDRED DOLLARS ($100).
          </p>
          <h3 className="text-base font-semibold">10.3 Food Safety and Allergens</h3>
          <p>
            WE ARE NOT RESPONSIBLE FOR THE ACCURACY OF MENU INFORMATION, FOOD PREPARATION, FOOD SAFETY, 
            OR ALLERGEN MANAGEMENT. THESE ARE THE SOLE RESPONSIBILITY OF THE RESTAURANT.
          </p>

          <h2 className="text-lg font-semibold">11. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless TCC Solutions and its officers, directors, 
            employees, and agents from any claims, damages, losses, liabilities, costs, and expenses 
            (including attorneys&apos; fees) arising from:
          </p>
          <ul>
            <li>Your use of the Service</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any applicable law or regulation</li>
            <li>Claims related to menu content, food preparation, or customer harm (for Restaurants)</li>
          </ul>

          <h2 className="text-lg font-semibold">12. Termination</h2>
          <ul>
            <li>
              <strong>By Restaurant:</strong> You may cancel your subscription at any time. Access 
              continues until the end of the current billing period.
            </li>
            <li>
              <strong>By Us:</strong> We may suspend or terminate your access for violation of these 
              Terms, non-payment, or at our discretion with notice.
            </li>
            <li>
              <strong>Effect:</strong> Upon termination, your access to the Service ceases. We may 
              retain data as required by law or for legitimate business purposes.
            </li>
          </ul>

          <h2 className="text-lg font-semibold">13. Dispute Resolution</h2>
          <h3 className="text-base font-semibold">13.1 Governing Law</h3>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the State 
            of California, without regard to conflict of law principles.
          </p>
          <h3 className="text-base font-semibold">13.2 Jurisdiction</h3>
          <p>
            Any legal action arising from these Terms shall be brought exclusively in the state or 
            federal courts located in California, and you consent to the personal jurisdiction of 
            such courts.
          </p>
          <h3 className="text-base font-semibold">13.3 Informal Resolution</h3>
          <p>
            Before initiating any legal proceeding, you agree to contact us and attempt to resolve 
            the dispute informally for at least thirty (30) days.
          </p>

          <h2 className="text-lg font-semibold">14. Modifications to Terms</h2>
          <p>
            We may modify these Terms at any time by posting the revised Terms on our website. 
            Material changes will be communicated via email to Restaurant Clients. Your continued 
            use of the Service after such changes constitutes acceptance of the modified Terms.
          </p>

          <h2 className="text-lg font-semibold">15. General Provisions</h2>
          <ul>
            <li>
              <strong>Entire Agreement:</strong> These Terms, together with our Privacy Policy, 
              constitute the entire agreement between you and TCC Solutions.
            </li>
            <li>
              <strong>Severability:</strong> If any provision is found unenforceable, the remaining 
              provisions remain in effect.
            </li>
            <li>
              <strong>Waiver:</strong> Our failure to enforce any right or provision does not 
              constitute a waiver.
            </li>
            <li>
              <strong>Assignment:</strong> You may not assign these Terms without our consent. 
              We may assign these Terms in connection with a merger or acquisition.
            </li>
            <li>
              <strong>Force Majeure:</strong> We are not liable for delays or failures due to 
              circumstances beyond our reasonable control.
            </li>
          </ul>

          <h2 className="text-lg font-semibold">16. Contact Information</h2>
          <p>
            For questions about these Terms of Service, please contact us:
          </p>
          <ul>
            <li><strong>Email:</strong> legal@tccsolutions.com</li>
            <li><strong>Website:</strong> tccmenus.com</li>
          </ul>

          <hr className="my-6" />

          <p className="text-xs text-neutral-500">
            This agreement is effective as of the date you first access or use the Service, or 
            the date you accept these Terms (whichever is earlier). A record of your acceptance 
            is maintained in accordance with California law.
          </p>
        </div>

        <div className="mt-10 flex items-center gap-4">
          <a href="/" className="text-sm font-semibold text-neutral-950 underline underline-offset-4">
            Back to home
          </a>
          <a href="/privacy" className="text-sm font-semibold text-neutral-600 underline underline-offset-4">
            Privacy Policy
          </a>
        </div>
      </div>
    </main>
  )
}

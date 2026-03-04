/* eslint-disable @next/next/no-img-element */
export const metadata = {
  title: 'TCC Menus — Digital Menus for Restaurants',
  description:
    'Transform your restaurant with smart QR menus. Customers scan, browse, ask questions, and order — all from their phone. No app download required.',
}

const LANDING = {
  calendlyUrl: 'https://calendly.com/tccsolutions2025/30min',
  logo: '/assets/tcc-logo-horizontal.png',
  qrDemo: '/assets/tcc-demo-qr.png',
}

export default function Landing() {
  return (
    <main className="bg-white text-neutral-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-2 mb-8">
                <img src="/assets/tcc-club.png" alt="" className="h-8 w-8" loading="lazy" />
                <span className="text-lg font-semibold text-neutral-900">TCC Menus</span>
              </div>
              <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
                Your Menu,<br />
                <span className="text-emerald-600">Smarter</span>
              </h1>
              <p className="mt-6 text-lg text-neutral-600 leading-relaxed">
                <span className="font-semibold text-neutral-900">Level up your restaurant.</span> Increase ticket size. 
                Reduce decision time. Cut staff labor. Get real insights — all from one system powered by AI.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href={LANDING.calendlyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-emerald-700 transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Book a Free Demo
                </a>
                <a
                  href="/demo"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-neutral-900 px-8 py-4 text-lg font-semibold text-neutral-900 hover:bg-neutral-100 transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Try Live Demo
                </a>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl">
                <div className="text-center">
                  <p className="text-sm font-medium text-neutral-600 mb-4">Scan to see a live demo</p>
                  <div className="inline-block rounded-2xl border-4 border-emerald-100 p-4 bg-white">
                    <img
                      src={LANDING.qrDemo}
                      alt="Demo menu QR"
                      className="h-48 w-48 rounded-xl"
                      loading="lazy"
                    />
                  </div>
                  <p className="mt-4 text-sm text-neutral-500">tccmenus.com/demo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-y border-neutral-200 bg-neutral-50 py-6">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-neutral-600">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>No app download required</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Works on any phone</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Setup in one day</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Running a restaurant is hard enough
          </h2>
          <p className="mt-4 text-xl text-neutral-600 max-w-3xl mx-auto">
            You shouldn&apos;t have to worry about outdated paper menus, answering the same questions all day, 
            or managing a complicated tech system. TCC Menus handles it all.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <div className="text-3xl mb-4">😤</div>
            <h3 className="text-lg font-semibold text-red-900">The Old Way</h3>
            <ul className="mt-3 space-y-2 text-red-800">
              <li>• Print new menus every time prices change</li>
              <li>• Customers wait for a server to answer questions</li>
              <li>• Handwritten orders get lost or misread</li>
              <li>• No idea which items are actually popular</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-lg relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
              WITH TCC MENUS
            </div>
            <div className="text-3xl mb-4 mt-2">✨</div>
            <h3 className="text-lg font-semibold text-emerald-900">The Smart Way</h3>
            <ul className="mt-3 space-y-2 text-neutral-700">
              <li>• Update your menu instantly from any device</li>
              <li>• AI answers customer questions 24/7</li>
              <li>• Orders go straight to the kitchen</li>
              <li>• See exactly what&apos;s selling and what&apos;s not</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold text-emerald-900">The Results</h3>
            <ul className="mt-3 space-y-2 text-emerald-800">
              <li>• Faster table turnover</li>
              <li>• Fewer order mistakes</li>
              <li>• Happier customers</li>
              <li>• More time for what matters</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-neutral-900 text-white py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Everything You Need, Nothing You Don&apos;t
            </h2>
            <p className="mt-4 text-xl text-neutral-300 max-w-2xl mx-auto">
              One system that works together — from your customer&apos;s phone to your kitchen to your reports.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-neutral-700 bg-neutral-800 p-6">
              <div className="h-12 w-12 rounded-xl bg-emerald-600 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Beautiful QR Menu</h3>
              <p className="text-neutral-300">
                Customers scan a QR code and instantly see your full menu on their phone. 
                Beautiful photos, clear descriptions, dietary info — all easy to browse.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-neutral-700 bg-neutral-800 p-6">
              <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart AI Assistant</h3>
              <p className="text-neutral-300">
                &quot;Is the pasta gluten-free?&quot; &quot;What&apos;s good for kids?&quot; Your AI assistant 
                answers questions about YOUR menu — not generic internet answers.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-neutral-700 bg-neutral-800 p-6">
              <div className="h-12 w-12 rounded-xl bg-orange-600 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Ordering</h3>
              <p className="text-neutral-300">
                Customers can add items to their order and pay right from their phone. 
                For dine-in, they just enter their table number. For pickup, they get a code.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-neutral-700 bg-neutral-800 p-6">
              <div className="h-12 w-12 rounded-xl bg-purple-600 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Kitchen Display</h3>
              <p className="text-neutral-300">
                Orders appear on a screen in your kitchen the moment they&apos;re placed. 
                Your team moves them from &quot;New&quot; to &quot;Preparing&quot; to &quot;Ready&quot; with one tap.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-2xl border border-neutral-700 bg-neutral-800 p-6">
              <div className="h-12 w-12 rounded-xl bg-pink-600 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Menu Updates</h3>
              <p className="text-neutral-300">
                Change prices, add specials, mark items sold out — all from your phone or computer. 
                Changes show up instantly. No reprinting, no waiting.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-2xl border border-neutral-700 bg-neutral-800 p-6">
              <div className="h-12 w-12 rounded-xl bg-teal-600 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Simple Reports</h3>
              <p className="text-neutral-300">
                See what&apos;s selling, what&apos;s not, and when you&apos;re busiest. 
                No spreadsheets — just clear numbers that help you make better decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-xl text-neutral-600">
            Simple for your customers. Simple for your team.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-4">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-emerald-600">1</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Customer Scans</h3>
            <p className="text-neutral-600">
              They scan the QR code on their table with any smartphone camera. Your menu opens instantly.
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-emerald-600">2</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">They Browse &amp; Ask</h3>
            <p className="text-neutral-600">
              They explore your menu, see photos, check ingredients, and ask the AI any questions.
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-emerald-600">3</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">They Order &amp; Pay</h3>
            <p className="text-neutral-600">
              They add items, enter their table number (or pickup), and pay securely on their phone.
            </p>
          </div>

          <div className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-emerald-600">4</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Kitchen Gets It</h3>
            <p className="text-neutral-600">
              The order appears on your kitchen screen instantly. Your team prepares it and marks it ready.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-gradient-to-b from-neutral-50 to-white py-16 md:py-24" id="pricing">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Simple, Honest Pricing
            </h2>
            <p className="mt-4 text-xl text-neutral-600">
              Choose the plan that fits your restaurant. No hidden fees. Cancel anytime.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
              <div className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">Starter</div>
              <div className="mt-4">
                <span className="text-4xl font-bold">$299</span>
                <span className="text-neutral-600"> setup</span>
              </div>
              <div className="mt-1 text-neutral-600">
                + <span className="font-semibold">$49</span>/month
              </div>
              <p className="mt-4 text-neutral-600">
                Perfect for small cafes and food trucks just getting started with digital menus.
              </p>
              <ul className="mt-6 space-y-3">
                {['QR menu for up to 50 items', 'Basic branding (your logo + colors)', 'Email support', 'Self-service menu updates'].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <svg className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-neutral-700">{item}</span>
                  </li>
                ))}
              </ul>
              <a
                href={LANDING.calendlyUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-8 block w-full rounded-full border-2 border-neutral-900 py-3 text-center font-semibold text-neutral-900 hover:bg-neutral-100 transition-colors"
              >
                Get Started
              </a>
            </div>

            {/* Professional - Most Popular */}
            <div className="rounded-3xl border-2 border-emerald-600 bg-white p-8 shadow-xl relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wide">
                Most Popular
              </div>
              <div className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">Professional</div>
              <div className="mt-4">
                <span className="text-4xl font-bold">$499</span>
                <span className="text-neutral-600"> setup</span>
              </div>
              <div className="mt-1 text-neutral-600">
                + <span className="font-semibold">$99</span>/month
              </div>
              <p className="mt-4 text-neutral-600">
                The complete solution for restaurants ready to modernize their entire operation.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Unlimited menu items',
                  'Full branding customization',
                  'AI menu assistant',
                  'Online ordering + payments',
                  'Kitchen display system',
                  'Priority phone support',
                  'Analytics dashboard',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <svg className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-neutral-700">{item}</span>
                  </li>
                ))}
              </ul>
              <a
                href={LANDING.calendlyUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-8 block w-full rounded-full bg-emerald-600 py-3 text-center font-semibold text-white hover:bg-emerald-700 transition-colors"
              >
                Get Started
              </a>
            </div>

            {/* Enterprise */}
            <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
              <div className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">Enterprise</div>
              <div className="mt-4">
                <span className="text-4xl font-bold">$799</span>
                <span className="text-neutral-600"> setup</span>
              </div>
              <div className="mt-1 text-neutral-600">
                + <span className="font-semibold">$149</span>/month
              </div>
              <p className="mt-4 text-neutral-600">
                For multi-location restaurants and chains that need advanced features.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Everything in Professional',
                  'Multiple locations',
                  'POS integration (Clover, Square)',
                  'Dedicated account manager',
                  'Custom training session',
                  'White-label options',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <svg className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-neutral-700">{item}</span>
                  </li>
                ))}
              </ul>
              <a
                href={LANDING.calendlyUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-8 block w-full rounded-full border-2 border-neutral-900 py-3 text-center font-semibold text-neutral-900 hover:bg-neutral-100 transition-colors"
              >
                Get Started
              </a>
            </div>
          </div>

          <p className="mt-8 text-center text-neutral-500">
            All plans include free QR codes, secure payment processing, and a 30-day money-back guarantee.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mx-auto max-w-4xl px-4 py-16 md:py-24" id="faq">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Common Questions
          </h2>
        </div>

        <div className="space-y-4">
          {[
            {
              q: 'Do my customers need to download an app?',
              a: 'No! That\'s the beauty of it. Customers just scan the QR code with their regular phone camera and your menu opens right in their browser. Works on any iPhone or Android.',
            },
            {
              q: 'How long does setup take?',
              a: 'Most restaurants are up and running in one day. We handle importing your menu, setting up your branding, and creating your QR codes. You just need to put the QR codes on your tables.',
            },
            {
              q: 'Do I need to replace my current POS system?',
              a: 'No. TCC Menus works completely on its own. If you want to integrate with your POS later (we support Clover and Square), that\'s optional.',
            },
            {
              q: 'What if I need to change my menu?',
              a: 'You can update your menu anytime from your phone or computer. Change prices, add items, mark things as sold out — changes appear instantly. No more reprinting.',
            },
            {
              q: 'How does the AI assistant work?',
              a: 'The AI is trained on YOUR menu — not random internet data. When a customer asks "Is the Caesar salad vegetarian?" it looks at your actual ingredients and gives an accurate answer.',
            },
            {
              q: 'Is online ordering required?',
              a: 'No. You can use TCC Menus as a view-only digital menu if you prefer. Online ordering is an optional feature you can turn on whenever you\'re ready.',
            },
            {
              q: 'What about payment processing fees?',
              a: 'Payments go through Stripe at their standard rates (about 2.9% + 30¢). The money goes directly to your bank account. We don\'t take any cut of your sales.',
            },
            {
              q: 'Can I cancel anytime?',
              a: 'Yes. No long-term contracts. You can cancel your subscription anytime and your menu will simply go offline at the end of the billing period.',
            },
          ].map((faq) => (
            <details key={faq.q} className="group rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <summary className="cursor-pointer list-none flex items-center justify-between font-semibold text-lg">
                {faq.q}
                <svg className="h-5 w-5 text-neutral-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="mt-4 text-neutral-600">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-emerald-600 text-white py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Ready to modernize your menu?
          </h2>
          <p className="mt-4 text-xl text-emerald-100 max-w-2xl mx-auto">
            Join restaurants that are saving time, reducing mistakes, and making customers happier. 
            Setup takes just one day.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href={LANDING.calendlyUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors"
            >
              Book Your Free Demo
            </a>
            <a
              href="/demo"
              className="inline-flex items-center gap-2 rounded-full border-2 border-white px-8 py-4 text-lg font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              Try It Yourself
            </a>
          </div>
          <p className="mt-6 text-emerald-200">
            No credit card required for demo • 30-day money-back guarantee
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-300">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <img src={LANDING.logo} alt="TCC Menus" className="h-8 brightness-0 invert" loading="lazy" />
              <p className="mt-4 text-neutral-400 max-w-md">
                Smart digital menus for modern restaurants. Customers scan, browse, and order — 
                all from one QR code. No app required.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="/demo" className="hover:text-white transition-colors">Live Demo</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href={LANDING.calendlyUrl} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-neutral-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-neutral-500">© {new Date().getFullYear()} TCC Solutions. All rights reserved.</p>
            <p className="text-neutral-500 text-sm">Secure payments powered by Stripe</p>
          </div>
        </div>
      </footer>
    </main>
  )
}

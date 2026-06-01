/* eslint-disable @next/next/no-img-element */
export const metadata = {
  title: 'PlateHaven — Order Growth & Retention',
  description:
    'PlateHaven helps restaurants, caterers, and food trucks capture more direct orders, increase average ticket size, and bring customers back with a branded ordering flow built around your business.',
}

const LANDING = {
  calendlyUrl: 'https://calendly.com/tccsolutions2025/30min',
  demoUrl: '/demo',
}

const FEATURES = [
  { title: 'Branded digital menu', desc: 'Your menu becomes a mobile-first sales page, not a static PDF.' },
  { title: 'Direct ordering flow', desc: 'Customers order from your link or QR code without getting pushed into third-party platforms.' },
  { title: 'Catering request capture', desc: 'Event date, guest count, dietary notes, serving sizes, and itemized pricing collected upfront.' },
  { title: 'Smart upsell structure', desc: 'Add-ons, modifiers, bundles, and upgrades placed directly inside the ordering flow.' },
  { title: 'Customer ownership', desc: 'Build the foundation for repeat orders, follow-ups, loyalty, and direct customer communication.' },
  { title: 'Admin dashboard', desc: 'Update items, pricing, categories, and settings without needing a developer.' },
  { title: 'Kitchen display', desc: 'Route incoming orders clearly for back-of-house execution.' },
  { title: 'Optional AI assistance', desc: 'Help customers understand the menu, make choices, and ask questions without calling the staff.' },
]

export default function Landing() {
  return (
    <main className="bg-[#0a0a0a] text-white min-h-screen antialiased">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img 
              src="/assets/platehaven-logo-transparent.png" 
              alt="PlateHaven" 
              className="h-10 w-auto object-contain"
            />
          </a>
          <div className="flex items-center gap-4 md:gap-8">
            <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wider text-[#C9A227] border border-[#C9A227]/40 rounded px-2 py-1">
              Pilot
            </span>
            <a href="#how-it-works" className="hidden md:inline text-sm text-white/50 hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#demo" className="hidden md:inline text-sm text-white/50 hover:text-white transition-colors">
              Demo
            </a>
            <a
              href={LANDING.demoUrl}
              className="bg-[#C9A227] text-[#0a0a0a] px-5 py-2.5 text-sm font-semibold hover:bg-[#d4af37] transition-colors rounded"
            >
              See the Demo
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-20 md:pt-44 md:pb-28 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.1] tracking-tight mb-6">
            Turn your menu into an<br />
            <span className="text-[#C9A227]">order growth system</span>
          </h1>
          <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-6 leading-relaxed">
            PlateHaven helps restaurants, caterers, and food trucks capture more direct orders, increase average ticket size, and bring customers back with a branded ordering flow built around your business.
          </p>
          <p className="text-sm text-white/40 max-w-xl mx-auto mb-8 leading-relaxed">
            Your menu should not just display food. It should sell it, capture the customer, and bring them back.
          </p>
          <p className="text-sm font-medium text-[#C9A227]/90 mb-6">
            Now onboarding pilot restaurants
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/50 mb-10">
            <span>Customers browse faster.</span>
            <span>Orders come in cleaner.</span>
            <span>Upsells become obvious.</span>
            <span>You keep the relationship.</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={LANDING.demoUrl}
              className="w-full sm:w-auto bg-[#C9A227] text-[#0a0a0a] px-8 py-4 text-base font-semibold hover:bg-[#d4af37] transition-colors rounded"
            >
              See the Demo
            </a>
            <a
              href={LANDING.calendlyUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto border border-white/15 px-8 py-4 text-base font-medium text-white/80 hover:text-white hover:border-white/30 transition-colors rounded"
            >
              Get Setup
            </a>
          </div>
        </div>
      </section>

      {/* Positioning strip */}
      <section className="pb-8 px-6">
        <p className="mx-auto max-w-2xl text-center text-sm text-white/40">
          Not a POS. Not DoorDash. Not another app fighting for your customers.
        </p>
      </section>

      {/* Problem */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl md:text-3xl font-semibold mb-3">
            Most restaurants do not have an ordering problem
          </h2>
          <p className="text-xl md:text-2xl text-white/70 font-medium mb-6">
            They have a revenue leak
          </p>
          <p className="text-white/50 leading-relaxed mb-6 max-w-2xl mx-auto">
            Customers get confused. Lines slow down. Catering requests turn into back-and-forth messages.
            Upsells get missed. Repeat customers are not captured. Third-party platforms keep owning the relationship.
          </p>
          <p className="text-white/70 font-medium mb-10">
            PlateHaven fixes the flow before the money leaks out.
          </p>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-5">
              <div className="text-white/30 text-sm font-medium mb-2">Direct Orders</div>
              <p className="text-white/60 text-sm">Stop sending your best customers into apps, DMs, phone calls, and scattered ordering paths. Give them one clean branded link to order directly.</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-5">
              <div className="text-white/30 text-sm font-medium mb-2">Higher Ticket Size</div>
              <p className="text-white/60 text-sm">Make add-ons, upgrades, modifiers, catering quantities, and package options easier to choose before the order is submitted.</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-5">
              <div className="text-white/30 text-sm font-medium mb-2">Customer Retention</div>
              <p className="text-white/60 text-sm">Capture the customer relationship so you can drive repeat orders instead of starting from zero every time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution */}
      <section id="how-it-works" className="py-20 px-6 bg-[#0d0d0d]">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-semibold mb-4">
              One system built to grow the order
            </h2>
            <p className="text-white/50 max-w-xl mx-auto mb-4">
              PlateHaven gives your customers a clean ordering experience while giving your business a stronger direct-order channel.
            </p>
            <p className="text-white/70 text-sm max-w-lg mx-auto">
              Less friction. More control. More chances to increase the order before it is placed.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-[#111] border border-white/5 rounded-xl p-8">
              <div className="text-[#C9A227] text-xs font-semibold uppercase tracking-wider mb-5">
                What your customer sees
              </div>
              <ul className="space-y-4 text-white/70 text-[15px]">
                <li className="flex items-start gap-3">
                  <span className="text-[#C9A227] mt-0.5">-</span>
                  <span>They browse your menu</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C9A227] mt-0.5">-</span>
                  <span>They build the order</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C9A227] mt-0.5">-</span>
                  <span>They see add-ons and options</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C9A227] mt-0.5">-</span>
                  <span>They submit clean details</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#111] border border-white/5 rounded-xl p-8">
              <div className="text-[#C9A227] text-xs font-semibold uppercase tracking-wider mb-5">
                What you receive
              </div>
              <ul className="space-y-4 text-white/70 text-[15px]">
                <li className="flex items-start gap-3">
                  <span className="text-[#C9A227] mt-0.5">-</span>
                  <span>The order ready to confirm, prepare, and fulfill</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C9A227] mt-0.5">-</span>
                  <span>Complete order details, not scattered messages</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C9A227] mt-0.5">-</span>
                  <span>Guest count, event date, location, dietary needs</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C9A227] mt-0.5">-</span>
                  <span>Itemized order with pricing already calculated</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20 px-6 border-t border-white/5">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold mb-4">
              See direct-order growth in action
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              Try the flow yourself. See how customers browse, add extras, and submit — and what your business receives on the other end.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <a 
              href="/demo?mode=catering"
              className="group bg-[#111] border border-white/5 hover:border-[#C9A227]/30 rounded-xl p-8 transition-all"
            >
              <div className="text-white/30 text-sm font-medium mb-3">Catering Demo</div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-[#C9A227] transition-colors">
                Capture bigger events upfront
              </h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Event details, quantities, packages, and dietary requirements collected before the back-and-forth starts — so you quote and fulfill with a higher ticket in mind.
              </p>
            </a>

            <a 
              href="/demo?mode=quickpickup"
              className="group bg-[#111] border border-white/5 hover:border-[#C9A227]/30 rounded-xl p-8 transition-all"
            >
              <div className="text-white/30 text-sm font-medium mb-3">Quick Pickup Demo</div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-[#C9A227] transition-colors">
                Less counter friction, more direct orders
              </h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Customers order from your branded link on their phone — fewer bottlenecks at the counter and more orders completed on your channel.
              </p>
            </a>
          </div>

          <div className="text-center mt-10">
            <a
              href={LANDING.demoUrl}
              className="inline-block bg-[#C9A227] text-[#0a0a0a] px-8 py-4 text-base font-semibold hover:bg-[#d4af37] transition-colors rounded"
            >
              See the Demo
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-[#0d0d0d]">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold mb-4">
              Built to grow your orders
            </h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/5 rounded-lg p-5">
                <h3 className="font-medium mb-2">{feature.title}</h3>
                <p className="text-sm text-white/50">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">
            Ready to turn your menu into a growth system?
          </h2>
          <p className="text-white/50 mb-8 max-w-lg mx-auto leading-relaxed">
            Join the pilot — we set up your branded ordering flow, load your menu, and structure your add-ons at no cost while we onboard the first restaurants.
            You use it with real customers and share feedback. If it helps, you keep it. Pricing comes later if you want to stay on.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={LANDING.demoUrl}
              className="w-full sm:w-auto bg-[#C9A227] text-[#0a0a0a] px-8 py-4 text-base font-semibold hover:bg-[#d4af37] transition-colors rounded"
            >
              See the Demo
            </a>
            <a
              href={LANDING.calendlyUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto border border-white/15 px-8 py-4 text-base font-medium text-white/80 hover:text-white hover:border-white/30 transition-colors rounded"
            >
              Join the Pilot
            </a>
          </div>
          <p className="mt-6 text-sm text-white/30 max-w-md mx-auto leading-relaxed">
            Pilot program — free while we onboard the first restaurants. We set it up; you use it with real customers and share feedback. Pricing comes later if you want to keep it.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img 
              src="/assets/platehaven-logo-transparent.png" 
              alt="PlateHaven" 
              className="h-8 w-auto object-contain"
            />
          </div>
          <div className="flex items-center gap-8 text-sm text-white/40">
            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
            <a href={LANDING.calendlyUrl} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
        <div className="mx-auto max-w-5xl mt-8 pt-8 border-t border-white/5 text-center text-sm text-white/30">
          {new Date().getFullYear()} PlateHaven. All rights reserved.
        </div>
      </footer>
    </main>
  )
}

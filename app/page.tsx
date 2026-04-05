/* eslint-disable @next/next/no-img-element */
export const metadata = {
  title: 'PlateHaven — Online Ordering, Redefined',
  description:
    'A digital ordering system for catering businesses, food trucks, and modern food operations. Clean menus. Structured orders. Less back-and-forth.',
}

const LANDING = {
  calendlyUrl: 'https://calendly.com/tccsolutions2025/30min',
  demoUrl: '/demo',
}

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
          <div className="flex items-center gap-8">
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
              Try the Demo
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-20 md:pt-44 md:pb-28 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.1] tracking-tight mb-6">
            Digital ordering for<br />
            <span className="text-[#C9A227]">modern food businesses</span>
          </h1>
          <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            A cleaner way to handle catering requests, food truck orders, and digital menus. 
            Your customers build their order. You receive it complete.
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
              Talk to Us
            </a>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl md:text-3xl font-semibold mb-6">
            Ordering is messier than it should be
          </h2>
          <p className="text-white/50 leading-relaxed mb-10 max-w-2xl mx-auto">
            Catering requests scattered across texts and calls. Food truck lines slowing down at the counter. 
            Menus that are hard to update. Customers asking the same questions over and over.
          </p>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-5">
              <div className="text-white/30 text-sm font-medium mb-2">Catering</div>
              <p className="text-white/60 text-sm">Every order becomes a 10-message conversation before you even have the details.</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-5">
              <div className="text-white/30 text-sm font-medium mb-2">Food Trucks</div>
              <p className="text-white/60 text-sm">Rush periods bottleneck at the counter. Customers leave instead of waiting.</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-5">
              <div className="text-white/30 text-sm font-medium mb-2">Menus</div>
              <p className="text-white/60 text-sm">Static menus that are hard to change. No clear way for customers to order.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution */}
      <section id="how-it-works" className="py-20 px-6 bg-[#0d0d0d]">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-semibold mb-4">
              One system that handles it
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              PlateHaven gives your customers a clean way to browse, build, and send their order. 
              You receive everything structured and ready.
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
                  <span>Your menu, browsable on any device</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C9A227] mt-0.5">-</span>
                  <span>Clear pricing and item details</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C9A227] mt-0.5">-</span>
                  <span>A structured way to build and submit their order</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#C9A227] mt-0.5">-</span>
                  <span>Event details, dietary notes, everything in one form</span>
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
                <li className="flex items-start gap-3">
                  <span className="text-[#C9A227] mt-0.5">-</span>
                  <span>Ready to confirm, no back-and-forth required</span>
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
              See how it works
            </h2>
            <p className="text-white/50 max-w-xl mx-auto">
              Try the ordering flow yourself. See what your customers see, 
              and what you receive on the other end.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <a 
              href="/demo?mode=catering"
              className="group bg-[#111] border border-white/5 hover:border-[#C9A227]/30 rounded-xl p-8 transition-all"
            >
              <div className="text-white/30 text-sm font-medium mb-3">Catering Demo</div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-[#C9A227] transition-colors">
                Full event ordering
              </h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Serving sizes, event details, dietary requirements. 
                The complete catering request flow.
              </p>
            </a>

            <a 
              href="/demo?mode=foodtruck"
              className="group bg-[#111] border border-white/5 hover:border-[#C9A227]/30 rounded-xl p-8 transition-all"
            >
              <div className="text-white/30 text-sm font-medium mb-3">Food Truck Demo</div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-[#C9A227] transition-colors">
                Quick pickup ordering
              </h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Fast mobile ordering for rush periods. 
                Customers order from their phone while in line.
              </p>
            </a>
          </div>

          <div className="text-center mt-10">
            <a
              href={LANDING.demoUrl}
              className="inline-block bg-[#C9A227] text-[#0a0a0a] px-8 py-4 text-base font-semibold hover:bg-[#d4af37] transition-colors rounded"
            >
              Try the Demo
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-[#0d0d0d]">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold mb-4">
              Built for real operations
            </h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Digital menus', desc: 'Clean, mobile-first design. Update items and prices in minutes.' },
              { title: 'Structured ordering', desc: 'Customers send complete requests instead of scattered messages.' },
              { title: 'Catering workflow', desc: 'Event details, serving sizes, dietary notes — all captured upfront.' },
              { title: 'Admin dashboard', desc: 'Manage your menu, orders, and settings from one place.' },
              { title: 'Kitchen display', desc: 'Optional order screens for back-of-house workflow.' },
              { title: 'AI assistance', desc: 'Optional AI to help customers with menu questions.' },
            ].map((feature, i) => (
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
            Ready to clean up your ordering?
          </h2>
          <p className="text-white/50 mb-8 max-w-lg mx-auto">
            We set up your menu and ordering flow. You try it with real customers. 
            If it works, you keep it. Simple.
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
              Schedule Setup
            </a>
          </div>
          <p className="mt-6 text-sm text-white/30">Free setup. $50/month if you keep it.</p>
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

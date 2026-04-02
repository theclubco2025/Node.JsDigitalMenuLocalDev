/* eslint-disable @next/next/no-img-element */
export const metadata = {
  title: 'TCC Menus — Digital Ordering for Modern Food Businesses',
  description:
    'One system for catering orders, food trucks, and modern menus. Turn messy back-and-forth into a clean digital flow.',
}

const LANDING = {
  calendlyUrl: 'https://calendly.com/tccsolutions2025/30min',
  demoUrl: '/demo',
}

export default function Landing() {
  return (
    <main className="bg-[#111] text-white min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#111]/95 backdrop-blur-md border-b border-white/5">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/assets/platehaven-logo.png" alt="TCC Menus" className="h-10 w-auto object-contain" />
            <span className="text-xl font-semibold tracking-tight text-[#C4A76A]">
              TCC Menus
            </span>
          </a>
          <div className="flex items-center gap-6">
            <a href="#use-cases" className="hidden md:inline text-sm text-white/60 hover:text-white transition-colors">
              Use Cases
            </a>
            <a href="#features" className="hidden md:inline text-sm text-white/60 hover:text-white transition-colors">
              Features
            </a>
            <a
              href={LANDING.demoUrl}
              className="bg-[#C4A76A] text-[#111] px-5 py-2 text-sm font-semibold hover:bg-[#d4b87a] transition-colors rounded"
            >
              See Demo
            </a>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="pt-32 pb-12 md:pt-40 md:pb-16 px-6">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">
            One system for catering orders,<br />
            food trucks, and modern menus
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            Turn messy back-and-forth, menu confusion, and slow ordering<br className="hidden md:block" />
            into a clean digital flow your customers can actually use.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={LANDING.demoUrl}
              className="w-full sm:w-auto bg-[#C4A76A] text-[#111] px-8 py-4 text-lg font-semibold hover:bg-[#d4b87a] transition-colors rounded"
            >
              See Demo
            </a>
            <a
              href={LANDING.calendlyUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto border border-white/20 px-8 py-4 text-lg font-medium text-white hover:bg-white/5 transition-colors rounded"
            >
              Book Setup
            </a>
          </div>
        </div>
      </section>

      {/* ===== BUILT FOR ROW ===== */}
      <section className="pb-16 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
            {['Catering', 'Food Trucks', 'Pop-Ups', 'Pickup', 'QR Menus', 'Fast Casual'].map((item) => (
              <span
                key={item}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-white/70"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PROBLEM SECTION ===== */}
      <section className="py-20 px-6 bg-[#0a0a0a]">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Where food businesses lose time first</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-white/5">
              <div className="text-2xl mb-3">📱</div>
              <h3 className="font-semibold mb-2">Catering chaos</h3>
              <p className="text-sm text-white/60">Orders scattered across texts, calls, and emails. Every request turns into 10 messages.</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-white/5">
              <div className="text-2xl mb-3">🚚</div>
              <h3 className="font-semibold mb-2">Rush hour pressure</h3>
              <p className="text-sm text-white/60">Food trucks losing customers to long lines. Staff bottlenecked at the counter.</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-white/5">
              <div className="text-2xl mb-3">📋</div>
              <h3 className="font-semibold mb-2">Menu confusion</h3>
              <p className="text-sm text-white/60">Hard-to-update menus, unclear pricing, customers asking the same questions.</p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-lg text-white/60">
              The problem is <span className="text-white font-medium">disorder</span> — and it costs you time, orders, and sanity.
            </p>
          </div>
        </div>
      </section>

      {/* ===== SOLUTION SECTION ===== */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">A cleaner way to take orders and present your menu</h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              TCC Menus gives you a digital system that handles the chaos so you can focus on the food.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* What customers see */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-white/5">
              <div className="text-xs text-[#C4A76A] font-semibold uppercase tracking-wider mb-4">What customers get</div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-[#C4A76A]">✓</span>
                  <span className="text-white/80">Clean menu they can browse on any device</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#C4A76A]">✓</span>
                  <span className="text-white/80">Real pricing — no &quot;call for quote&quot;</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#C4A76A]">✓</span>
                  <span className="text-white/80">Structured way to send their full order</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#C4A76A]">✓</span>
                  <span className="text-white/80">Optional AI to help with questions</span>
                </div>
              </div>
            </div>

            {/* What you get */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-white/5">
              <div className="text-xs text-[#C4A76A] font-semibold uppercase tracking-wider mb-4">What you get</div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-[#C4A76A]">✓</span>
                  <span className="text-white/80">Complete orders instead of scattered messages</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#C4A76A]">✓</span>
                  <span className="text-white/80">Menu you can update in minutes</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#C4A76A]">✓</span>
                  <span className="text-white/80">Less time repeating yourself</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#C4A76A]">✓</span>
                  <span className="text-white/80">Optional kitchen workflow tools</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center mt-10 text-white/50 text-sm">
            The system is modular. Start with what you need, add more later.
          </p>
        </div>
      </section>

      {/* ===== USE CASES SECTION ===== */}
      <section id="use-cases" className="py-20 px-6 bg-[#0a0a0a]">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for how you actually work</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Catering Card */}
            <div className="bg-[#1a1a1a] rounded-xl p-8 border border-white/5">
              <div className="text-3xl mb-4">🍱</div>
              <h3 className="text-xl font-bold mb-3">For Catering</h3>
              <ul className="space-y-3 text-sm text-white/70 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-[#C4A76A]">•</span>
                  Structured requests with all event details upfront
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C4A76A]">•</span>
                  Instant pricing customers can see while ordering
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C4A76A]">•</span>
                  No more 10-message quote conversations
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C4A76A]">•</span>
                  Professional ordering experience for your brand
                </li>
              </ul>
              <a
                href="/demo?mode=catering"
                className="inline-block text-[#C4A76A] font-medium hover:underline"
              >
                Try catering demo →
              </a>
            </div>

            {/* Food Truck Card */}
            <div className="bg-[#1a1a1a] rounded-xl p-8 border border-white/5">
              <div className="text-3xl mb-4">🚚</div>
              <h3 className="text-xl font-bold mb-3">For Food Trucks</h3>
              <ul className="space-y-3 text-sm text-white/70 mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-[#C4A76A]">•</span>
                  Customers order from their phone while in line
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C4A76A]">•</span>
                  Faster throughput during rush periods
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C4A76A]">•</span>
                  No counter bottleneck slowing everything down
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C4A76A]">•</span>
                  Serve more customers per hour
                </li>
              </ul>
              <a
                href="/demo?mode=foodtruck"
                className="inline-block text-[#C4A76A] font-medium hover:underline"
              >
                Try food truck demo →
              </a>
            </div>
          </div>

          <p className="text-center mt-10 text-white/50 text-sm">
            Also works for pop-ups, fast casual, pickup-focused restaurants, and other modern food operations.
          </p>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" className="py-20 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What the system includes</h2>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '📱', title: 'Clean digital menus', desc: 'Mobile-first design that looks professional on any device.' },
              { icon: '📋', title: 'Structured order flow', desc: 'Customers send complete requests, not scattered messages.' },
              { icon: '✏️', title: 'Easy menu updates', desc: 'Change items, prices, or availability in minutes.' },
              { icon: '🤖', title: 'Optional AI assistance', desc: 'Answer customer questions without extra staff time.' },
              { icon: '🍳', title: 'Optional kitchen workflow', desc: 'Order display screens when you need them.' },
              { icon: '⚙️', title: 'Admin control', desc: 'Manage everything from a simple dashboard.' },
            ].map((feature, i) => (
              <div key={i} className="bg-[#1a1a1a] rounded-xl p-5 border border-white/5">
                <div className="text-2xl mb-3">{feature.icon}</div>
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-white/60">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-20 px-6 bg-[#0a0a0a]">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Start with what saves you the most time</h2>
          <p className="text-lg text-white/60 mb-4 max-w-xl mx-auto">
            Whether that&apos;s catering orders, truck rushes, or a cleaner digital menu —<br className="hidden md:block" />
            TCC Menus gives you a system you can build on.
          </p>
          <p className="text-lg text-white/60 mb-10 max-w-xl mx-auto">
            Free setup. You only pay if it works for you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={LANDING.demoUrl}
              className="w-full sm:w-auto bg-[#C4A76A] text-[#111] px-8 py-4 text-lg font-semibold hover:bg-[#d4b87a] transition-colors rounded"
            >
              See Demo
            </a>
            <a
              href={LANDING.calendlyUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto border border-white/20 px-8 py-4 text-lg font-medium text-white hover:bg-white/5 transition-colors rounded"
            >
              Talk About Setup
            </a>
          </div>
          <p className="mt-6 text-sm text-white/40">$50/month after free trial. Cancel anytime.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <img src="/assets/platehaven-logo.png" alt="TCC Menus" className="h-8 w-auto object-contain" />
            <span className="font-semibold text-[#C4A76A]">TCC Menus</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/50">
            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
            <a href={LANDING.calendlyUrl} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
        <div className="mx-auto max-w-5xl mt-8 pt-8 border-t border-white/10 text-center text-sm text-white/40">
          © {new Date().getFullYear()} TCC Menus. All rights reserved.
        </div>
      </footer>
    </main>
  )
}

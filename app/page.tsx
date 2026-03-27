/* eslint-disable @next/next/no-img-element */
export const metadata = {
  title: 'PlateHaven — Turn Catering Requests Into Clean Orders',
  description:
    'Customers pick their items, see pricing, and send you everything at once. No more texting, calling, or guessing.',
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
            <img src="/assets/platehaven-logo.png" alt="PlateHaven" className="h-10 w-auto object-contain" />
            <span className="text-xl font-semibold tracking-tight text-[#C4A76A]">
              PlateHaven
            </span>
          </a>
          <div className="flex items-center gap-6">
            <a href="#how-it-works" className="hidden md:inline text-sm text-white/60 hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#food-trucks" className="hidden md:inline text-sm text-white/60 hover:text-white transition-colors">
              Food Trucks
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

      {/* ===== HERO (THE MONEY SECTION) ===== */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <p className="text-[#C4A76A] text-xs font-semibold tracking-widest uppercase mb-6">
              Built for caterers & food trucks handling custom orders
            </p>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">
              Turn Catering Requests Into Clean Orders<br />
              <span className="text-[#C4A76A]">— Without the Back-and-Forth</span>
            </h1>
            <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
              Customers pick their items, see pricing, and send you everything at once.<br className="hidden md:block" />
              You stop texting, calling, and guessing.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={LANDING.demoUrl}
                className="w-full sm:w-auto bg-[#C4A76A] text-[#111] px-8 py-4 text-lg font-semibold hover:bg-[#d4b87a] transition-colors rounded"
              >
                👉 See How It Works (2 min)
              </a>
              <a
                href={LANDING.calendlyUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto border border-white/20 px-8 py-4 text-lg font-medium text-white hover:bg-white/5 transition-colors rounded"
              >
                Get Set Up For Free
              </a>
            </div>
          </div>

          {/* Visual: The Shift */}
          <div className="mt-16 grid md:grid-cols-2 gap-6 items-center">
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-white/5">
              <div className="text-xs text-white/40 uppercase tracking-wider mb-4">Customer sends this:</div>
              <div className="bg-[#0f0f0f] rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-[#C4A76A]">✓</span>
                  <span className="text-white/80">BBQ Pulled Pork Tray × 2</span>
                  <span className="text-white/40 ml-auto">$178</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-[#C4A76A]">✓</span>
                  <span className="text-white/80">Grilled Chicken Tray × 1</span>
                  <span className="text-white/40 ml-auto">$79</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-[#C4A76A]">✓</span>
                  <span className="text-white/80">Garden Salad Tray × 1</span>
                  <span className="text-white/40 ml-auto">$45</span>
                </div>
                <div className="border-t border-white/10 my-3 pt-3">
                  <div className="text-xs text-white/40 mb-2">Event Details:</div>
                  <div className="text-sm text-white/70">March 15 • 50 guests • 123 Main St</div>
                  <div className="text-sm text-white/70">3 vegetarian, 2 gluten-free</div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <span className="font-semibold">Total Estimate</span>
                  <span className="text-[#C4A76A] font-semibold">$302</span>
                </div>
              </div>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-white/5">
              <div className="text-xs text-white/40 uppercase tracking-wider mb-4">You receive this:</div>
              <div className="bg-[#0f0f0f] rounded-lg p-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-[#C4A76A]/20 flex items-center justify-center text-[#C4A76A] text-lg">📋</div>
                  <div>
                    <div className="font-semibold text-white">New Catering Request</div>
                    <div className="text-sm text-white/50">Sarah Johnson • Just now</div>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-[#C4A76A]">📅</span>
                    <span className="text-white/70">March 15, 2026 at 12:00 PM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#C4A76A]">👥</span>
                    <span className="text-white/70">50 guests</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#C4A76A]">📍</span>
                    <span className="text-white/70">123 Main St, Suite 400</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#C4A76A]">🥗</span>
                    <span className="text-white/70">3 vegetarian, 2 gluten-free</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 text-center">
                  <span className="text-[#C4A76A] font-semibold">Ready to confirm — no back-and-forth needed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 2: THE REAL PAIN ===== */}
      <section className="py-20 px-6 bg-[#0a0a0a]">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Catering Orders Shouldn&apos;t Take 10 Messages</h2>
          </div>
          
          <div className="bg-[#1a1a1a] rounded-xl p-6 md:p-8 max-w-xl mx-auto mb-10">
            <div className="space-y-3">
              {[
                '"What\'s the price for 40 people?"',
                '"Can we swap items?"',
                '"What do you recommend?"',
                '"Can you send a quote?"',
                '"Did you get my last message?"',
              ].map((msg, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 text-xs shrink-0">💬</div>
                  <div className="bg-white/5 rounded-xl px-4 py-2 text-white/70 text-sm">{msg}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <p className="text-xl md:text-2xl text-white/60 mb-2">
              Every order turns into a conversation.
            </p>
            <p className="text-xl md:text-2xl font-semibold text-[#C4A76A]">
              That&apos;s time you don&apos;t have.
            </p>
          </div>
        </div>
      </section>

      {/* ===== SECTION 3: THE SHIFT (where you sell) ===== */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Now Customers Just Send You This</h2>
          </div>
          
          <div className="bg-[#1a1a1a] rounded-xl p-6 md:p-10 max-w-3xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <div className="text-sm text-[#C4A76A] font-semibold mb-4">ITEMS SELECTED</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-white/80">
                    <span>BBQ Pulled Pork Tray × 2</span>
                    <span>$178</span>
                  </div>
                  <div className="flex justify-between text-white/80">
                    <span>Grilled Chicken Tray × 1</span>
                    <span>$79</span>
                  </div>
                  <div className="flex justify-between text-white/80">
                    <span>Garden Salad Tray × 1</span>
                    <span>$45</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex justify-between font-semibold">
                    <span>Total Estimate</span>
                    <span className="text-[#C4A76A]">$302</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm text-[#C4A76A] font-semibold mb-4">EVENT DETAILS</div>
                <div className="space-y-2 text-sm text-white/70">
                  <div>📅 March 15, 2026</div>
                  <div>⏰ 12:00 PM</div>
                  <div>👥 50 guests</div>
                  <div>📍 123 Main St, Suite 400</div>
                  <div>🥗 3 vegetarian, 2 gluten-free</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-10">
            <p className="text-xl md:text-2xl font-semibold">
              No guessing. No back-and-forth. <span className="text-[#C4A76A]">Just a complete order.</span>
            </p>
          </div>
        </div>
      </section>

      {/* ===== SECTION 4: HOW IT WORKS (simple) ===== */}
      <section id="how-it-works" className="py-20 px-6 bg-[#0a0a0a]">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: '1', title: 'Customer builds their order', desc: 'They browse your menu, select items, see serving sizes and pricing.' },
              { num: '2', title: 'They enter event details', desc: 'Date, time, guest count, location, dietary needs — all in one form.' },
              { num: '3', title: 'You receive everything ready to go', desc: 'Complete order. Complete details. Ready to confirm.' },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#C4A76A] text-[#111] text-xl font-bold mb-4">
                  {step.num}
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-white/60 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center mt-12 text-white/40">That&apos;s it. No fluff.</p>
        </div>
      </section>

      {/* ===== SECTION 5: FOOD TRUCKS ===== */}
      <section id="food-trucks" className="py-20 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Also Helps Food Trucks During Rush</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-white/5">
              <div className="text-xs text-white/40 uppercase tracking-wider mb-4">Mobile Ordering Screen</div>
              <div className="bg-[#0f0f0f] rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/80">Street Tacos × 3</span>
                  <span className="text-white/40">$12</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/80">Loaded Nachos × 1</span>
                  <span className="text-white/40">$9</span>
                </div>
                <div className="border-t border-white/10 pt-3">
                  <div className="text-sm text-white/70 mb-2">Pickup Name: <span className="text-white">Mike</span></div>
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-[#C4A76A]">$21</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-[#C4A76A] text-xl">📱</span>
                <div>
                  <div className="font-semibold">Customers order while waiting</div>
                  <div className="text-sm text-white/60">They scan QR, order from their phone</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#C4A76A] text-xl">⚡</span>
                <div>
                  <div className="font-semibold">Lines move faster</div>
                  <div className="text-sm text-white/60">No bottleneck at the counter</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#C4A76A] text-xl">💰</span>
                <div>
                  <div className="font-semibold">You serve more people per hour</div>
                  <div className="text-sm text-white/60">More orders, less chaos</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-lg text-white/60 mb-6">Same system. Different use. Same result: <span className="text-[#C4A76A] font-semibold">more orders.</span></p>
            <a
              href="/demo?mode=foodtruck"
              className="inline-block bg-[#C4A76A] text-[#111] px-8 py-4 text-lg font-semibold hover:bg-[#d4b87a] transition-colors rounded"
            >
              See Food Truck Demo
            </a>
          </div>
        </div>
      </section>

      {/* ===== SECTION 6: THE OFFER (close) ===== */}
      <section className="py-20 px-6 bg-[#0a0a0a]">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">I&apos;ll Set This Up For You — Free</h2>
          <p className="text-lg text-white/60 mb-4 max-w-xl mx-auto">
            I&apos;ll set up your menu and ordering flow for you.<br />
            You try it with real customers.
          </p>
          <p className="text-lg text-white/60 mb-10 max-w-xl mx-auto">
            <span className="text-white">If it helps, we keep it.</span><br />
            If not, you don&apos;t pay.
          </p>
          <a
            href={LANDING.calendlyUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block bg-[#C4A76A] text-[#111] px-10 py-4 text-lg font-semibold hover:bg-[#d4b87a] transition-colors rounded"
          >
            👉 Get Set Up
          </a>
          <p className="mt-6 text-sm text-white/40">Free setup. $50/month if you keep it.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <img src="/assets/platehaven-logo.png" alt="PlateHaven" className="h-8 w-auto object-contain" />
            <span className="font-semibold text-[#C4A76A]">PlateHaven</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/50">
            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
            <a href={LANDING.calendlyUrl} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
        <div className="mx-auto max-w-5xl mt-8 pt-8 border-t border-white/10 text-center text-sm text-white/40">
          © {new Date().getFullYear()} PlateHaven. All rights reserved.
        </div>
      </footer>
    </main>
  )
}

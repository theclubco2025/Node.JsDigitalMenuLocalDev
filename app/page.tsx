/* eslint-disable @next/next/no-img-element */
export const metadata = {
  title: 'PlateHaven — Catering & Food Truck Orders Made Simple',
  description:
    'Turn 10 back-and-forth messages into 1 structured order. Customers build their order, see pricing, and submit — no calls or confusion.',
}

const LANDING = {
  calendlyUrl: 'https://calendly.com/tccsolutions2025/30min',
  demoUrl: '/demo',
}

export default function Landing() {
  return (
    <main className="bg-[#111] text-white min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#111]/90 backdrop-blur-md border-b border-[#C4A76A]/20">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/assets/platehaven-logo.png" alt="PlateHaven" className="h-10 w-auto object-contain" />
            <span className="text-xl font-semibold tracking-tight text-[#C4A76A]">
              PlateHaven
            </span>
          </a>
          <div className="flex items-center gap-6">
            <a href="#how-it-works" className="hidden md:inline text-sm text-white/60 hover:text-white">
              How It Works
            </a>
            <a href="#food-trucks" className="hidden md:inline text-sm text-white/60 hover:text-white">
              Food Trucks
            </a>
            <a href="#pricing" className="hidden md:inline text-sm text-white/60 hover:text-white">
              Pricing
            </a>
            <a
              href={LANDING.demoUrl}
              className="bg-[#C4A76A] text-[#111] px-5 py-2 text-sm font-semibold hover:bg-[#d4b87a] transition-colors"
            >
              Try Demo
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 md:pt-44 md:pb-32 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-[#C4A76A] text-sm font-medium tracking-widest uppercase mb-6">
            For Caterers & Food Businesses
          </p>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight mb-6">
            Stop Going Back and Forth<br />
            <span className="text-[#C4A76A]">With Catering Orders</span>
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            Customers build their order, see instant pricing, and submit everything you need — 
            no more endless texts, calls, or confusion.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={LANDING.demoUrl}
              className="w-full sm:w-auto bg-[#C4A76A] text-[#111] px-8 py-4 text-lg font-semibold hover:bg-[#d4b87a] transition-colors"
            >
              See Demo
            </a>
            <a
              href={LANDING.calendlyUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto border border-white/20 px-8 py-4 text-lg font-medium text-white hover:bg-white/5 transition-colors"
            >
              Get Started Free
            </a>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-20 px-6 bg-[#0a0a0a]">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Sound familiar?</h2>
          </div>
          <div className="bg-[#1a1a1a] rounded-lg p-6 md:p-10 max-w-2xl mx-auto">
            <div className="space-y-3 text-sm md:text-base">
              {[
                { who: 'customer', text: 'How much for 50 people?' },
                { who: 'you', text: 'What date?' },
                { who: 'customer', text: 'March 15th' },
                { who: 'you', text: 'Where\'s the delivery?' },
                { who: 'customer', text: '123 Main St. Can we do 60 people instead?' },
                { who: 'you', text: 'Any dietary restrictions?' },
                { who: 'customer', text: '3 vegetarian, 2 gluten-free' },
                { who: 'you', text: 'What time?' },
                { who: 'customer', text: 'Did you get my last text?' },
              ].map((msg, i) => (
                <div key={i} className={`flex ${msg.who === 'you' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${
                    msg.who === 'you' 
                      ? 'bg-[#C4A76A]/20 text-[#C4A76A]' 
                      : 'bg-white/10 text-white/80'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center mt-6 text-white/40 text-sm">...10+ messages per inquiry</p>
          </div>
          <div className="mt-12 text-center">
            <p className="text-2xl font-semibold text-[#C4A76A]">
              Turn 10 messages into 1 clean order.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-white/60 max-w-xl mx-auto">
              Send customers one link. They handle the rest.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                num: '1', 
                title: 'They Build Their Order', 
                desc: 'Customers browse your menu and select items. Each shows serving size so they know exactly what they need.' 
              },
              { 
                num: '2', 
                title: 'They Enter Event Details', 
                desc: 'Date, guest count, location, dietary needs — all captured in one structured form.' 
              },
              { 
                num: '3', 
                title: 'You Get a Clean Order', 
                desc: 'Everything organized and ready. No chasing details. No miscommunication.' 
              },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#C4A76A] text-[#111] text-xl font-bold mb-4">
                  {step.num}
                </div>
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-white/60">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo CTA */}
      <section className="py-20 px-6 bg-[#0a0a0a]">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">See It In Action</h2>
          <p className="text-white/60 mb-8 max-w-xl mx-auto">
            Try a sample catering order. No signup required.
          </p>
          <a
            href={LANDING.demoUrl}
            className="inline-block bg-[#C4A76A] text-[#111] px-10 py-4 text-lg font-semibold hover:bg-[#d4b87a] transition-colors"
          >
            Launch Demo
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for Caterers</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Instant Pricing', desc: 'Customers see their total as they build. No waiting for quotes.' },
              { title: 'Event Details Form', desc: 'Date, time, location, guest count, dietary needs — all captured upfront.' },
              { title: 'Serving Sizes', desc: 'Every item shows "Serves X people" so customers order the right amount.' },
              { title: 'Order Notifications', desc: 'Get notified instantly when a new catering request comes in.' },
              { title: 'Mobile-First', desc: 'Works on any device. No app download required for your customers.' },
              { title: 'AI Menu Assistant', desc: 'Customers can ask questions about your menu 24/7.' },
            ].map((feature, i) => (
              <div key={i} className="bg-[#1a1a1a] p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-[#C4A76A]">{feature.title}</h3>
                <p className="text-white/60">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Food Trucks Section */}
      <section id="food-trucks" className="py-20 px-6 bg-[#0a0a0a]">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-[#C4A76A] text-sm font-medium tracking-widest uppercase mb-4">
              Not Just for Catering
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Also Built for Busy Food Trucks</h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Handle rushes without losing customers. Let people order from their phone instead of waiting in line.
            </p>
          </div>
          
          {/* Pain Points */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: '⏳', title: 'Long Lines = Lost Customers', desc: 'People see the line and walk away. You lose sales without even knowing it.' },
              { icon: '😰', title: 'Staff Overwhelmed at Peak', desc: 'Rush hours are chaos. Orders get mixed up. Service slows down.' },
              { icon: '📵', title: 'Missed Orders During Rush', desc: 'Can\'t take phone orders when you\'re slammed. Revenue walks out the door.' },
            ].map((pain, i) => (
              <div key={i} className="bg-[#1a1a1a] p-6 rounded-lg text-center">
                <div className="text-3xl mb-3">{pain.icon}</div>
                <h3 className="font-semibold mb-2 text-white">{pain.title}</h3>
                <p className="text-white/60 text-sm">{pain.desc}</p>
              </div>
            ))}
          </div>

          {/* Solution Flow */}
          <div className="bg-[#1a1a1a] rounded-lg p-8 mb-12">
            <h3 className="text-xl font-semibold text-center mb-8 text-[#C4A76A]">How It Works for Food Trucks</h3>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { num: '1', title: 'Display QR Code', desc: 'Post it at your truck or on social media' },
                { num: '2', title: 'Customers Scan & Order', desc: 'They browse your menu on their phone' },
                { num: '3', title: 'Orders Come In Organized', desc: 'Each order shows name & items clearly' },
                { num: '4', title: 'Call Name When Ready', desc: 'Fast pickup, no confusion' },
              ].map((step, i) => (
                <div key={i} className="text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#C4A76A] text-[#111] font-bold mb-3">
                    {step.num}
                  </div>
                  <h4 className="font-semibold mb-1 text-sm">{step.title}</h4>
                  <p className="text-white/60 text-xs">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { metric: '↑', title: 'Serve More Per Hour', desc: 'No bottleneck at the counter. Orders flow smoothly.' },
              { metric: '↓', title: 'Reduce Staff Pressure', desc: 'Less chaos, fewer mistakes, happier team.' },
              { metric: '💰', title: 'Capture Lost Sales', desc: 'People who would\'ve walked away now order from their phone.' },
            ].map((result, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold text-[#C4A76A] mb-2">{result.metric}</div>
                <h3 className="font-semibold mb-1">{result.title}</h3>
                <p className="text-white/60 text-sm">{result.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <a
              href="/demo?mode=foodtruck"
              className="inline-block bg-[#C4A76A] text-[#111] px-8 py-4 text-lg font-semibold hover:bg-[#d4b87a] transition-colors"
            >
              See Food Truck Demo
            </a>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-white/60">One-time setup, flat monthly fee. No surprises.</p>
          </div>
          <div className="bg-[#1a1a1a] p-8 md:p-12 rounded-lg border border-[#C4A76A]/30">
            <div className="text-center mb-8">
              <div className="text-sm text-[#C4A76A] uppercase tracking-wide mb-3">All-Inclusive</div>
              <div className="flex items-baseline justify-center gap-2 mb-2">
                <span className="text-5xl font-bold">$50</span>
                <span className="text-xl text-white/50">/month</span>
              </div>
              <p className="text-white/50">+ one-time onboarding fee (quoted per business)</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {[
                'Unlimited orders',
                'Full menu customization',
                'Catering + Food Truck modes',
                'Order notifications (email + SMS)',
                'AI menu assistant',
                'Order analytics',
                'Mobile-optimized ordering',
                'Priority support',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-white/80">
                  <svg className="w-5 h-5 text-[#C4A76A] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {item}
                </div>
              ))}
            </div>
            <div className="text-center">
              <a
                href={LANDING.calendlyUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block bg-[#C4A76A] text-[#111] px-10 py-4 text-lg font-semibold hover:bg-[#d4b87a] transition-colors"
              >
                Get Your Quote
              </a>
              <p className="mt-4 text-sm text-white/40">We&apos;ll set up everything for you</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-[#0a0a0a]">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to simplify orders?</h2>
          <p className="text-white/60 mb-8">Set up in minutes. No credit card required.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={LANDING.demoUrl}
              className="w-full sm:w-auto bg-[#C4A76A] text-[#111] px-8 py-4 text-lg font-semibold hover:bg-[#d4b87a] transition-colors"
            >
              See Demo
            </a>
            <a
              href={LANDING.calendlyUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto border border-white/20 px-8 py-4 text-lg font-medium text-white hover:bg-white/5 transition-colors"
            >
              Get Started Free
            </a>
          </div>
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
            <a href="/terms" className="hover:text-white">Terms</a>
            <a href="/privacy" className="hover:text-white">Privacy</a>
            <a href={LANDING.calendlyUrl} target="_blank" rel="noreferrer" className="hover:text-white">Contact</a>
          </div>
        </div>
        <div className="mx-auto max-w-5xl mt-8 pt-8 border-t border-white/10 text-center text-sm text-white/40">
          © {new Date().getFullYear()} PlateHaven. All rights reserved.
        </div>
      </footer>
    </main>
  )
}

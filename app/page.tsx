/* eslint-disable @next/next/no-img-element */
export const metadata = {
  title: 'PlatePilot — Catering Orders Without the Back-and-Forth',
  description:
    'Turn 10 back-and-forth messages into 1 structured catering order. Customers build their order, see pricing, and submit — no calls or confusion.',
}

const LANDING = {
  calendlyUrl: 'https://calendly.com/tccsolutions2025/30min',
  demoUrl: '/menu?tenant=platepilot-demo',
}

export default function Landing() {
  return (
    <main className="bg-[#111] text-white min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#111]/90 backdrop-blur-md border-b border-[#C4A76A]/20">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <img src="/assets/platepilot-logo.png" alt="PlatePilot" className="h-10 w-10" />
            <span className="text-xl font-semibold tracking-tight text-[#C4A76A]">
              PlatePilot
            </span>
          </a>
          <div className="flex items-center gap-6">
            <a href="#how-it-works" className="hidden md:inline text-sm text-white/60 hover:text-white">
              How It Works
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

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-[#0a0a0a]">
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
                'Unlimited catering orders',
                'Full menu customization',
                'Event details capture',
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
      <section className="py-20 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to simplify catering orders?</h2>
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
          <div className="flex items-center gap-3">
            <img src="/assets/platepilot-logo.png" alt="PlatePilot" className="h-8 w-8" />
            <span className="font-semibold text-[#C4A76A]">PlatePilot</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/50">
            <a href="/terms" className="hover:text-white">Terms</a>
            <a href="/privacy" className="hover:text-white">Privacy</a>
            <a href={LANDING.calendlyUrl} target="_blank" rel="noreferrer" className="hover:text-white">Contact</a>
          </div>
        </div>
        <div className="mx-auto max-w-5xl mt-8 pt-8 border-t border-white/10 text-center text-sm text-white/40">
          © {new Date().getFullYear()} PlatePilot. All rights reserved.
        </div>
      </footer>
    </main>
  )
}

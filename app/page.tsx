/* eslint-disable @next/next/no-img-element */
export const metadata = {
  title: 'PlatePilot — Catering Orders Without the Back-and-Forth',
  description:
    'Turn 10 back-and-forth messages into 1 structured catering order. Customers build their order, see instant pricing, and submit everything you need — no calls, texts, or confusion.',
}

const LANDING = {
  calendlyUrl: 'https://calendly.com/tccsolutions2025/30min',
  demoUrl: '/menu?tenant=platepilot-demo',
}

export default function Landing() {
  return (
    <main className="bg-[#0f172a] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f172a]/95 backdrop-blur-sm border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <svg className="h-6 w-6 text-[#0f172a]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
              PlatePilot
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="hidden md:inline text-sm text-white/70 hover:text-white transition-colors">
              Features
            </a>
            <a href="#pricing" className="hidden md:inline text-sm text-white/70 hover:text-white transition-colors">
              Pricing
            </a>
            <a
              href={LANDING.demoUrl}
              className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2 text-sm font-semibold text-[#0f172a] hover:from-amber-400 hover:to-amber-500 transition-all"
            >
              Try Demo
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        {/* Background gradient effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-600/10 via-transparent to-transparent" />
        <div className="absolute top-1/4 -left-64 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-64 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        
        <div className="relative mx-auto max-w-6xl px-4">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 border border-amber-500/30 px-4 py-1.5 mb-8">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-sm text-amber-300">For caterers, food trucks, and custom order businesses</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
              Stop Going Back and Forth<br />
              <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 bg-clip-text text-transparent">
                With Catering Orders
              </span>
            </h1>
            
            <p className="mt-6 text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
              Let customers build their order, see pricing, and send you everything you need — 
              without calls, texts, or confusion.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={LANDING.demoUrl}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 text-lg font-semibold text-[#0f172a] hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/25"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                See Demo
              </a>
              <a
                href={LANDING.calendlyUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/20 bg-white/5 px-8 py-4 text-lg font-semibold text-white hover:bg-white/10 hover:border-white/30 transition-all"
              >
                Get Set Up Free
              </a>
            </div>
            
            {/* Social proof */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-white/50">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>No app required</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Setup in minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Free to start</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <p className="text-amber-400 font-semibold mb-4">THE PROBLEM</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Every catering inquiry is the same
            </h2>
          </div>
          
          <div className="max-w-4xl mx-auto">
            {/* Chat simulation */}
            <div className="bg-[#0f172a] rounded-2xl border border-white/10 p-6 md:p-8 mb-8">
              <div className="space-y-4">
                {[
                  { from: 'customer', text: '"How much for 50 people?"' },
                  { from: 'you', text: '"What date?"' },
                  { from: 'customer', text: '"March 15th"' },
                  { from: 'you', text: '"Where is the delivery?"' },
                  { from: 'customer', text: '"123 Main St, but actually can we do 60 people?"' },
                  { from: 'you', text: '"Any dietary restrictions?"' },
                  { from: 'customer', text: '"We have 3 vegetarians and 2 gluten-free"' },
                  { from: 'you', text: '"What time do you need it?"' },
                  { from: 'customer', text: '"Did you get my last text?"' },
                  { from: 'you', text: '"..."', isEllipsis: true },
                ].map((msg, i) => (
                  <div key={i} className={`flex ${msg.from === 'you' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      msg.from === 'you' 
                        ? 'bg-amber-500/20 text-amber-200' 
                        : 'bg-white/10 text-white/80'
                    } ${msg.isEllipsis ? 'animate-pulse' : ''}`}>
                      <p className="text-sm md:text-base">{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-center mt-6 text-white/40 text-sm">...repeat 10x per inquiry</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: '💬', text: 'Endless texts and calls' },
                { icon: '📋', text: 'Messy, incomplete details' },
                { icon: '⏰', text: 'Hours wasted daily' },
                { icon: '😤', text: 'Lost orders from confusion' },
              ].map((item, i) => (
                <div key={i} className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <p className="text-sm text-red-200">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 md:py-28 bg-[#1e293b]">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <p className="text-amber-400 font-semibold mb-4">THE SOLUTION</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              One link. One form.<br />
              <span className="text-amber-400">One clean order.</span>
            </h2>
            <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
              Send customers one link. They pick items, see pricing, enter event details, and hit submit. 
              You get a clean, organized order — not 47 unread texts.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Flow visualization */}
            <div className="space-y-6">
              {[
                { 
                  step: '1', 
                  title: 'Customer selects items', 
                  desc: 'They browse your menu and build their order. Every item shows serving size so they know exactly what they need.',
                  icon: '🍽️'
                },
                { 
                  step: '2', 
                  title: 'Pricing updates instantly', 
                  desc: 'No waiting for quotes. They see the total as they add items. No surprises, no confusion.',
                  icon: '💰'
                },
                { 
                  step: '3', 
                  title: 'They enter event details', 
                  desc: 'Date, guest count, location, dietary needs — all in one structured form.',
                  icon: '📅'
                },
                { 
                  step: '4', 
                  title: 'You get a clean order', 
                  desc: 'Everything organized in one place. Ready to prepare. No back-and-forth needed.',
                  icon: '✅'
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 items-start group">
                  <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-2xl">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-white group-hover:text-amber-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-white/60 mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Mock phone UI */}
            <div className="relative">
              <div className="bg-[#0f172a] rounded-3xl border border-white/10 p-4 shadow-2xl shadow-amber-500/10">
                <div className="bg-[#1e293b] rounded-2xl p-4 min-h-[400px]">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600" />
                    <span className="font-semibold text-white">Your Catering Menu</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: 'BBQ Pulled Pork Platter', serves: '10-12', price: '$89' },
                      { name: 'Mac & Cheese Tray', serves: '15-20', price: '$45' },
                      { name: 'Garden Salad Bowl', serves: '10-12', price: '$35' },
                    ].map((item, i) => (
                      <div key={i} className="bg-[#0f172a] rounded-xl p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-white text-sm">{item.name}</p>
                          <p className="text-amber-400/80 text-xs">Serves {item.serves}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-amber-400 font-semibold">{item.price}</p>
                          <button className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded mt-1">
                            Add +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white/60">Estimated Total</span>
                      <span className="text-amber-400 font-semibold">$169</span>
                    </div>
                    <button className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-[#0f172a] font-semibold py-2 rounded-lg text-sm">
                      Continue to Event Details →
                    </button>
                  </div>
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -top-4 -right-4 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                Live Preview
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-28 bg-[#0f172a]">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <p className="text-amber-400 font-semibold mb-4">POWERFUL FEATURES</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              More than just an order form
            </h2>
            <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
              PlatePilot is a complete catering business system that saves you time and helps you close more orders.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                title: 'Order Analytics',
                desc: 'See which items sell best, track revenue trends, and understand your busiest periods.',
                color: 'from-blue-500 to-blue-600'
              },
              {
                icon: (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                ),
                title: 'AI Menu Assistant',
                desc: 'Customers can ask questions about your menu 24/7. "Is the pulled pork gluten-free?" — answered instantly.',
                color: 'from-purple-500 to-purple-600'
              },
              {
                icon: (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                ),
                title: 'Mobile-First Design',
                desc: 'Customers order from any device — phone, tablet, or computer. No app download needed.',
                color: 'from-green-500 to-green-600'
              },
              {
                icon: (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                title: 'Instant Pricing',
                desc: 'No more quote requests. Customers see their total as they build their order. Faster decisions, more conversions.',
                color: 'from-amber-500 to-amber-600'
              },
              {
                icon: (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
                title: 'Event Management',
                desc: 'See all upcoming events in one calendar view. Never miss a delivery date or forget event details.',
                color: 'from-pink-500 to-pink-600'
              },
              {
                icon: (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                ),
                title: 'Automatic Notifications',
                desc: 'Email and SMS confirmations sent automatically. Customers stay informed without you lifting a finger.',
                color: 'from-teal-500 to-teal-600'
              },
            ].map((feature, i) => (
              <div key={i} className="bg-[#1e293b] rounded-2xl border border-white/5 p-6 hover:border-amber-500/30 transition-colors group">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 text-white`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-amber-400 transition-colors">{feature.title}</h3>
                <p className="text-white/60">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-3xl border border-amber-500/30 p-8 md:p-12">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 rounded-full px-4 py-1.5 mb-6">
              <svg className="h-4 w-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
              <span className="text-sm text-amber-300 font-medium">Interactive Demo</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Try a Sample Catering Order
            </h2>
            <p className="text-lg text-white/60 mb-8 max-w-2xl mx-auto">
              See exactly what your customers will experience. No signup required — just click and explore.
            </p>
            <a
              href={LANDING.demoUrl}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 text-lg font-semibold text-[#0f172a] hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/25"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Launch Demo
            </a>
            <p className="mt-4 text-sm text-white/40">Takes less than 60 seconds</p>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-20 md:py-28 bg-[#1e293b]">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <p className="text-amber-400 font-semibold mb-4">THE RESULTS</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              What changes when you use PlatePilot
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { metric: '5+ hours', label: 'Saved every week', icon: '⏰' },
              { metric: '3x faster', label: 'Quote to order', icon: '⚡' },
              { metric: '90%', label: 'Less back-and-forth', icon: '💬' },
              { metric: '0', label: 'Missed details', icon: '✅' },
            ].map((stat, i) => (
              <div key={i} className="bg-[#0f172a] rounded-2xl border border-white/10 p-6 text-center hover:border-amber-500/30 transition-colors">
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-3xl md:text-4xl font-bold text-amber-400 mb-1">{stat.metric}</div>
                <p className="text-white/60">{stat.label}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-12 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl border border-green-500/20 p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0 text-5xl">💡</div>
              <div>
                <h3 className="text-xl font-semibold text-green-400 mb-2">
                  Turn 10 back-and-forth messages into 1 structured order
                </h3>
                <p className="text-white/70">
                  That&apos;s the real impact. Every catering inquiry that used to take 10+ messages 
                  now happens in one clean submission. Your customers get instant pricing. 
                  You get complete order details. Everyone wins.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-28 bg-[#0f172a]">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-16">
            <p className="text-amber-400 font-semibold mb-4">SIMPLE PRICING</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Start free. Upgrade when ready.
            </h2>
            <p className="mt-4 text-lg text-white/60">
              No hidden fees. No setup costs. No long-term contracts.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <div className="bg-[#1e293b] rounded-3xl border border-white/10 p-8">
              <div className="text-sm font-semibold text-white/60 uppercase tracking-wide">Starter</div>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-white/60">/month</span>
              </div>
              <p className="mt-4 text-white/60">
                Perfect to get started and see if PlatePilot works for your business.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Up to 25 orders/month',
                  'Basic menu builder',
                  'Order notifications',
                  'Email support',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <svg className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/80">{item}</span>
                  </li>
                ))}
              </ul>
              <a
                href={LANDING.calendlyUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-8 block w-full rounded-full border-2 border-white/20 py-3 text-center font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Get Started Free
              </a>
            </div>

            {/* Pro - Featured */}
            <div className="bg-gradient-to-b from-amber-500/10 to-[#1e293b] rounded-3xl border-2 border-amber-500/50 p-8 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-[#0f172a] text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wide">
                Most Popular
              </div>
              <div className="text-sm font-semibold text-amber-400 uppercase tracking-wide">Professional</div>
              <div className="mt-4">
                <span className="text-4xl font-bold">$79</span>
                <span className="text-white/60">/month</span>
              </div>
              <p className="mt-4 text-white/60">
                For caterers ready to streamline their entire order process.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Unlimited orders',
                  'Full menu customization',
                  'AI menu assistant',
                  'Order analytics',
                  'SMS + email notifications',
                  'Priority support',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <svg className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/80">{item}</span>
                  </li>
                ))}
              </ul>
              <a
                href={LANDING.calendlyUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-8 block w-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 py-3 text-center font-semibold text-[#0f172a] hover:from-amber-400 hover:to-amber-500 transition-all"
              >
                Start Free Trial
              </a>
            </div>

            {/* Business */}
            <div className="bg-[#1e293b] rounded-3xl border border-white/10 p-8">
              <div className="text-sm font-semibold text-white/60 uppercase tracking-wide">Business</div>
              <div className="mt-4">
                <span className="text-4xl font-bold">$149</span>
                <span className="text-white/60">/month</span>
              </div>
              <p className="mt-4 text-white/60">
                For high-volume caterers and multi-location businesses.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Everything in Professional',
                  'Multiple menus/locations',
                  'Deposit collection',
                  'Custom branding',
                  'API access',
                  'Dedicated support',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <svg className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white/80">{item}</span>
                  </li>
                ))}
              </ul>
              <a
                href={LANDING.calendlyUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-8 block w-full rounded-full border-2 border-white/20 py-3 text-center font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 md:py-28 bg-[#1e293b]">
        <div className="mx-auto max-w-4xl px-4">
          <div className="text-center mb-12">
            <p className="text-amber-400 font-semibold mb-4">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Common Questions
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Do my customers need to create an account?',
                a: 'No. Customers just click your link and start building their order. No signup, no app download, no friction.',
              },
              {
                q: 'How long does it take to set up?',
                a: 'Most caterers are live within 30 minutes. Just add your menu items, customize your branding, and share your link.',
              },
              {
                q: 'Can I accept deposits?',
                a: 'Yes! On the Professional plan and above, you can require deposits at checkout. Payments are processed securely through Stripe.',
              },
              {
                q: 'What if my pricing is custom for each order?',
                a: 'PlatePilot shows customers an estimated total based on your menu prices. You can always adjust the final price after reviewing the order.',
              },
              {
                q: 'Can I use this for regular (non-catering) orders too?',
                a: 'Absolutely. PlatePilot works for any food business that takes custom orders — caterers, food trucks, bakeries, meal prep services, etc.',
              },
              {
                q: 'Is there a contract or commitment?',
                a: 'No contracts. No setup fees. Cancel anytime. We believe PlatePilot should earn your business every month.',
              },
            ].map((faq) => (
              <details key={faq.q} className="group bg-[#0f172a] rounded-2xl border border-white/10 p-6 hover:border-amber-500/30 transition-colors">
                <summary className="cursor-pointer list-none flex items-center justify-between font-semibold text-lg">
                  {faq.q}
                  <svg className="h-5 w-5 text-white/50 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="mt-4 text-white/60">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-[#1e293b] to-[#0f172a]">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Ready to stop the back-and-forth?
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-8">
            Set up your catering system today. Get your first order tomorrow.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={LANDING.demoUrl}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 text-lg font-semibold text-[#0f172a] hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/25"
            >
              See Demo
            </a>
            <a
              href={LANDING.calendlyUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/20 bg-white/5 px-8 py-4 text-lg font-semibold text-white hover:bg-white/10 hover:border-white/30 transition-all"
            >
              Get Set Up Free
            </a>
          </div>
          <p className="mt-6 text-white/40">
            Free to start • No credit card required • Setup in minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f172a] border-t border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <svg className="h-4 w-4 text-[#0f172a]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="font-bold bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
                PlatePilot
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/50">
              <a href="/terms" className="hover:text-white transition-colors">Terms</a>
              <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
              <a href={LANDING.calendlyUrl} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/40">
            <p>© {new Date().getFullYear()} PlatePilot. All rights reserved.</p>
            <p>Secure payments powered by Stripe</p>
          </div>
        </div>
      </footer>
    </main>
  )
}

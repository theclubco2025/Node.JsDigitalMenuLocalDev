/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Demo | PlateHaven',
  description: 'Try PlateHaven demos for catering, quick pickup, and digital menu ordering',
}

export default function DemoPage() {
  return (
    <main className="bg-[#0f0f0f] text-white min-h-screen">
      {/* Header */}
      <nav className="border-b border-white/5 py-4 px-4 sm:py-5 sm:px-6">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/assets/platehaven-logo-transparent.png" alt="PlateHaven" className="h-8 sm:h-10 w-auto object-contain" />
          </Link>
          <Link href="/" className="text-sm text-white/50 hover:text-white transition-colors">
            ← Back
          </Link>
        </div>
      </nav>

      <div className="py-6 px-4 sm:py-10 sm:px-6">
        <div className="mx-auto max-w-5xl">

          {/* Hero */}
          <div className="text-center mb-6 sm:mb-10">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3">Try PlateHaven</h1>
            <p className="text-white/50 max-w-lg mx-auto text-sm">
              See the ordering experience for yourself.
            </p>
          </div>

          {/* Intro */}
          <p className="text-center text-white/60 text-sm mb-5 sm:mb-8">
            Pick a flow to try. Each one is fully interactive.
          </p>

          {/* Customer Demos */}
          <div className="mb-6 sm:mb-10">
            <h2 className="text-lg font-semibold mb-3 sm:mb-5">Customer Ordering</h2>

            {/* Catering Demo — primary hero CTA */}
            <Link
              href="/menu?tenant=platehaven-demo"
              className="group block bg-[#161616] rounded-2xl p-4 mb-3 sm:p-8 sm:mb-5 border-2 border-[#C4A76A]/30 hover:border-[#C4A76A]/60 transition-all"
            >
              <div className="flex items-start gap-3 sm:gap-5">
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-[#C4A76A]/15 flex items-center justify-center shrink-0">
                  <span className="text-xl sm:text-2xl">🍽️</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5 sm:mb-2">
                    <h3 className="text-lg sm:text-xl font-bold group-hover:text-[#C4A76A] transition-colors">Catering Orders</h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#C4A76A]/20 text-[#C4A76A] font-medium">DEMO</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#C4A76A] text-[#111] font-bold uppercase tracking-wide">Start Here</span>
                  </div>
                  <p className="text-white/50 text-xs sm:text-sm leading-relaxed max-w-2xl">
                    The best place to start — build a full event order with serving sizes, event details, dietary notes, and instant pricing totals.
                  </p>
                </div>
                <div className="hidden sm:block text-white/30 group-hover:text-[#C4A76A] transition-colors text-2xl shrink-0">→</div>
              </div>
            </Link>

            {/* Quick Pickup Demo — secondary */}
            <Link
              href="/menu?tenant=quickpickup-demo"
              className="group block bg-[#161616] rounded-xl p-4 sm:p-5 border border-white/5 hover:border-[#C4A76A]/30 transition-all"
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-[#C4A76A]/10 flex items-center justify-center shrink-0">
                  <span className="text-lg sm:text-xl">🚚</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <h3 className="font-semibold group-hover:text-[#C4A76A] transition-colors">Quick Pickup</h3>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#C4A76A]/20 text-[#C4A76A] font-medium">DEMO</span>
                  </div>
                  <p className="text-white/40 text-xs sm:text-sm leading-relaxed">
                    Fast ordering: items + pickup name, built for quick service.
                  </p>
                </div>
                <div className="hidden sm:block text-white/20 group-hover:text-[#C4A76A] transition-colors">→</div>
              </div>
            </Link>
          </div>

          {/* Business Tools */}
          <div className="mb-8 sm:mb-14">
            <h2 className="text-lg font-semibold mb-3 sm:mb-5">Business Tools</h2>
            <div className="grid md:grid-cols-2 gap-3 sm:gap-5">

              {/* Admin Panel */}
              <Link
                href="/platehaven/admin"
                className="group bg-[#161616] rounded-xl p-4 sm:p-5 border border-white/5 hover:border-[#C4A76A]/30 transition-all"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <span className="text-lg sm:text-xl">⚙️</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <h3 className="font-semibold group-hover:text-[#C4A76A] transition-colors">Admin Panel</h3>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#C4A76A]/20 text-[#C4A76A] font-medium">DEMO</span>
                    </div>
                    <p className="text-white/40 text-xs sm:text-sm leading-relaxed">
                      Manage menu items, prices, categories, and ordering settings.
                    </p>
                  </div>
                  <div className="hidden sm:block text-white/20 group-hover:text-[#C4A76A] transition-colors">→</div>
                </div>
              </Link>

              {/* Kitchen Display */}
              <Link
                href="/platehaven/kds"
                className="group bg-[#161616] rounded-xl p-4 sm:p-5 border border-white/5 hover:border-[#C4A76A]/30 transition-all"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <span className="text-lg sm:text-xl">📺</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <h3 className="font-semibold group-hover:text-[#C4A76A] transition-colors">Kitchen Display</h3>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#C4A76A]/20 text-[#C4A76A] font-medium">DEMO</span>
                    </div>
                    <p className="text-white/40 text-xs sm:text-sm leading-relaxed">
                      See incoming orders on a dedicated kitchen screen.
                    </p>
                  </div>
                  <div className="hidden sm:block text-white/20 group-hover:text-[#C4A76A] transition-colors">→</div>
                </div>
              </Link>
            </div>
          </div>

          {/* How It Works */}
          <div className="mb-8 sm:mb-14">
            <h2 className="text-sm font-medium text-[#C4A76A] uppercase tracking-wider mb-4 sm:mb-6 text-center">How It Works</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {[
                { step: '1', title: 'Share Link', desc: 'Send your menu link or display QR code' },
                { step: '2', title: 'They Order', desc: 'Customers browse and build their order' },
                { step: '3', title: 'You Receive', desc: 'Get complete order details instantly' },
                { step: '4', title: 'You Deliver', desc: 'Fulfill orders with confidence' },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#C4A76A] text-[#111] text-xs sm:text-sm font-bold flex items-center justify-center mx-auto mb-1.5 sm:mb-2">
                    {item.step}
                  </div>
                  <div className="text-xs sm:text-sm font-medium mb-0.5 sm:mb-1">{item.title}</div>
                  <div className="text-[10px] sm:text-xs text-white/40 leading-snug">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-[#161616] rounded-xl p-4 sm:p-5 border border-white/5">
            <div className="flex items-start gap-3">
              <span className="text-[#C4A76A]">ℹ️</span>
              <div>
                <div className="text-sm font-medium text-white/80 mb-1">Demo Mode</div>
                <p className="text-xs text-white/40 leading-relaxed">
                  Orders placed in demo mode are not processed. Menu items and pricing shown are for demonstration purposes only.
                  Your actual system will be fully customized with your branding, menu items, and pricing.
                </p>
                <Link
                  href="https://calendly.com/tccsolutions2025/30min"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-3 text-sm text-[#C4A76A] hover:underline font-medium"
                >
                  Ready to get started? Schedule a call →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

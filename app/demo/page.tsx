/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Demo | PlateHaven',
  description: 'Try PlateHaven demos for catering and food truck ordering',
}

export default function DemoPage() {
  return (
    <main className="bg-[#0f0f0f] text-white min-h-screen">
      {/* Header */}
      <nav className="border-b border-white/5 py-5 px-6">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/assets/platepilot-logo.png" alt="PlateHaven" className="h-10 w-auto object-contain" />
            <span className="text-xl font-semibold text-[#C4A76A]">PlateHaven</span>
          </Link>
          <Link href="/" className="text-sm text-white/50 hover:text-white transition-colors">
            ← Back
          </Link>
        </div>
      </nav>

      <div className="py-12 px-6">
        <div className="mx-auto max-w-5xl">
          
          {/* Hero */}
          <div className="text-center mb-14">
            <h1 className="text-3xl font-bold mb-3">Try PlateHaven</h1>
            <p className="text-white/50 max-w-lg mx-auto text-sm">
              Explore the ordering experience your customers will love.
            </p>
          </div>

          {/* How It Works - Compact */}
          <div className="mb-14">
            <h2 className="text-sm font-medium text-[#C4A76A] uppercase tracking-wider mb-6 text-center">How It Works</h2>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { step: '1', title: 'Share Link', desc: 'Send your menu link or display QR code' },
                { step: '2', title: 'They Order', desc: 'Customers browse and build their order' },
                { step: '3', title: 'You Receive', desc: 'Get complete order details instantly' },
                { step: '4', title: 'You Deliver', desc: 'Fulfill orders with confidence' },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-8 h-8 rounded-full bg-[#C4A76A] text-[#111] text-sm font-bold flex items-center justify-center mx-auto mb-2">
                    {item.step}
                  </div>
                  <div className="text-sm font-medium mb-1">{item.title}</div>
                  <div className="text-xs text-white/40">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Demos */}
          <div className="mb-12">
            <h2 className="text-lg font-semibold mb-5">Customer Ordering</h2>
            <div className="grid md:grid-cols-2 gap-5">
              
              {/* Catering Demo */}
              <Link 
                href="/menu?tenant=platehaven-demo"
                className="group bg-[#161616] rounded-xl p-5 border border-white/5 hover:border-[#C4A76A]/30 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-lg bg-[#C4A76A]/10 flex items-center justify-center shrink-0">
                    <span className="text-xl">🍽️</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-1 group-hover:text-[#C4A76A] transition-colors">Catering Orders</h3>
                    <p className="text-white/40 text-sm leading-relaxed">
                      Full event ordering with serving sizes, event details, and dietary requirements.
                    </p>
                  </div>
                  <div className="text-white/20 group-hover:text-[#C4A76A] transition-colors">→</div>
                </div>
              </Link>

              {/* Food Truck Demo */}
              <Link 
                href="/menu?tenant=platehaven-demo&mode=foodtruck"
                className="group bg-[#161616] rounded-xl p-5 border border-white/5 hover:border-[#C4A76A]/30 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-lg bg-[#C4A76A]/10 flex items-center justify-center shrink-0">
                    <span className="text-xl">🚚</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-1 group-hover:text-[#C4A76A] transition-colors">Quick Pickup</h3>
                    <p className="text-white/40 text-sm leading-relaxed">
                      Fast ordering for food trucks. Just items and a pickup name.
                    </p>
                  </div>
                  <div className="text-white/20 group-hover:text-[#C4A76A] transition-colors">→</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Business Tools */}
          <div className="mb-12">
            <h2 className="text-lg font-semibold mb-5">Business Tools</h2>
            <div className="grid md:grid-cols-2 gap-5">
              
              {/* Admin Panel */}
              <Link 
                href="/independentbarandgrille?admin=1"
                className="group bg-[#161616] rounded-xl p-5 border border-white/5 hover:border-[#C4A76A]/30 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <span className="text-xl">⚙️</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-1 group-hover:text-[#C4A76A] transition-colors">Admin Panel</h3>
                    <p className="text-white/40 text-sm leading-relaxed">
                      Manage menu items, prices, categories, and ordering settings.
                    </p>
                  </div>
                  <div className="text-white/20 group-hover:text-[#C4A76A] transition-colors">→</div>
                </div>
              </Link>

              {/* Kitchen Display */}
              <Link 
                href="/kds/platehaven-demo"
                className="group bg-[#161616] rounded-xl p-5 border border-white/5 hover:border-[#C4A76A]/30 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <span className="text-xl">📺</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-1 group-hover:text-[#C4A76A] transition-colors">Kitchen Display</h3>
                    <p className="text-white/40 text-sm leading-relaxed">
                      See incoming orders on a dedicated kitchen screen.
                    </p>
                  </div>
                  <div className="text-white/20 group-hover:text-[#C4A76A] transition-colors">→</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-center text-xs text-white/30 max-w-md mx-auto">
            Demo mode — orders are not processed. Menu items shown are for demonstration only.
            <Link href="https://calendly.com/tccsolutions2025/30min" target="_blank" rel="noreferrer" className="text-[#C4A76A] hover:underline ml-1">
              Get started →
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

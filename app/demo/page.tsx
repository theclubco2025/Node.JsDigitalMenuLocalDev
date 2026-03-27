/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Demo | PlateHaven',
  description: 'Try PlateHaven demos for catering and food truck ordering',
}

type Props = {
  searchParams?: Record<string, string | string[] | undefined>
}

export default function DemoPage({ searchParams }: Props) {
  const mode = searchParams?.mode as string | undefined

  return (
    <main className="bg-[#111] text-white min-h-screen">
      {/* Header */}
      <nav className="border-b border-white/10 py-4 px-6">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/assets/platepilot-logo.png" alt="PlateHaven" className="h-8 w-auto object-contain" />
            <span className="text-lg font-semibold text-[#C4A76A]">PlateHaven</span>
          </Link>
          <Link href="/" className="text-sm text-white/60 hover:text-white">
            ← Back to Home
          </Link>
        </div>
      </nav>

      <div className="py-16 px-6">
        <div className="mx-auto max-w-4xl">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Experience PlateHaven</h1>
            <p className="text-white/60 max-w-2xl mx-auto">
              See how PlateHaven transforms the ordering experience for your customers. 
              Choose a demo mode below to explore the full system.
            </p>
          </div>

          {/* How It Works Explanation */}
          <div className="bg-[#1a1a1a] rounded-lg p-6 md:p-8 mb-12">
            <h2 className="text-xl font-semibold text-[#C4A76A] mb-4">How PlateHaven Works</h2>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h3 className="font-semibold mb-2 text-white">For Your Customers</h3>
                <ul className="space-y-2 text-white/70">
                  <li className="flex items-start gap-2">
                    <span className="text-[#C4A76A]">•</span>
                    Scan a QR code or click your ordering link
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#C4A76A]">•</span>
                    Browse your menu with photos, descriptions, and prices
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#C4A76A]">•</span>
                    Add items to their order and see the total instantly
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#C4A76A]">•</span>
                    Submit their order with all details in one go
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-white">For Your Business</h3>
                <ul className="space-y-2 text-white/70">
                  <li className="flex items-start gap-2">
                    <span className="text-[#C4A76A]">•</span>
                    Receive orders with complete details — no back-and-forth
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#C4A76A]">•</span>
                    View orders in the Kitchen Display System (KDS)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#C4A76A]">•</span>
                    Manage your menu, pricing, and settings from the Admin Panel
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#C4A76A]">•</span>
                    Get notified instantly via email or SMS
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Demo Cards */}
          <h2 className="text-xl font-semibold mb-6 text-center">Choose a Demo</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* Catering Demo */}
            <div className={`bg-[#1a1a1a] rounded-lg p-6 border-2 transition-colors ${mode === 'catering' || !mode ? 'border-[#C4A76A]' : 'border-transparent hover:border-[#C4A76A]/50'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#C4A76A]/20 flex items-center justify-center">
                  <span className="text-2xl">🍽️</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Catering Demo</h3>
                  <p className="text-white/50 text-sm">For events & large orders</p>
                </div>
              </div>
              <p className="text-white/70 text-sm mb-4">
                Experience the full catering order flow. Customers select items with serving sizes, 
                enter event details (date, guests, location), and submit a complete catering inquiry.
              </p>
              <ul className="text-xs text-white/50 mb-4 space-y-1">
                <li>✓ Items show &quot;Serves X people&quot;</li>
                <li>✓ Event details form (date, time, guests, location)</li>
                <li>✓ Dietary requirements capture</li>
                <li>✓ Order summary with total estimate</li>
              </ul>
              <Link
                href="/menu?tenant=platehaven-demo&mode=catering"
                className="block w-full bg-[#C4A76A] text-[#111] py-3 text-center font-semibold hover:bg-[#d4b87a] transition-colors rounded"
              >
                Try Catering Demo
              </Link>
            </div>

            {/* Food Truck Demo */}
            <div className={`bg-[#1a1a1a] rounded-lg p-6 border-2 transition-colors ${mode === 'foodtruck' ? 'border-[#C4A76A]' : 'border-transparent hover:border-[#C4A76A]/50'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#C4A76A]/20 flex items-center justify-center">
                  <span className="text-2xl">🚚</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Food Truck Demo</h3>
                  <p className="text-white/50 text-sm">Quick pickup orders</p>
                </div>
              </div>
              <p className="text-white/70 text-sm mb-4">
                Simplified ordering for fast-paced environments. Customers add items to their order, 
                enter a pickup name, and submit. No event details needed — just quick, clean orders.
              </p>
              <ul className="text-xs text-white/50 mb-4 space-y-1">
                <li>✓ Streamlined item selection</li>
                <li>✓ Simple pickup name field</li>
                <li>✓ No event details required</li>
                <li>✓ Fast checkout flow</li>
              </ul>
              <Link
                href="/menu?tenant=platehaven-demo&mode=foodtruck"
                className="block w-full bg-[#C4A76A] text-[#111] py-3 text-center font-semibold hover:bg-[#d4b87a] transition-colors rounded"
              >
                Try Food Truck Demo
              </Link>
            </div>
          </div>

          {/* Business Tools Section */}
          <h2 className="text-xl font-semibold mb-6 text-center">Business Tools</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {/* Admin Panel */}
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-xl">⚙️</span>
                </div>
                <div>
                  <h3 className="font-semibold">Admin Panel</h3>
                  <p className="text-white/50 text-xs">Manage your menu & settings</p>
                </div>
              </div>
              <p className="text-white/60 text-sm mb-4">
                See how you&apos;d manage your menu, update prices, add items, and configure your ordering system.
              </p>
              <Link
                href="/menu?tenant=platehaven-demo&admin=1"
                className="block w-full border border-[#C4A76A] text-[#C4A76A] py-2.5 text-center font-medium hover:bg-[#C4A76A]/10 transition-colors rounded text-sm"
              >
                View Admin Panel
              </Link>
            </div>

            {/* Kitchen Display */}
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-xl">📺</span>
                </div>
                <div>
                  <h3 className="font-semibold">Kitchen Display (KDS)</h3>
                  <p className="text-white/50 text-xs">View incoming orders</p>
                </div>
              </div>
              <p className="text-white/60 text-sm mb-4">
                See how orders appear on the kitchen display. Perfect for keeping your team organized during busy periods.
              </p>
              <Link
                href="/kds/platehaven-demo"
                className="block w-full border border-[#C4A76A] text-[#C4A76A] py-2.5 text-center font-medium hover:bg-[#C4A76A]/10 transition-colors rounded text-sm"
              >
                View Kitchen Display
              </Link>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-[#0a0a0a] rounded-lg p-6 border border-white/10">
            <h3 className="font-semibold text-sm text-white/80 mb-2">Demo Mode Notice</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              This is a demonstration environment. Orders placed here are not real and will not be processed. 
              Menu items, prices, and business information shown are for demonstration purposes only. 
              No payment information is collected in demo mode. To set up PlateHaven for your business, 
              <a href="https://calendly.com/tccsolutions2025/30min" target="_blank" rel="noreferrer" className="text-[#C4A76A] hover:underline ml-1">
                schedule a call with us
              </a>.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

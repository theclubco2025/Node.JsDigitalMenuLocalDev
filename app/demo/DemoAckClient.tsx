"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useMemo } from "react"

export default function DemoAckClient() {
  const router = useRouter()

  const calendlyUrl = useMemo(() => "https://calendly.com/tccsolutions2025/30min", [])
  const demoAckKey = "demoAcknowledged_v4"
  const tenant = "demo"

  const acknowledge = () => {
    try {
      localStorage.setItem(demoAckKey, "1")
    } catch {}
  }

  const go = (path: string) => {
    acknowledge()
    router.push(path)
  }

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="flex items-center justify-center">
          <Image
            src="/assets/tcc-logo-horizontal.png"
            alt="TCC Solutions"
            width={220}
            height={60}
            priority
          />
        </div>

        <div className="mt-8 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm md:p-10">
          <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Live demo experience
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
            Explore the demo
          </h1>

          <p className="mt-3 text-base text-neutral-700">
            Click any view below to explore. After onboarding, everything is customized: your branding, menu items, photos, and QR codes.
          </p>

          <div className="mt-6 space-y-3">
            <button
              onClick={() => go(`/menu?tenant=${encodeURIComponent(tenant)}`)}
              className="group flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-left shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-50 hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                  </svg>
                </div>
                <div>
                  <div className="text-base font-semibold text-neutral-900">Guest Menu</div>
                  <div className="text-sm text-neutral-500">Browse items, use AI assistant, add to cart</div>
                </div>
              </div>
              <svg className="h-5 w-5 text-neutral-400 transition-transform group-hover:translate-x-1 group-hover:text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => go('/demo/kitchen')}
              className="group flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-left shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-50 hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                  </svg>
                </div>
                <div>
                  <div className="text-base font-semibold text-neutral-900">Kitchen Display (KDS)</div>
                  <div className="text-sm text-neutral-500">View orders, manage tickets, track status</div>
                </div>
              </div>
              <svg className="h-5 w-5 text-neutral-400 transition-transform group-hover:translate-x-1 group-hover:text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => go('/demo/admin')}
              className="group flex w-full items-center justify-between rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-left shadow-sm transition-all hover:border-neutral-300 hover:bg-neutral-50 hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </div>
                <div>
                  <div className="text-base font-semibold text-neutral-900">Admin Panel</div>
                  <div className="text-sm text-neutral-500">Edit menu, settings, view analytics preview</div>
                </div>
              </div>
              <svg className="h-5 w-5 text-neutral-400 transition-transform group-hover:translate-x-1 group-hover:text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="mt-4 text-center text-xs text-neutral-500">
            This is a public preview — edits won&apos;t change the live demo.
          </div>

          <div className="mt-8 flex flex-col items-center gap-4">
            <a
              href={calendlyUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-base font-semibold text-white shadow-sm transition-colors hover:bg-emerald-500 sm:w-auto sm:px-10"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              Book a Demo Call
            </a>
            <a
              href="/"
              className="text-sm text-neutral-500 underline underline-offset-4 hover:text-neutral-700"
            >
              Back to home
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}

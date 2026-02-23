"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

export default function DemoAckClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

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

  const continueToDemo = () => {
    if (loading) return
    setLoading(true)
    go(`/menu?tenant=${encodeURIComponent(tenant)}`)
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
            Choose what you want to view
          </h1>

          <p className="mt-3 text-base text-neutral-700">
            This is a sample experience. After onboarding, we personalize everything: branding, items, photos, QR link, and voice.
          </p>

          <div className="mt-6 rounded-3xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="text-sm font-semibold">Demo views (same demo tenant)</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                onClick={() => go(`/menu?tenant=${encodeURIComponent(tenant)}`)}
                className="inline-flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold hover:bg-neutral-50"
              >
                <span>Guest menu</span>
                <span className="text-xs text-neutral-500">Browse</span>
              </button>
              <button
                onClick={() => go(`/menu?tenant=${encodeURIComponent(tenant)}&admin=1`)}
                className="inline-flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold hover:bg-neutral-50"
              >
                <span>Inline editor</span>
                <span className="text-xs text-neutral-500">admin=1</span>
              </button>
              <button
                onClick={() => go(`/admin/menu?tenant=${encodeURIComponent(tenant)}`)}
                className="inline-flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold hover:bg-neutral-50"
              >
                <span>Admin portal</span>
                <span className="text-xs text-neutral-500">Auth</span>
              </button>
              <button
                onClick={() => go(`/kds?pin=${encodeURIComponent("1234")}`)}
                className="inline-flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold hover:bg-neutral-50"
              >
                <span>KDS (PIN)</span>
                <span className="text-xs text-neutral-500">1234</span>
              </button>
              <button
                onClick={() => go(`/kitchen?tenant=${encodeURIComponent(tenant)}`)}
                className="inline-flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold hover:bg-neutral-50"
              >
                <span>Kitchen board</span>
                <span className="text-xs text-neutral-500">Live</span>
              </button>
              <a
                href="/api/orders/env-check"
                onClick={() => acknowledge()}
                className="inline-flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold hover:bg-neutral-50"
              >
                <span>Ordering env check</span>
                <span className="text-xs text-neutral-500">JSON</span>
              </a>
            </div>
            <div className="mt-3 text-xs text-neutral-500">
              Tip: Admin/KDS require DB (and Admin requires auth) depending on environment.
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={continueToDemo}
              className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Loading demo…" : "Continue to demo menu"}
            </button>

            <a
              href={calendlyUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 bg-white px-6 py-3 text-sm font-semibold text-neutral-900 shadow-sm hover:bg-neutral-50"
            >
              Book a demo call
            </a>
          </div>

          <p className="mt-6 text-center text-xs text-neutral-500">
            Tip: you can always return to the demo later at <span className="font-medium">tccmenus.com/demo</span>.
          </p>
        </div>
      </div>
    </main>
  )
}



"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

export default function DemoAckClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const calendlyUrl = useMemo(() => "https://calendly.com/adennis-tccmenus/menu-demo", [])
  const demoAckKey = "demoAcknowledged_v4"

  const continueToDemo = () => {
    if (loading) return
    setLoading(true)
    try {
      localStorage.setItem(demoAckKey, "1")
    } catch {}
    router.push("/menu?tenant=demo")
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
            You’re about to view a demo menu
          </h1>

          <p className="mt-3 text-base text-neutral-700">
            This is a sample experience to show how the menu looks and feels. When we onboard your restaurant,
            we’ll personalize everything: your branding, your real menu items, your photos, your QR link, and your voice.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="text-sm font-semibold">What will be customized</div>
              <ul className="mt-2 list-disc pl-5 text-sm text-neutral-700">
                <li>Logo, colors, typography, and layout</li>
                <li>Accurate menu items + pricing + sections</li>
                <li>Allergens/diet tags (as provided/approved)</li>
                <li>Hero imagery + signature dishes</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="text-sm font-semibold">Important note</div>
              <p className="mt-2 text-sm text-neutral-700">
                Demo menus are for preview only. For severe allergies, guests should always confirm with staff.
              </p>
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



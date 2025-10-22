
'use client'

import React from 'react'

const LANDING = {
  calendlyUrl: 'https://calendly.com/adennis-tccmenus/menu-demo',
  primaryCtaLabel: 'Book Demo',
  priceMonthly: 150,
  priceDisclaimer: 'From $150/month. One-time onboarding based on menu size. No POS overhaul. QR-ready in days.',
  logo: '/assets/tcc-logo-horizontal.png',
  qrDemo: '/assets/tcc-demo-qr.png',
  features: [
    {
      title: 'Save time',
      body: 'Update items, 86 dishes, and swap specials in seconds — no reprints or retraining.',
    },
    {
      title: 'Grow revenue',
      body: 'The assistant gently recommends popular items based on time, season, and guest behavior.',
    },
    {
      title: 'Reduce friction',
      body: 'Cut paper waste and repeat questions — smoother service, happier guests.',
    },
    {
      title: 'Allergen clarity',
      body: 'Instant answers for allergens and dietary needs with owner-approved responses.',
    },
    {
      title: 'Staff assist',
      body: 'New staff lean on the assistant for pairings and FAQs while they learn the menu.',
    },
    {
      title: 'Monthly insights',
      body: 'Simple, once-a-month report: what sold, what stalled, and 3 quick wins to try.',
    },
  ],
  useCases: [
    {
      name: 'Restaurant',
      blurb: 'Recommends what guests love most, rotates chef specials, handles allergens clearly.',
    },
    { name: 'Cafe', blurb: 'Speeds up lines, pushes seasonal drinks, keeps pastry counts in sync.' },
    { name: 'Bar', blurb: 'Promotes signature cocktails, suggests pairings, manages happy hour.' },
    {
      name: 'Food Truck',
      blurb: 'Highlights limited items, sells out cleanly, and avoids “Do you still have…?”',
    },
  ],
  faqs: [
    {
      q: 'Do I have to replace my POS?',
      a: 'No. Your POS stays. Guests scan a QR and the assistant runs on the web, separate from your POS.',
    },
    {
      q: 'How fast can we launch?',
      a: 'Most menus are live in 2–5 days depending on complexity and assets.',
    },
    {
      q: 'What about photos and allergens?',
      a: 'You approve all item data. We support photos, tags (GF/V/VG/DF), and clear allergen callouts.',
    },
    {
      q: 'What does ongoing service include?',
      a: 'Monthly insights, bug fixes, copy tweaks, and owner-requested adjustments within scope.',
    },
    {
      q: 'Is there a contract?',
      a: 'Month-to-month. Cancel anytime. Keep your exported menu data.',
    },
  ],
}

export default function Landing() {
  return (
    <main className="bg-white text-neutral-900">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-100 to-white" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <h1 className="font-semibold tracking-tight" style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)' }}>
              Your menu hasn’t changed in decades — your customers have.
            </h1>
            <p className="mt-4 text-lg text-neutral-700">
              Update your menu like texting a friend. Give guests instant answers, spotlight best-sellers, and offer gentle
              recommendations — while you run the room.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href={LANDING.calendlyUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-2xl bg-neutral-900 px-5 py-3 text-sm text-white shadow-sm hover:bg-neutral-800"
              >
                {LANDING.primaryCtaLabel}
              </a>
              <a
                href="/demo"
                className="inline-flex items-center rounded-2xl border border-neutral-300 bg-white px-5 py-3 text-neutral-800 hover:border-neutral-400"
              >
                Try Live Demo
              </a>
            </div>
            <p className="mt-3 text-xs text-neutral-500">{LANDING.priceDisclaimer}</p>
          </div>
          <div className="relative">
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-center">
                <img
                  src={LANDING.logo}
                  alt="TCC Solutions"
                  className="w-full max-w-xs md:max-w-sm"
                />
              </div>
              <div className="mt-4 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-700">
                <p className="font-medium">Scan a live demo QR or watch a 60-second walkthrough.</p>
                <div className="mt-3 flex items-center gap-4">
                  <div className="grid h-28 w-28 place-items-center rounded-md border border-dashed border-neutral-300 text-neutral-400">
                    <img
                      src={LANDING.qrDemo}
                      alt="Demo menu QR"
                      className="h-full w-full rounded-md object-contain"
                    />
                  </div>
                  <div className="text-xs text-neutral-500">tccmenus.com/demo</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid items-start gap-8 md:grid-cols-5">
          <div className="md:col-span-2">
            <h2 className="text-2xl font-semibold tracking-tight">What it does</h2>
            <p className="mt-3 text-neutral-700">
              Your digital menu becomes a polite, always-on server. It answers questions, recommends what guests love, and adapts
              to season and time of day. You keep full control: approve copy, photos, and special rules.
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 md:col-span-3">
            {LANDING.features.map((feature) => (
              <li
                key={feature.title}
                className="relative rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-600">
                  ✓
                </span>
                <h3 className="font-medium">{feature.title}</h3>
                <p className="mt-1 text-sm text-neutral-600">{feature.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-semibold tracking-tight">Where it shines</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {LANDING.useCases.map((useCase) => (
            <div key={useCase.name} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h3 className="font-medium">{useCase.name}</h3>
              <p className="mt-1 text-sm text-neutral-600">{useCase.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12" id="pricing">
        <div className="grid items-center gap-8 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Simple pricing</h2>
            <p className="mt-2 text-neutral-700">
              Month-to-month. Cancel anytime. Onboarding is a one-time fee based on menu size.
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200 p-6">
            <div className="text-5xl font-semibold tracking-tight">
              ${LANDING.priceMonthly}
              <span className="align-super text-lg">/mo</span>
            </div>
            <p className="mt-1 text-sm text-neutral-500">Flexible pricing tailored to your menu size.</p>
            <a
              href={LANDING.calendlyUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center rounded-2xl bg-neutral-900 px-5 py-3 text-sm text-white shadow-sm hover:bg-neutral-800"
            >
              {LANDING.primaryCtaLabel}
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12" id="faq">
        <h2 className="text-2xl font-semibold tracking-tight">FAQ</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {LANDING.faqs.map((faq) => (
            <details key={faq.q} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <summary className="cursor-pointer list-none font-medium">{faq.q}</summary>
              <p className="mt-2 text-sm text-neutral-600">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-4 py-10 text-sm text-neutral-500">
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-neutral-200 pt-6">
          <p>© {new Date().getFullYear()} TCC Solutions. All rights reserved.</p>
          <a href="#faq" className="hover:text-neutral-800">FAQ</a>
        </div>
      </footer>
    </main>
  )
}


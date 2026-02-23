/* eslint-disable @next/next/no-img-element */
export const metadata = {
  title: 'TCC Menus',
  description:
    'The future of restaurant menus: smart QR menus, optional dine-in ordering, kitchen workflow, and admin analytics — all from one QR.',
}

const LANDING = {
  calendlyUrl: 'https://calendly.com/tccsolutions2025/30min',
  primaryCtaLabel: 'Book Onboarding',
  contactEmail: '',
  logo: '/assets/tcc-logo-horizontal.png',
  qrDemo: '/assets/tcc-demo-qr.png',
  demoUrlLabel: 'tccmenus.com/demo',
}

export default function Landing() {
  return (
    <main className="bg-white text-neutral-950">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-50 to-white" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-24">
          <div>
            <h1 className="font-semibold tracking-tight" style={{ fontSize: 'clamp(2.1rem, 4.8vw, 3.75rem)' }}>
              The Future of Restaurant Menus
            </h1>
            <p className="mt-4 text-lg text-neutral-700">
              The easiest way to manage menus, ordering, and kitchen workflow — all from one QR.
            </p>
            <p className="mt-3 text-sm text-neutral-600">No POS overhaul required. Integrates when you want it to.</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href={LANDING.calendlyUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-2xl bg-neutral-950 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800"
              >
                {LANDING.primaryCtaLabel}
              </a>
              <a
                href="/demo"
                className="inline-flex items-center rounded-2xl border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-950 shadow-sm hover:bg-neutral-50"
              >
                Try Live Demo
              </a>
            </div>
            <p className="mt-4 text-xs text-neutral-500">
              Menu editing • optional table-number dine-in ordering • kitchen display • admin analytics
            </p>
          </div>
          <div className="relative">
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-center">
                <img src={LANDING.logo} alt="TCC Menus" className="w-full max-w-[320px]" loading="lazy" decoding="async" />
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-5">
                <div className="md:col-span-3">
                  <div className="mx-auto w-full max-w-[360px] rounded-[2.25rem] border border-neutral-200 bg-neutral-950 p-2 shadow-sm">
                    <div className="rounded-[1.85rem] bg-white p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold text-neutral-950">Menu</div>
                        <div className="rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-neutral-700">
                          Dine‑In • Table 12
                        </div>
                      </div>

                      <div className="mt-3 space-y-2">
                        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                          <div className="text-xs font-semibold text-neutral-950">Ahi Tartare</div>
                          <div className="mt-1 text-[11px] text-neutral-600">Ask AI: “Is this gluten‑free?”</div>
                        </div>
                        <div className="flex justify-end">
                          <div className="max-w-[75%] rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-[11px] text-neutral-800 shadow-sm">
                            AI: “Based on your menu, it’s listed with …”
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-center text-[11px] font-semibold text-neutral-950">
                            Add to Plate
                          </div>
                          <div className="rounded-xl bg-neutral-950 px-3 py-2 text-center text-[11px] font-semibold text-white">
                            Checkout
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="text-sm font-semibold text-neutral-950">See it live</div>
                  <p className="mt-1 text-xs text-neutral-600">Scan the demo QR on your phone.</p>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="grid h-28 w-28 place-items-center rounded-xl border border-dashed border-neutral-300 bg-white">
                      <img
                        src={LANDING.qrDemo}
                        alt="Demo menu QR"
                        className="h-full w-full rounded-xl object-contain"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div className="text-xs text-neutral-500">{LANDING.demoUrlLabel}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-4 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm md:grid-cols-4">
          {[
            { title: 'Smart QR Menu', body: 'Modern, fast, mobile‑first menus that stay up to date.' },
            { title: 'Optional Dine‑In Ordering', body: 'Guests can enter a table number and order from their phone.' },
            { title: 'Kitchen Display System', body: 'Orders flow to the kitchen: New → Preparing → Ready.' },
            { title: 'Admin Analytics (Bonus)', body: 'See top items, ordering patterns, and operational insights.' },
          ].map((x) => (
            <div key={x.title} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-950 text-sm font-semibold text-white">
                  {x.title === 'Smart QR Menu' ? '▦' : x.title === 'Optional Dine‑In Ordering' ? '⌁' : x.title === 'Kitchen Display System' ? '▤' : '▣'}
                </span>
                <div className="text-sm font-semibold text-neutral-950">{x.title}</div>
              </div>
              <p className="mt-2 text-sm text-neutral-700">{x.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid items-start gap-8 md:grid-cols-5">
          <div className="md:col-span-2">
            <h2 className="text-2xl font-semibold tracking-tight">What TCC Menus does</h2>
            <p className="mt-3 text-neutral-700">
              A clean guest experience + a practical kitchen workflow — built to modernize without forcing a POS replacement.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:col-span-3">
            {[
              {
                title: 'Modern QR Menu',
                body: 'Fast, mobile‑first menus that are always up to date.',
              },
              {
                title: 'Smart Menu Assistant',
                body: 'Guests ask about ingredients, allergens, and recommendations — answered from your menu data (not the internet).',
              },
              {
                title: 'Optional Dine‑In Ordering',
                body: 'Enable table‑number ordering when you want a low‑contact, high‑efficiency workflow.',
              },
              {
                title: 'Kitchen Display System',
                body: 'Orders flow to the kitchen in real time: New → Preparing → Ready.',
              },
            ].map((card) => (
              <div key={card.title} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-neutral-950">{card.title}</h3>
                <p className="mt-2 text-sm text-neutral-700">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid items-start gap-8 md:grid-cols-5">
          <div className="md:col-span-2">
            <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
            <p className="mt-3 text-neutral-700">Simple for guests. Practical for kitchens.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:col-span-3">
            {[
              { step: '1', title: 'Scan', body: 'Guests open your menu instantly.' },
              { step: '2', title: 'Ask + Order', body: 'They ask questions, customize items, and place dine‑in (table number) or pickup orders.' },
              { step: '3', title: 'Kitchen runs the board', body: 'Orders appear on the KDS and move New → Preparing → Ready.' },
              { step: '4', title: 'Admins get insights', body: 'Analytics helps reduce waste and increase sales (bonus feature).' },
            ].map((card) => (
              <div key={card.step} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-neutral-950 text-sm font-semibold text-white">
                    {card.step}
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-950">{card.title}</h3>
                </div>
                <p className="mt-2 text-sm text-neutral-700">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-6 rounded-3xl border border-neutral-200 bg-neutral-50 p-6 shadow-sm md:grid-cols-3">
          {[
            {
              title: 'Modernize without replacing your POS',
              body: 'Use TCC Menus on its own, or integrate when you’re ready. No overhaul required.',
            },
            {
              title: 'Reduce staff stress',
              body: 'Fewer questions. Fewer mistakes. Faster service — without changing the vibe of your restaurant.',
            },
            {
              title: 'Run a cleaner, smarter kitchen',
              body: 'Real‑time tickets, clear statuses, and a board designed to keep service moving.',
            },
          ].map((x) => (
            <div key={x.title} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-neutral-950">{x.title}</h3>
              <p className="mt-2 text-sm text-neutral-700">{x.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">See it in action</h2>
            <p className="mt-2 text-neutral-700">A quick look at the full guest → kitchen → admin flow.</p>
          </div>
          <a
            href="/demo"
            className="hidden items-center rounded-2xl border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-950 shadow-sm hover:bg-neutral-50 md:inline-flex"
          >
            Try the Live Demo
          </a>
        </div>

        <div className="mt-6 -mx-4 overflow-x-auto px-4">
          <div className="flex min-w-max gap-4 pb-2">
            {[
              { label: 'Menu browsing', top: 'Menu', badge: '' },
              { label: 'AI Q&A', top: 'Ask AI', badge: '' },
              { label: 'Add to Plate', top: 'Plate', badge: '' },
              { label: 'Table number entry', top: 'Dine‑In', badge: 'Table 12' },
              { label: 'Checkout', top: 'Checkout', badge: '' },
              { label: 'KDS', top: 'Kitchen', badge: 'New → Ready' },
              { label: 'Admin analytics', top: 'Admin', badge: 'Insights' },
            ].map((frame) => (
              <div key={frame.label} className="w-[230px] shrink-0">
                <div className="rounded-[2.1rem] border border-neutral-200 bg-neutral-950 p-2 shadow-sm">
                  <div className="rounded-[1.7rem] bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-semibold text-neutral-950">{frame.top}</div>
                      {frame.badge ? (
                        <div className="rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-neutral-700">
                          {frame.badge}
                        </div>
                      ) : (
                        <div className="h-5 w-10 rounded-full bg-neutral-100" />
                      )}
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="h-8 rounded-xl border border-neutral-200 bg-neutral-50" />
                      <div className="h-8 rounded-xl border border-neutral-200 bg-neutral-50" />
                      <div className="h-8 rounded-xl border border-neutral-200 bg-neutral-50" />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-neutral-200 bg-white py-2 text-center text-[10px] font-semibold text-neutral-950">
                        Action
                      </div>
                      <div className="rounded-xl bg-neutral-950 py-2 text-center text-[10px] font-semibold text-white">
                        Next
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs font-medium text-neutral-700">{frame.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 md:hidden">
          <a
            href="/demo"
            className="inline-flex w-full items-center justify-center rounded-2xl border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-950 shadow-sm hover:bg-neutral-50"
          >
            Try the Live Demo
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12" id="pricing">
        <div className="grid items-center gap-8 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Simple, transparent pricing</h2>
            <p className="mt-2 text-neutral-700">Month‑to‑month. No contracts.</p>
            <p className="mt-2 text-sm text-neutral-600">
              Pricing is shared during onboarding so we can tailor it to your menu size and workflow.
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
            <div className="text-sm font-semibold text-neutral-950">Ready to launch?</div>
            <p className="mt-1 text-sm text-neutral-700">Book onboarding and we’ll tailor the setup to your restaurant.</p>
            <a
              href={LANDING.calendlyUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex items-center rounded-2xl bg-neutral-950 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800"
            >
              {LANDING.primaryCtaLabel}
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12" id="faq">
        <h2 className="text-2xl font-semibold tracking-tight">FAQ</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            {
              q: 'Do I need to replace my POS?',
              a: 'No. TCC Menus works on its own and integrates when you want it to.',
            },
            {
              q: 'Is dine‑in ordering required?',
              a: 'No. Dine‑in table‑number ordering is optional and can be turned on in the admin panel.',
            },
            {
              q: 'Does the AI use outside data?',
              a: 'No. It answers based on your menu data (not internet guesses).',
            },
            {
              q: 'Does it work on all devices?',
              a: 'Yes. Guests use any phone and any browser — no app required.',
            },
          ].map((faq) => (
            <details key={faq.q} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <summary className="cursor-pointer list-none font-medium">{faq.q}</summary>
              <p className="mt-2 text-sm text-neutral-600">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="mt-14 bg-neutral-950 text-neutral-200">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div>
              <div className="text-sm font-semibold text-white">TCC Menus</div>
              <p className="mt-2 max-w-lg text-sm text-neutral-300">
                Smart QR menus, optional dine‑in table ordering, and a real kitchen workflow — all from one QR.
              </p>
              <p className="mt-3 text-xs text-neutral-400">Stripe Connect note: payments can be routed to the restaurant’s Stripe account when enabled.</p>
            </div>
            <div className="grid gap-2 text-sm">
              <a href="/terms" className="hover:text-white">
                Terms
              </a>
              <a href="/privacy" className="hover:text-white">
                Privacy
              </a>
              <a href={LANDING.calendlyUrl} target="_blank" rel="noreferrer" className="hover:text-white">
                Contact
              </a>
              <a href="#faq" className="hover:text-white">
                FAQ
              </a>
            </div>
          </div>
          <div className="mt-10 border-t border-neutral-800 pt-6 text-xs text-neutral-400">
            © {new Date().getFullYear()} TCC Solutions. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  )
}

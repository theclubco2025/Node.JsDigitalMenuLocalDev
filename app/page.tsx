/* eslint-disable @next/next/no-img-element */
export const metadata = {
  title: 'TCC Menus',
  description:
    'QR menu + online ordering and a kitchen display (beta) — plus menu editing, orders, and analytics for restaurants.',
}

const LANDING = {
  calendlyUrl: 'https://calendly.com/tccsolutions2025/30min',
  primaryCtaLabel: 'Book Demo',
  priceMonthly: 75,
  priceDisclaimer: 'From $75/month. One-time onboarding based on menu size. No POS overhaul. QR-ready in days.',
  logo: '/assets/tcc-logo-horizontal.png',
  qrDemo: '/assets/tcc-demo-qr.png',
  demoUrlLabel: 'tccmenus.com/demo',
  features: [
    {
      title: 'QR menu',
      body: 'Mobile-first menu that looks great on phones. Tags, prices, and sections stay clean and consistent.',
    },
    {
      title: 'AI menu Q&A',
      body: 'Guests ask questions and get answers based on your menu data (not internet guesses).',
    },
    {
      title: 'Menu editor',
      body: 'Owners can edit the menu in Admin and see changes instantly (no redeploy).',
    },
    {
      title: 'Ordering + KDS (beta)',
      body: 'Optional online ordering with a clean kitchen board for “New → Preparing → Ready”.',
    },
    {
      title: 'Orders + refunds',
      body: 'Track paid orders and handle common support flows from the admin side.',
    },
    {
      title: 'Analytics (beta)',
      body: 'See top items, pickup vs dine-in, and what guests are asking most.',
    },
  ],
  faqs: [
    {
      q: 'Do I have to replace my POS?',
      a: 'No. Your POS stays. TCC runs a web menu (and optional ordering) that can be used alongside your existing workflow.',
    },
    {
      q: 'How fast can we launch?',
      a: 'Most menus are live in 2–5 days depending on complexity and assets.',
    },
    {
      q: 'Do guests order and the kitchen gets tickets?',
      a: 'Yes — ordering + the kitchen display is available now as a beta. It’s production-usable, and we’re still improving polish and edge cases as we onboard more restaurants.',
    },
    {
      q: 'How do menu updates work?',
      a: 'Owners edit the menu in Admin and changes show up instantly (no redeploy). We can also help with onboarding and structure.',
    },
    {
      q: 'Is there a contract?',
      a: 'Month-to-month. Cancel anytime. Keep your exported menu data.',
    },
    {
      q: 'Is AI always correct?',
      a: 'AI answers may be inaccurate. For allergies and dietary needs, guests should confirm with staff.',
    },
  ],
}

export default function Landing() {
  return (
    <main className="bg-neutral-50 text-neutral-900">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-100 to-white" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Ordering + KDS <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px]">beta</span>
            </div>
            <h1 className="mt-4 font-semibold tracking-tight" style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)' }}>
              QR menu + online ordering that actually works in a kitchen.
            </h1>
            <p className="mt-4 text-lg text-neutral-700">
              Guests scan, ask questions, and place orders. The kitchen runs a clean board: New → Preparing → Ready.
              Keep your POS — no overhaul.
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
                className="inline-flex items-center rounded-2xl bg-emerald-600 px-5 py-3 text-white shadow-sm hover:bg-emerald-500"
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
                  className="w-full max-w-[180px]"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="mt-4 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-700">
                <p className="font-medium">Scan the live demo QR to see it in action.</p>
                <div className="mt-3 flex items-center gap-4">
                  <div className="grid h-36 w-36 place-items-center rounded-md border border-dashed border-neutral-300 text-neutral-400">
                    <img
                      src={LANDING.qrDemo}
                      alt="Demo menu QR"
                      className="h-full w-full rounded-md object-contain"
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
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid items-start gap-8 md:grid-cols-5">
          <div className="md:col-span-2">
            <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
            <p className="mt-3 text-neutral-700">
              The flow is simple for guests and practical for kitchens. Ordering + KDS is available now as a beta.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 md:col-span-3">
            {[
              {
                step: '1',
                title: 'Guest scans QR',
                body: 'They open a fast menu on their phone and can ask questions as they browse.',
              },
              {
                step: '2',
                title: 'Places an order (beta)',
                body: 'Pickup or dine-in ordering with a clear confirmation experience.',
              },
              {
                step: '3',
                title: 'Kitchen runs the KDS',
                body: 'Orders appear on a board and move New → Preparing → Ready in real time.',
              },
            ].map((card) => (
              <div key={card.step} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-neutral-900 text-sm font-semibold text-white">
                    {card.step}
                  </div>
                  <h3 className="font-medium">{card.title}</h3>
                </div>
                <p className="mt-2 text-sm text-neutral-600">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid items-start gap-8 md:grid-cols-5">
          <div className="md:col-span-2">
            <h2 className="text-2xl font-semibold tracking-tight">What’s included (today)</h2>
            <p className="mt-3 text-neutral-700">
              A premium QR menu with admin tools. Optional ordering + KDS is marked beta so expectations stay honest.
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              AI answers may be inaccurate. For allergies and dietary needs, confirm with staff.
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 md:col-span-3">
            {LANDING.features.map((feature) => (
              <li key={feature.title} className="relative rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
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
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight">Ordering + Kitchen Display (beta)</h2>
              <p className="mt-2 text-neutral-700">
                This is the part that turns your menu into a real workflow: guests place orders and the kitchen sees them
                instantly on a board designed for speed.
              </p>
              <ul className="mt-4 grid gap-2 text-sm text-neutral-700">
                <li>
                  <span className="font-semibold">What it does:</span> New/Preparing/Ready columns, clear item lists, and
                  live status updates.
                </li>
                <li>
                  <span className="font-semibold">What’s “beta”:</span> we’re still tightening edge cases and continuing
                  UI polish as we onboard more restaurants.
                </li>
              </ul>
            </div>
            <div className="w-full max-w-sm rounded-2xl border border-emerald-200 bg-white p-5">
              <div className="text-sm font-semibold text-neutral-900">Try it end-to-end</div>
              <p className="mt-1 text-sm text-neutral-600">
                Open the demo menu, add to plate, and go through checkout to see the flow.
              </p>
              <a
                href="/demo"
                className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-white shadow-sm hover:bg-emerald-500"
              >
                Open Demo
              </a>
            </div>
          </div>
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
          <a href="#faq" className="hover:text-neutral-800">
            FAQ
          </a>
        </div>
      </footer>
    </main>
  )
}

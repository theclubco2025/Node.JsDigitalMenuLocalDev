/* eslint-disable @next/next/no-img-element */
export const metadata = {
  title: 'TCC Menus',
  description:
    'Modern QR menu + online ordering + a kitchen-ready KDS — plus AI Q&A, menu editing, orders, refunds, and analytics for restaurants.',
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
      body: 'Guests ask questions and get answers based on your menu data (not internet guesses) — helpful for ingredients, allergens, and recommendations.',
    },
    {
      title: 'Menu editor',
      body: 'Owners can update items, prices, and availability in Admin — changes go live instantly.',
    },
    {
      title: 'Ordering + Kitchen Display',
      body: 'Online ordering with a clean kitchen board that runs the service: New → Preparing → Ready.',
    },
    {
      title: 'Orders + refunds',
      body: 'Track paid orders, update statuses, and handle common support flows securely from Admin.',
    },
    {
      title: 'Analytics',
      body: 'See what’s selling, what guests ask the AI, and practical insights to reduce waste and improve the menu.',
    },
    {
      title: 'SMS “Ready” alerts (beta)',
      body: 'Optional text notifications when an order is ready (pending carrier verification / Twilio verification).',
    },
  ],
  faqs: [
    {
      q: 'Do I have to replace my POS?',
      a: 'No. Your POS stays. TCC runs a web menu + ordering + kitchen display that fits alongside your existing workflow.',
    },
    {
      q: 'Where do payments go?',
      a: 'To the restaurant’s Stripe account via Stripe Connect. You stay in control of payouts and reporting.',
    },
    {
      q: 'Can you integrate with my POS?',
      a: 'Yes — POS integration is optional and available for Square and Clover (API-based). When enabled, taxes and receipts can follow POS rules.',
    },
    {
      q: 'How fast can we launch?',
      a: 'Most menus are live in 2–5 days depending on complexity and assets.',
    },
    {
      q: 'Do guests order and the kitchen gets tickets?',
      a: 'Yes. Guests order from their phone and the kitchen sees paid orders instantly on a clean board designed for speed.',
    },
    {
      q: 'How do menu updates work?',
      a: 'Owners edit the menu in Admin and changes go live instantly. We handle onboarding and structure so it stays clean and consistent.',
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
              Built for real kitchens
            </div>
            <h1 className="mt-4 font-semibold tracking-tight" style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)' }}>
              QR menu + ordering that feels modern — and runs like a kitchen tool.
            </h1>
            <p className="mt-4 text-lg text-neutral-700">
              Guests scan, ask questions, customize, and place orders. The kitchen runs a clean board: New → Preparing → Ready.
              Payments go to the restaurant’s Stripe (Connect). Optional POS integrations for Square and Clover.
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
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-neutral-600">
              {[
                'Stripe Connect payouts',
                'Kitchen-ready KDS',
                'Optional Square/Clover POS integration',
                'Admin analytics to reduce waste',
              ].map((t) => (
                <span key={t} className="rounded-full border border-neutral-200 bg-white px-3 py-1 shadow-sm">
                  {t}
                </span>
              ))}
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
            <h2 className="text-2xl font-semibold tracking-tight">Your menu may be the same. Guest expectations aren’t.</h2>
            <p className="mt-3 text-neutral-700">
              Your menu hasn’t changed in decades — your customers have. Today’s guests expect speed, clarity, and
              confidence when they order.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 md:col-span-3">
            {[
              {
                title: 'Fewer questions',
                body: 'AI Q&A helps guests understand ingredients, allergens, and what to order — before they flag down staff.',
              },
              {
                title: 'Cleaner tickets',
                body: 'Guests can customize and leave clear notes so the kitchen gets it right the first time — without back-and-forth.',
              },
              {
                title: 'Smarter decisions',
                body: 'Analytics shows what’s selling and what’s confusing guests — built for reducing waste and improving the menu.',
              },
            ].map((card) => (
              <div key={card.title} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <h3 className="font-medium">{card.title}</h3>
                <p className="mt-2 text-sm text-neutral-600">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid items-start gap-8 md:grid-cols-5">
          <div className="md:col-span-2">
            <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
            <p className="mt-3 text-neutral-700">
              The flow is simple for guests and practical for kitchens.
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
                title: 'Places an order',
                body: 'Pickup or dine-in ordering with clear confirmation and easy customization.',
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
              A premium QR menu with admin tools — built to sell more and run smoother service.
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
        <div className="grid gap-6 md:grid-cols-5">
          <div className="md:col-span-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
            <h2 className="text-2xl font-semibold tracking-tight">Ordering + Kitchen Display</h2>
            <p className="mt-2 text-neutral-700">
              Turn your menu into a workflow. Guests place paid orders from their phone, and the kitchen sees them instantly
              on a board designed for speed.
            </p>
            <ul className="mt-4 grid gap-2 text-sm text-neutral-700">
              <li>
                <span className="font-semibold">Kitchen clarity:</span> New/Preparing/Ready columns with clear item lists and live status updates.
              </li>
              <li>
                <span className="font-semibold">Payments:</span> processed through the restaurant’s Stripe account via Stripe Connect.
              </li>
              <li>
                <span className="font-semibold">POS integration (optional):</span> Square and Clover. When enabled, taxes and receipts can follow POS rules.
              </li>
              <li>
                <span className="font-semibold">SMS ready alerts:</span> available as a beta while carrier verification completes.
              </li>
            </ul>
          </div>
          <div className="md:col-span-2 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
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

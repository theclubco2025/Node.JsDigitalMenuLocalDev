# PlateHaven Onboarding Agent Prompt

**Read this file and `AGENTS.md` before touching any code.  
Then read `app/menu/page.tsx`, `app/api/menu/route.ts`, and one existing bespoke component (e.g. `components/TimmysBrownBagMenuClient.tsx`) to understand the live patterns.**

---

## Non-Negotiable Guardrails

- Work on **exactly one tenant slug** per session: `<slug>`. Touch no other tenants.
- Never read, write, or modify any other tenant's data files, component, or DB records — not even to "clean up."
- Never change Vercel settings, env vars, domains, Stripe, or Twilio unless explicitly asked.
- Never paste or commit real secrets/API tokens. Use placeholders like `<ADMIN_TOKEN>`.
- Stop and ask if any action could affect tenants other than `<slug>`.
- Branch name **must equal the tenant slug exactly** (e.g. branch `timmysbrownbag` for slug `timmysbrownbag`). The preview middleware reads the branch name as the tenant — a mismatch breaks preview deployments.

---

## Phase 0 — Research Before Writing a Single Line of Code

This phase eliminates the most common revision cycles. Do not skip it.

### 0a. Visit the client's real website
- Note the **exact brand colors** (primary, accent, background). Use hex codes from their actual site, not guesses.
- Note the **logo style** — is it text-only? icon + text? what proportions?
- Read the **personality/voice** of the copy: casual? quirky? upscale? deadpan? Chef-driven? Copy 2–3 phrases verbatim to capture their real tone.
- Look for a **real menu** on their site or social media.

### 0b. Read every uploaded file the client provided
- Open each image/PDF/photo using the Read tool before mapping it to a menu item.
- These are often **graphic cards** that list the full ingredient description — copy from the card, don't invent descriptions.
- Match images to items by reading the card text, not just the filename.
- If an image can't be matched to any item, note it — don't map it to the wrong item.
- If a menu item has no matching photo, leave it text-only. Never fake a photo mapping.

### 0c. Confirm the slug
- Slug rules: lowercase, hyphens only, matches the real business name closely.
- The slug must match the git branch name exactly.
- Example: business "Timmy's Brown Bag" → slug `timmysbrownbag` → branch `timmysbrownbag`.

---

## Phase 1 — Create the Branch

```powershell
git checkout -b <slug>
git push -u origin <slug>
```

Vercel auto-deploys each push as a preview URL. The preview URL is the primary review tool.

---

## Phase 2 — Scaffold Data Files

Create `data/tenants/<slug>/` with these files:

### `brand.json`
```json
{
  "name": "Restaurant Name",
  "logoUrl": "/assets/<slug>-logo.png",
  "header": {
    "mode": "logo",
    "logoUrl": "/assets/<slug>-logo.png"
  },
  "links": {
    "website": "https://theirsite.com",
    "phone": "+1 555-000-0000",
    "address": "123 Main St, City, CA 00000"
  }
}
```
**Do not add a `tagline` field.** The header should be logo-only — a tagline below the logo adds clutter that clients consistently ask to remove.

### `theme.json`
```json
{
  "name": "Restaurant Name",
  "tone": "<personality — see below>",
  "primary": "#hex",
  "bg": "#ffffff",
  "text": "#hex",
  "ink": "#hex",
  "card": "#ffffff",
  "muted": "#hex",
  "accent": "#hex",
  "radius": "22px"
}
```

**Colors:** Source from the real website. `primary` = main brand color. `accent` = secondary/contrast. `muted` = a very light version of a brand color, used for card borders and image backgrounds.

**`tone` field — this is the AI assistant's entire personality.** It is injected verbatim as `Tone: ${tone}` into the assistant system prompt via `lib/ai/prompt.ts`. Write it as a specific, vivid character description matching the real website's voice. Example:

> "quirky and playful, like the eccentric chef-owner who riffs on global mashup sandwiches with deadpan jokes and the occasional exclamation point — but always precise and accurate about ingredients, allergens, and prices"

Bad (too generic): `"friendly and helpful"` — this could be anyone. Match the actual brand.

### `copy.json`
```json
{
  "tagline": "One-line brand statement used in footer and meta.",
  "heroSubtitle": "Slightly longer subtitle for the hero section.",
  "categoryIntros": {
    "Category Name": "Short intro shown under the category heading."
  }
}
```

### `menu.json`
```json
{
  "categories": [
    {
      "id": "c-<category-slug>",
      "name": "Category Display Name",
      "items": [
        {
          "id": "i-<item-slug>",
          "name": "Exact Item Name from Menu",
          "description": "Ingredient list copied directly from the real menu card or website.",
          "price": 14.50,
          "tags": ["contains-meat", "contains-dairy", "addon:Add avocado|1.50"]
        }
      ]
    }
  ]
}
```

**Tag rules:**
- Dietary: `vegetarian`, `vegan`, `gluten-free`, `dairy-free`, `nut-free` — only if the menu explicitly states it.
- Allergen: `contains-meat`, `contains-dairy`, `contains-shellfish`, `contains-nuts` — infer from description.
- Upsell addons: `addon:Label|Price` — these surface as cart-drawer checkboxes. Add 1–3 per item where upsell makes sense (extra protein, add avocado, upgrade to truffle, etc.).
- **Never claim gluten-free / dairy-free / nut-free unless the client explicitly confirms it.**

**Item IDs:** `i-<item-slug>` format, kebab-case, no spaces. Must be stable — they're the join key for `images.json`.

### `images.json`
```json
{
  "i-item-id": "/assets/<slug>/filename.webp",
  "i-another-item": "/assets/<slug>/another.webp"
}
```
Only include items that have a real photo. Omit items with no photo — they render text-only cleanly.

---

## Phase 3 — Add the Billing Bypass

Open `app/api/menu/route.ts`. Find the `bypassActivation` line (it's a boolean expression of slug comparisons). Add the new slug:

```ts
const bypassActivation = tenant === 'existingslug' || tenant === '<slug>'
```

This lets the file-based tenant load without a DB row. Without this, the API returns 402 and the menu is blank.

---

## Phase 4 — Create the Bespoke UI Component

Every tenant gets its own component. **Do not modify `components/MenuClient.tsx`** — it is shared across all tenants and has hardcoded branding (e.g. the Italian-flag tricolor badge). Changing it would break live clients.

### 4a. Copy the closest existing bespoke component as a starting template

```
components/TimmysBrownBagMenuClient.tsx  ← good reference
```

Rename the default export and the file to match the new slug (PascalCase component name).

### 4b. Register the route in `app/menu/page.tsx`

Add before any other tenant or preview checks:
```tsx
import <Slug>MenuClient from '@/components/<Slug>MenuClient'

// in the render function:
if (tenant === '<slug>') {
  return <<Slug>MenuClient />
}
```

### 4c. What the component must do (working backend — never omit these)

The component must fetch its own data:
```tsx
const { data: cfg } = useSWR<TenantConfig>(`/api/tenant/config?tenant=${tenant}`, fetcher)
const { data: menuData } = useSWR<MenuResponse>(`/api/menu?tenant=${tenant}`, fetcher)
```

It must support:
- Cart state (add, remove, quantity)
- Checkout POST to `/api/orders/checkout`
- AI assistant POST to `/api/assistant`
- Admin inline edit mode (`?admin=1`)

These are already in `TimmysBrownBagMenuClient.tsx` — keep them intact when templating.

---

## Phase 5 — UI Standards (Apply These to Avoid Revision Cycles)

These standards were derived from real client feedback. Applying them upfront eliminates the most common iteration loops.

### Logo header
- Logo is the **only** thing in the sticky header — no tagline, no subtitle below it.
- Size: `h-36 sm:h-44 w-auto max-w-[92vw] object-contain` — clients always want it bigger than the first attempt.
- Background: white with a thick bottom border in the primary brand color.

### Cards
- White background, rounded corners (`borderRadius: 'var(--radius)'`).
- Light card border using `var(--muted)` (brand's light color, not gray).
- Subtle box shadow: `0 6px 18px rgba(0,0,0,0.06)`.
- Item layout order: image → bold name + price (right-aligned) → description → dietary tags → action buttons.
- Dietary tags: their own row, neutral gray pill chips — **not** mixed with buttons.
- One primary button: "Add to Bag" (or "Add to Cart") in `var(--accent)`.
- One secondary action: "Ask" as a plain underlined text link, not a button.

### Images
- Container: `w-full h-64 sm:h-56 md:h-48 flex items-center justify-center overflow-hidden` with `background: var(--muted)`.
- Image: `w-full h-full object-contain` — **not** `object-cover`.
- Reason: Many restaurant photo cards are text-heavy portrait graphics (ingredient lists). `object-cover` crops the text. `object-contain` always shows the full card with a branded letterbox.

### Search input — iOS zoom prevention
```tsx
style={{ border: '2px solid var(--muted)', fontSize: '16px' }}
```
iOS Safari zooms the page when a focused input has `font-size < 16px`. Always set it explicitly.

### Category chips — scroll nav, not filter
Category chips should scroll to the section and highlight via scroll-spy (`activeCategoryId`). They should **not** filter items out of view. A restaurant guest browsing the menu expects to scroll past all categories, not have items disappear.

```tsx
{categories.map(cat => (
  <button
    key={cat.id}
    onClick={() => scrollTo(`cat-${cat.id}`)}
    style={activeCategoryId === cat.id
      ? { background: 'var(--accent)', color: '#fff' }
      : { background: '#fff', color: 'var(--accent)', border: '2px solid var(--accent)' }
    }
  >
    {cat.name}
  </button>
))}
```

### Search — always include description
```tsx
const hit = item.name.toLowerCase().includes(q)
  || (item.description ?? '').toLowerCase().includes(q)
  || (item.tags || []).some(t => t.toLowerCase().includes(q))
```
Searching only `name` and `tags` misses ingredient-based queries (e.g. "peanut" won't find "Kung Pao Hot Links" unless description is searched).

### Footer
Include a local identity footer at the bottom of the menu:
```tsx
<div className="mt-12 pt-6 border-t text-center" style={{ borderColor: 'var(--muted)' }}>
  <p className="text-sm font-bold" style={{ color: 'var(--primary)' }}>
    {brandName} — {city}
  </p>
  <p className="text-xs text-gray-500 mt-1">{copy.tagline}</p>
</div>
```

### Upsell banner
When a sandwich/main is added without a side/drink, show a one-tap combo suggestion:
```tsx
{upsell && (
  <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-white rounded-2xl border-2 shadow-lg px-4 py-3 flex items-center gap-3 max-w-[92vw]"
    style={{ borderColor: 'var(--accent)' }}>
    <div className="text-sm">
      <span className="font-semibold" style={{ color: 'var(--ink)' }}>Make it a combo? </span>
      <span className="text-gray-600">Add {upsell.name} for ${Number(upsell.price ?? 0).toFixed(2)}</span>
    </div>
    <button onClick={() => { addToCart(upsell); setUpsell(null) }}
      className="px-3 py-1.5 rounded-full text-sm font-bold text-white whitespace-nowrap"
      style={{ background: 'var(--accent)' }}>Add</button>
    <button onClick={() => setUpsell(null)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
  </div>
)}
```

---

## Phase 6 — Photos

### Logo
- Place at `public/assets/<slug>-logo.png`
- Resize if over 300KB — large logos slow the header render on mobile.

### Meal photos
- Place at `public/assets/<slug>/<item-slug>.webp`
- Map in `images.json` using stable item IDs.
- If uploaded files land in the repo root (GitHub web UI upload), recover them with:
  ```bash
  git cat-file blob <hash> > public/assets/<slug>/<name>.webp
  ```
  Find hashes via `git ls-tree <upload-commit-sha>`.

---

## Phase 7 — Build Checklist Before Every Push

**ESLint is strict — a single unused variable fails the Vercel build.**
- Declare a variable only if it's used in JSX or logic.
- If you remove a feature (e.g. a tagline), remove its variable declaration too.
- Never run `pnpm build` while `pnpm dev` is running — they share `.next/` and corrupt each other.
- Run `pnpm typecheck` before pushing if you can.

**Common build killers:**
```
Error: 'brandTagline' is assigned a value but never used.  @typescript-eslint/no-unused-vars
```
Fix: remove the declaration or use the variable.

---

## Phase 8 — Commit and Deploy

```powershell
git add data/tenants/<slug>/ public/assets/<slug>/ public/assets/<slug>-logo.png components/<Slug>MenuClient.tsx app/menu/page.tsx app/api/menu/route.ts
git commit -m "Add <BusinessName> tenant — file-based, bespoke UI, full menu + photos"
git push origin <slug>
```

Vercel builds the preview automatically. Preview URL format:
`https://<project>-<hash>-<org>.vercel.app/menu?tenant=<slug>`

Paste the preview URL to the client for review before merging to `main`.

---

## Phase 9 — Merge to Main (Go Live)

When the client approves the preview:

```powershell
git checkout main
git pull origin main
git merge <slug> --no-ff -m "Merge <slug>: go live at platehaven.app/<slug>"
git push origin main
```

Live URL: `https://platehaven.app/menu?tenant=<slug>`

---

## Phase 10 — Smoke Test

After main deploys (~60 sec):
- [ ] `GET https://platehaven.app/api/menu?tenant=<slug>` returns items (not 402)
- [ ] `GET https://platehaven.app/api/tenant/config?tenant=<slug>` returns brand/theme
- [ ] Menu loads at `platehaven.app/menu?tenant=<slug>` with correct logo and colors
- [ ] AI assistant answers a menu question in character (matching the `tone` you set)
- [ ] Search finds items by ingredient keyword (not just name)
- [ ] Category chips scroll to the correct section
- [ ] Mobile: no page zoom when tapping the search input
- [ ] Add an item to cart → checkout flow opens

---

## Quick Reference — File Map

```
data/tenants/<slug>/
  brand.json        ← name, logo URL, links
  theme.json        ← colors + AI tone (no tagline field here)
  copy.json         ← tagline, heroSubtitle, categoryIntros
  menu.json         ← categories → items (with tags + addon: upsells)
  images.json       ← { "i-item-id": "/assets/<slug>/photo.webp" }

public/assets/
  <slug>-logo.png   ← resized logo (< 300KB)
  <slug>/           ← meal photos as <item-slug>.webp

components/
  <Slug>MenuClient.tsx   ← bespoke UI (never touches shared MenuClient.tsx)

app/menu/page.tsx         ← add: if (tenant === '<slug>') return <SlugMenuClient />
app/api/menu/route.ts     ← add slug to bypassActivation boolean
```

---

## What NOT to Do

- Do not modify `components/MenuClient.tsx` — shared, has hardcoded styling for other tenants.
- Do not add a tagline below the logo in the header — clients always remove it.
- Do not use `object-cover` on menu item images — crops text-heavy graphic cards.
- Do not set `font-size < 16px` on any `<input>` — iOS Safari zooms the whole page.
- Do not make category chips filter items — use scroll-to-section instead.
- Do not invent menu descriptions — copy from the real menu card or website.
- Do not claim dietary attributes (gluten-free, nut-free) unless the client confirms them.
- Do not commit unused variables — ESLint will fail the Vercel build.
- Do not run `pnpm build` while `pnpm dev` is running.
- Do not add the slug to another tenant's `bypassActivation` line without checking isolation.

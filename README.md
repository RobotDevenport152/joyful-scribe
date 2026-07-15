# Pacific Alpacas — Luxury Alpaca E-Commerce Platform

A full-stack e-commerce platform for a New Zealand luxury alpaca fiber brand targeting Chinese high-net-worth consumers. Built end-to-end: storefront, checkout, grower portal, admin panel, AI chat assistant, and fiber traceability.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript | Component model fits the multi-role UI (storefront / grower / admin). Vite HMR made iteration fast. |
| Styling | Tailwind CSS + shadcn/ui | shadcn provides accessible, unstyled primitives; Tailwind handles brand tokens without fighting a component library's opinions. |
| Server state | TanStack React Query | Declarative cache with stale-time control. Product catalogue changes infrequently — 5-min stale time eliminates redundant DB hits without stale UI. |
| Backend | Supabase (PostgreSQL + Auth + Edge Functions) | Row-Level Security means access control lives in the database, not scattered across API handlers. Eliminates an entire class of privilege escalation bugs. |
| Payments | Stripe Checkout + Webhook | Checkout session offloads PCI scope. Order creation happens in the webhook handler after Stripe confirms payment — not at the "Place Order" click — so inventory is never decremented on failed payments. |
| AI Chat | Google Gemini 3.5 Flash (Edge Function) | Runs server-side so the API key never reaches the client. The Edge Function transforms Gemini's response to OpenAI format, making the ChatWidget provider-agnostic. |
| i18n | react-i18next | Two locales (zh/en). All strings in `src/i18n/index.ts`; locale state in React Context synced to i18next on every change so the language switcher updates all components atomically. |
| Currency | Live rates via Frankfurter API | Exchange rates fetched with a 6-hour stale time, with fallback to hardcoded values on failure. Prices stored in NZD only — conversions happen at render time. |

---

## Architecture Decisions

### Why Supabase over Firebase?

PostgreSQL gives real relational integrity. The grower credit system uses a trigger (`update_grower_balance`) that fires on every `grower_transactions` insert — you cannot accidentally corrupt a balance by forgetting to update it from application code. Firebase has no database triggers or foreign key constraints.

### Why orders are created in the webhook, not the checkout handler

The checkout handler creates a Stripe session and returns immediately. If the user closes the tab mid-payment, or Stripe's charge fails, no order exists in the DB. The `stripe-webhook` Edge Function creates the order only after receiving `checkout.session.completed` — the cryptographically verified signal that money changed hands. An idempotency table (`processed_webhook_events`) prevents duplicate processing if Stripe retries the webhook.

### Why React Query instead of Redux for server state

Server state (products, orders, growers) has different semantics from client state: it can become stale, it is shared across components, and mutations need to invalidate related queries. React Query models this correctly. Zustand is kept only for the cart (client-owned state that persists to localStorage) and is explicitly scoped to that domain.

### Why two i18n systems exist (and what was fixed)

The home section components used `react-i18next` while the rest of the app used a custom typed `t` object in `AppContext`. The home sections were broken because `import '@/i18n'` was missing from `App.tsx`, so i18next was never initialised. Fix: add the import and call `i18n.changeLanguage()` inside `AppContext.setLocale()` so both systems stay in sync when the user switches language.

### Row-Level Security as the primary access control

Every table has RLS enabled. The `has_role(user_id, role)` security-definer function is the single source of truth for permission checks across all policies. Frontend route guards (`<ProtectedRoute>`) are UX-only — a user who knows the URL can bypass them. The database policies cannot be bypassed regardless of what the client sends.

---

## Key Features

- **Bilingual storefront** — ZH/EN with full i18n, live currency switcher (NZD / CNY / USD)
- **Fiber traceability** — QR-scannable batch codes linking products to specific NZ farms, with 6-step processing chain visualisation
- **Grower portal** — Authenticated dashboard for NZ farmers: fiber batches, credit balance, transaction history
- **Admin panel** — Full back-office: products, orders, growers, fiber batches, promo codes, 6-month revenue chart
- **AI chat assistant** — In-page customer service powered by Gemini 3.5 Flash
- **Stripe payments** — Secure checkout with webhook-driven order creation and inventory decrement trigger
- **Sleep quiz** — Interactive product recommender

---

## Project Structure

```
src/
├── components/
│   ├── home/          # 9 homepage sections (hero → authority → science → fiber → process → certs → heritage → media → growers)
│   ├── cart/          # CartDrawer
│   ├── chat/          # ChatWidget (AI assistant)
│   └── ui/            # shadcn/ui primitives — never modified directly
├── contexts/
│   ├── AppContext.tsx  # locale, translations, recentlyViewed
│   └── CartContext.tsx # cart items, currency, promo code
├── hooks/
│   ├── useProducts.ts      # React Query + dbToLegacyProduct mapper with live exchange rates
│   ├── useExchangeRates.ts # Live rates from Frankfurter API, 6h stale time
│   └── useGrowerCredits.ts # Grower balance + transaction history
├── pages/
│   ├── admin/         # Admin panel (role-gated)
│   └── ...            # Storefront + grower portal pages
├── lib/
│   ├── i18n.ts        # Typed translation object used by AppContext
│   ├── schemas.ts     # Zod validation schemas (checkout, contact, batch code)
│   └── store.ts       # Currency types, formatPrice, EXCHANGE_RATES fallback
└── integrations/supabase/
    ├── client.ts      # Singleton Supabase client
    └── types.ts       # Auto-generated DB types — used throughout, no any[]

supabase/
├── functions/
│   ├── create-checkout/  # Stripe Checkout session creation
│   ├── stripe-webhook/   # Order creation after payment confirmed + signature verification
│   └── chat/             # Gemini API proxy, transforms response to OpenAI format
└── migrations/           # Append-only PostgreSQL migrations
```

---

## Local Setup

```bash
# 1. Clone and install
git clone https://github.com/RobotDevenport152/joyful-scribe.git
cd joyful-scribe
npm install

# 2. Configure environment
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
# from your Supabase project dashboard → Settings → API

# 3. Start dev server
npm run dev        # http://localhost:8080

# 4. Run tests
npm run test       # 42 unit tests
npm run lint       # ESLint
```

---

## Deploy to Vercel

```bash
npx vercel --prod
# Add in Vercel dashboard → Settings → Environment Variables:
# VITE_SUPABASE_URL
# VITE_SUPABASE_PUBLISHABLE_KEY
```

`vercel.json` is pre-configured for SPA client-side routing.

---

## Current Status (2026-07-09)

**Live deployment:** https://pacific-alpaca-website.vercel.app — connected to the production Supabase project (`pymnquyxpoeqkkuzzial`). Stripe checkout is verified end-to-end (real orders and webhook events already exist in the database), and `create-checkout` now prices every item from the `products` table server-side rather than trusting the client.

**Blocking cutover:**
- Custom domain `pacificalpacas.com` is still not attached to this Vercel project (currently only `pacific-alpaca-website.vercel.app` and its team alias) — needs to be added in Vercel → Settings → Domains, then DNS repointed at the registrar. **The live domain is still serving the old WordPress/WooCommerce site**, entirely unrelated to this codebase — until the domain is moved, nothing deployed here is publicly reachable at pacificalpacas.com.
- Conversely, the live site's only two WooCommerce categories are `duvets` and `carpets` — the rebuild's Supabase catalogue also has `coat`, `vest`, `sweater`, and `scarf`/baby products that don't exist on the live site at all. Confirm with the client whether these are an intentional new product expansion before launch, since customers won't recognize them from the current site.

**Recently fixed:**
- `create-checkout` no longer trusts client-supplied prices/exchange rates — looks up `products.price_nzd` server-side (price-tampering fix).
- **Added per-variant pricing.** `size_options` entries can now carry their own `price_nzd`; `dbToLegacyProduct` maps this into `variants[].prices`, and a new `getItemPrices(cartItem)` helper (`src/lib/store.ts`) is the single place price is read from for a cart line — used by `CartContext`, `CartDrawer`, and `Checkout.tsx` instead of the base product price. `ProductDetail.tsx` shows a price range ("$840 – $10,286") until a size is picked, then the exact price for that size. `create-checkout` independently resolves the authoritative price server-side from `size_options[].price_nzd` and rejects any item whose `variant` doesn't match a real size — the client's price is still never trusted, now for variants too.
- **All 20 Suri alpaca carpets now have real per-size pricing** ($840–$10,286 across all 11 sizes, matching the live site's WooCommerce variation prices exactly), so they're sale-ready.
- Homepage grower-network map dots now link out to their nearest NZ region on Google Maps (previously inert decoration).
- 3 duvet products (`all-seasons`, `spring-autumn-duvet`, `summer-duvets`) had an empty `images` array — fixed directly in the live DB.
- All 20 Suri alpaca carpets added to the catalogue (`carpet-akaroa` … `carpet-waikato`, real SKUs `RUG01`–`RUG20`, matching names/descriptions/photos from the live WordPress Store API).
- Desktop nav was missing a way to reach secondary pages (traceability, wholesale, compare, returns, China landing, my orders, admin) — added a "More" dropdown next to the primary nav links (`src/components/Navbar.tsx`).
- The dev-mode Supabase stub client (used automatically when `VITE_SUPABASE_URL` isn't set) was missing `auth.onAuthStateChange`/`getSession` and several query builder methods (`ilike`, `gte`, etc.), which threw uncaught errors and rendered blank pages on `/my-orders`, `/admin`, and the traceability search. The stub now covers the methods the app actually calls (`src/integrations/supabase/client.ts`).
- Closed 5 of the 6 gaps below found against the live site (carpet category scaffolding, Chinese size variants, address correction, Grower Login CTA, Code of Welfare text, GST pricing note) — see "Gap analysis" for what's still open.

### Gap analysis vs. the live pacificalpacas.com site

A side-by-side review of the real production site (WordPress/WooCommerce) against this rebuild surfaced:

- ~~**Missing product line** — the live site sells 20 handmade Suri alpaca carpets ($840–$10,286 each)~~ Fixed: all 20 added to Supabase with real names/SKUs/photos from the live site, now with correct per-size pricing matching the live site exactly.
- ~~**Missing size variants** — live duvets offer 9 sizes~~ Fixed: `DUVET_SIZE_VARIANTS` in `store.ts` now lists all 5 NZ standard + 4 Chinese standard sizes, applied to all three duvet tiers.
- ~~**Incorrect postal address**~~ Fixed: Footer and Contact page now show `P.O. Box 28684, Remuera, Auckland 1541`, matching the live site.
- ~~**Missing Albany office**~~ Fixed: Footer now lists the North Island office (Building B, 14-22 Triton Drive, Albany); Contact page's building/street number corrected to match.
- ~~**Missing Code of Welfare compliance text**~~ Fixed: the attestation requirement is now reproduced on the Growers page collection-points tab.
- ~~**No visible "Grower Login" CTA**~~ Fixed: added Join Now / Buy Fibre / Grower Login buttons to the growers page hero.
- Also added the "prices are NZD, inclusive of GST" disclosure (not on the original gap list, but noticed on the live product page) to `ProductDetail.tsx` and the checkout summary.
- Confirmed correct: brand tagline, "Cloud of Dreams" product naming, and social media links all match the live site.
- **Still open — needs verification before launch:** CGTN media coverage and Hurun Report awards are referenced as required trust signals for the Chinese market, but do not appear anywhere on the current live site (re-checked 2026-07-09); get the actual source material from the client before publishing these claims.
- **Still open:** the Certificate of Licence link now points to the real PDF hosted on the live site (`pacificalpacas.com/wp-content/uploads/...`) rather than hosting our own copy — fine short-term, but should be replaced with a copy we control if the live site's file ever moves.

---

## Tests

42 tests across 3 files:

| Area | Count |
|---|---|
| `formatPrice` — NZD / CNY / USD formatting | 5 |
| `EXCHANGE_RATES` — fallback range validation | 3 |
| `dbToLegacyProduct` — field mapping, exchange rate application, image fallback | 9 |
| `checkoutSchema` — name, email, phone, payment method, gift message | 7 |
| `contactSchema` — required fields, message length | 3 |
| `batchCodeSchema` — PA-YYYY-NNN regex | 5 |
| Cart store — add, deduplicate, discount, clear | 8 |
| Placeholder | 1 |

```bash
npm run test          # single run
npm run test:watch    # watch mode
```

---

## Database Schema

Tables: `products`, `orders`, `order_items`, `growers`, `fiber_batches`, `grower_transactions`, `promo_codes`, `user_roles`, `processed_webhook_events`

Key constraints:
- All prices stored in NZD only (`price_nzd`) — display conversions never touch the DB
- Grower credit balances maintained by a DB trigger on `grower_transactions` insert, never updated directly
- Stock decremented by trigger when `orders.status` changes to `'paid'`
- RLS enabled on every table; `has_role()` security-definer function centralises admin checks

---

## Security Notes

- **Stripe webhook**: signature verified with `stripe.webhooks.constructEventAsync()` before any DB write
- **API keys**: Gemini and Stripe keys exist only in Supabase Edge Function secrets, never in the client bundle
- **Auth**: Supabase JWT; frontend route guards are UX-only — RLS is the actual enforcement layer
- **SQL injection**: Supabase client uses parameterised queries throughout; no raw string concatenation

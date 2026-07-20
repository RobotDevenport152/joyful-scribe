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
| AI Chat | Google Gemini 3.5 Flash (Edge Function) | Runs server-side so the API key never reaches the client. The Edge Function transforms Gemini's response to OpenAI format, making the ChatWidget provider-agnostic. Has real order lookup and persistent multi-turn history for logged-in customers. |
| i18n | react-i18next | Two locales (zh/en). All strings in `src/i18n/index.ts`; locale state in React Context synced to i18next on every change so the language switcher updates all components atomically. |
| Currency | Live rates via Frankfurter API | Exchange rates fetched with a 6-hour stale time, with fallback to hardcoded values on failure. Prices stored in NZD only — conversions happen at render time. |
| Error monitoring | Sentry | Auto-initialized in production builds only (`src/lib/sentry.ts`), so local dev never burns quota. Catching and used to diagnose real production incidents (see Current Status). |
| Transactional email | Resend (Edge Function) | Order confirmation emails, including per-unit anti-counterfeit certificate codes; also powers the contact/wholesale form notifications. |
| SMS notifications | Twilio (Edge Function) | Order-confirmed and order-shipped SMS. Fully gated on three secrets being configured — a no-op until then, so it ships ahead of the Twilio account existing. |
| WeChat login | WeChat Official Account OAuth (Edge Function) | Bridges WeChat's web OAuth into a real Supabase session for customers browsing inside WeChat's in-app browser. Built and tested; pending real AppID/AppSecret credentials. |
| CI/CD | GitHub Actions | Separate jobs for lint/unit-test/type-check/dependency-audit, Playwright e2e, Supabase Edge Function deploy, and Vercel production/preview deploy — each deploy job gated behind the test job passing first. |
| E2E Testing | Playwright | Smoke test suite (`tests/e2e/smoke.spec.ts`) run in CI against a real production-config build before every deploy, and again against every PR's Vercel preview deployment. |
| Resilience | `fetchWithRetry` (`supabase/functions/_shared/retry.ts`) | Exponential backoff with full jitter, applied to every third-party call in the request path (Resend, Twilio, Gemini, WeChat OAuth). Retries network errors, 429, and 5xx before the caller's existing fallback (best-effort log-and-swallow for email/SMS, a friendly error for chat) kicks in. |
| Accessibility | `eslint-plugin-jsx-a11y` + `@axe-core/playwright` | Static JSX-level checks run in `npm run lint` (non-blocking — new rule category, same debt-visibility pattern as the `any` downgrades below); `tests/e2e/accessibility.spec.ts` runs axe against `/`, `/shop`, `/login` in CI and fails the build on critical/serious violations. `color-contrast` is excluded pending a dedicated design pass — the brand's gold accent text fails AA almost everywhere it's used (~2.6:1 of a required 4.5:1), and fixing it means darkening on-brand colors, not a code-only change. |

---

## Architecture Layers

Six layers, each mapped to where the code actually lives (not a theoretical N-tier diagram):

| # | Layer | Where it lives | Responsibility |
|---|---|---|---|
| 1 | Presentation | `src/components`, `src/pages` | React UI for all four surfaces — storefront, checkout, grower portal, admin panel. |
| 2 | Client state & data access | `src/contexts`, `src/stores`, `src/integrations/supabase`, `src/lib` | Locale/currency/cart state (Context + Zustand), React Query's server-state cache, the typed Supabase client, and business-logic helpers (certificate generation, WeChat helpers, i18n, Zod schemas). |
| 3 | Edge Functions (backend compute) | `supabase/functions/*` | 7 Deno serverless functions: `create-checkout`, `stripe-webhook`, `chat`, `recommend`, `notify-shipped`, `wechat-auth`, `bright-task`. No always-on server — each request cold-starts a function. |
| 4 | Data & persistence | `supabase/migrations` (45 files) | PostgreSQL schema, Row-Level Security policies, and triggers (e.g. `update_grower_balance`) — access control lives here, not in application code. |
| 5 | Third-party services | Stripe, Resend, Twilio, Google Gemini, WeChat, Frankfurter | Payments, transactional email/SMS, AI chat, OAuth, and live currency rates — external systems this app calls out to, not owned code. |
| 6 | Infrastructure & delivery | `infra/terraform` (Cloudflare + Vercel), `.github/workflows` | DNS/domain/CDN (Cloudflare), hosting (Vercel), and CI/CD gates (lint, unit tests, type-check, Playwright e2e, accessibility scan, dependency audit) before any deploy. |

Sentry and Vercel Analytics are cross-cutting rather than a layer of their own — they observe all six rather than sitting in the request path of any single one.

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

### Why third-party calls retry instead of failing once

Every Edge Function that talks to a third party does so synchronously inside the request path — a dropped connection to Resend used to mean a silently lost order-confirmation email, not a retried one. `fetchWithRetry` wraps those calls with up to 2 retries and exponential backoff with full jitter (jitter so concurrent invocations under load don't all retry in lockstep against an already-struggling API). It's deliberately not a circuit breaker: at this traffic volume, a per-call retry budget is enough, and a stateful breaker would need shared state across Edge Function invocations that don't share memory.

### Accessibility: what's fixed vs. tracked debt

An axe/jsx-a11y pass fixed the concrete, code-only bugs: unlabeled icon buttons (nav hamburger, cart, password toggles, quick-add-to-cart), unassociated form `<label>`s across every form on the site (`htmlFor`/`id` were simply missing — visually present labels that screen readers never announced), a hardcoded `lang="en"` that never updated when a user switched to Chinese, weak focus indicators on hand-rolled inputs, and no reduced-motion support despite heavy `framer-motion` use (`MotionConfig reducedMotion="user"` fixes this app-wide). `color-contrast` is intentionally left failing in the new CI gate — the brand's gold accent text is only ~2.6:1 against its backgrounds where AA requires 4.5:1, and correcting that means darkening on-brand colors used throughout the site, which needs design sign-off rather than a code fix.

### Row-Level Security as the primary access control

Every table has RLS enabled. The `has_role(user_id, role)` security-definer function is the single source of truth for permission checks across all policies. Frontend route guards (`<ProtectedRoute>`) are UX-only — a user who knows the URL can bypass them. The database policies cannot be bypassed regardless of what the client sends.

---

## Key Features

- **Bilingual storefront** — ZH/EN with full i18n, live currency switcher (NZD / CNY / USD)
- **Fiber traceability** — QR-scannable batch codes linking products to specific NZ farms, with 6-step processing chain visualisation
- **Grower portal** — Authenticated dashboard for NZ farmers: fiber batches, credit balance, transaction history
- **Admin panel** — Full back-office: products, orders, growers, fiber batches, promo codes, 6-month revenue chart
- **AI chat assistant** — In-page customer service powered by Gemini 3.5 Flash, with real order lookup and persistent multi-turn history for logged-in customers
- **Stripe payments** — Secure checkout with webhook-driven order creation and inventory decrement trigger
- **Anti-counterfeit certificates** — One certificate code auto-generated per unit at checkout, surfaced in the order confirmation email and `/my-orders`, publicly checkable at `/verify`
- **Order notifications** — Confirmation email (Resend) always on; SMS (Twilio) for order-confirmed and order-shipped, shipping when configured
- **WeChat login** — OAuth bridge for customers inside WeChat's in-app browser (pending live credentials)
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
│   ├── create-checkout/  # Stripe Checkout session creation, server-side pricing
│   ├── stripe-webhook/   # Order + certificate creation after payment confirmed, signature verification, confirmation email/SMS
│   ├── chat/             # Gemini API proxy with order lookup, rate-limited
│   ├── recommend/        # Sleep-quiz product recommender, rate-limited
│   ├── wechat-auth/      # WeChat OAuth code exchange -> Supabase session
│   ├── bright-task/      # Contact/wholesale form emails (Resend)
│   └── notify-shipped/   # Admin-only: marks an order shipped + sends the shipped SMS
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
npm run test       # 59 unit tests
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

## Current Status (2026-07-19)

**Live in production:** https://pacificalpaca.com (custom domain cutover is complete — the old WordPress/WooCommerce site is fully replaced, no longer a blocker) plus `www.pacificalpaca.com` and the Vercel-assigned domains, all on the same project. Connected to the production Supabase project (`pymnquyxpoeqkkuzzial`, `ap-northeast-1`). Real customers are placing real orders through Stripe end-to-end. CI/CD (GitHub Actions) deploys both the frontend and Edge Functions automatically on every push to `master`.

**Monitoring:** Sentry is live in production (`src/lib/sentry.ts`) and has already been used to diagnose and fix real incidents — see below.

**Recently fixed (this week):**
- **Edge function CORS allowlists were missing `www.pacificalpaca.com`** (`create-checkout`, `chat`, `wechat-auth`, `bright-task`, `recommend`) — a customer landing on the `www.` variant had every request CORS-blocked, surfacing as a generic "Failed to send a request to the Edge Function." Root-caused via Sentry's Seer analysis on a real `checkout_failed` issue.
- **`useProduct()` always queried `products.id` first**, even for slug-based route params (AI chat links, SEO URLs) — threw a Postgres "invalid input syntax for type uuid" error on every single slug-based product page load before silently falling back. Now checks the param's shape up front.
- **Rate limiting on `chat`/`recommend`/`bright-task` was silently non-functional** — the `check_rate_limit()` migration was recorded as applied but had never actually run against the live database (confirmed via direct query; the function and its backing table didn't exist). Re-applied for real; these public, unauthenticated, paid-API-calling endpoints are now actually protected.
- **`verify_certificate()` silently rejected valid certificate codes** typed in lowercase/mixed case, and could return "not found" for a genuinely valid certificate if its product row was ever missing (`INNER` vs `LEFT` join bug).
- **`create-checkout`'s CORS allowlist had a typo** (`pacificalpacas.com`, plural) that had been silently blocking real checkouts for ~2 days — found via a real Sentry `checkout_failed` event plus zero successful orders in that window.
- Order-success page now surfaces certificate codes directly instead of only relying on the confirmation email; the confirmation email itself (Resend) now actually sends with the certificate codes included.
- Chat assistant now does real order lookups and keeps persistent multi-turn history, instead of a stateless per-message assistant with no order awareness.

**In progress:**
- **SMS notifications (Twilio)** — order-confirmed and order-shipped SMS code is shipped and deployed, gated on three Supabase secrets. Twilio account/number setup and end-to-end verification still pending.
- **WeChat Official Account login** — OAuth flow, Edge Function, and DB schema are all built; pending the real AppID/AppSecret from the account owner's WeChat backend, plus confirming the account is verified (required for the `snsapi_userinfo` scope this uses).

Full running log of everything found/fixed, including lower-priority open items (guest checkout decision, integration test coverage, etc.), lives in `PROJECT_STATUS.md`.

---

## Tests

59 tests across 4 files:

| File | Count | Covers |
|---|---|---|
| `business-logic.test.ts` | 43 | `formatPrice`, `CURRENCY_SYMBOLS`, `EXCHANGE_RATES` fallback, `dbToLegacyProduct`, `getItemPrices`, `checkoutSchema`, `contactSchema`, `batchCodeSchema` |
| `cartStore.test.ts` | 8 | Add, deduplicate, discount, clear |
| `certificate.test.ts` | 7 | `isCertificateCodeFormat`, `buildVerifyUrl` |
| `example.test.ts` | 1 | Placeholder |

```bash
npm run test          # single run
npm run test:watch    # watch mode
```

---

## Database Schema

Tables: `products`, `orders`, `order_items`, `checkout_sessions`, `product_certificates`, `product_reviews`, `growers`, `grower_applications`, `fiber_batches`, `grower_transactions`, `promo_codes`, `user_roles`, `wechat_identities`, `rate_limits`, `sleep_assessments`, `stock_notifications`, `processed_webhook_events`

Key constraints:
- All prices stored in NZD only (`price_nzd`) — display conversions never touch the DB
- Grower credit balances maintained by a DB trigger on `grower_transactions` insert, never updated directly
- Stock decremented by trigger when `orders.status` changes to `'paid'`
- One `product_certificates` row auto-generated per unit at checkout (`stripe-webhook`), linked via `order_id`; `verify_certificate()` is the public, case-insensitive lookup RPC behind `/verify`
- RLS enabled on every table; `has_role()` security-definer function centralises admin checks
- `check_rate_limit()` (service-role only) backs a `rate_limits` table protecting the public, unauthenticated `chat`/`recommend`/`bright-task` Edge Functions from abuse

---

## Security Notes

- **Stripe webhook**: signature verified with `stripe.webhooks.constructEventAsync()` before any DB write
- **API keys**: Gemini, Stripe, Resend, and Twilio keys exist only in Supabase Edge Function secrets, never in the client bundle (Sentry's DSN is the one exception — DSNs aren't secrets, they're meant to ship in the public bundle)
- **Auth**: Supabase JWT; frontend route guards are UX-only — RLS is the actual enforcement layer
- **SQL injection**: Supabase client uses parameterised queries throughout; no raw string concatenation
- **CORS**: every Edge Function that accepts browser requests validates `Origin` against an explicit allowlist (`pacificalpaca.com`, `www.pacificalpaca.com`, localhost, preview domains) rather than reflecting an arbitrary origin
- **Rate limiting**: public, unauthenticated Edge Functions that call paid third-party APIs (`chat`, `recommend`, `bright-task`) are protected by a per-key sliding-window limit enforced in the database

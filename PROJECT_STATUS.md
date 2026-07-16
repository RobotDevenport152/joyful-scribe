# Project Status — Known Issues

> Source: a full customer walkthrough of the live site (homepage → search → product
> detail → cart → checkout → traceability → lookbook → compare → contact), 2026-07-13.
> Updated as issues are found and fixed. Fixed items are struck through with the
> commit that resolved them; do not delete history — this file is the running log.

## Operational Notes — do this whenever asked to "check the project"

- **Sentry error monitoring is live in production** (added 2026-07-14). DSN is
  hardcoded in `src/lib/sentry.ts` (safe — DSNs aren't secrets, they ship in
  the public bundle) pointing at Sentry org `ben-po`, project
  `javascript-react`. Not routed through `VITE_SENTRY_DSN`/Vercel env vars
  because that path silently failed to take effect after repeated attempts —
  see git history around commit `d9a2e1d` if debugging why.
- **When a "check the project" / project-status request comes in, also check
  Sentry for new real errors** (the only issue on record as of 2026-07-14,
  `JAVASCRIPT-REACT-1` "`updateFrom`" TypeError, is Sentry's own auto-seeded
  onboarding sample, not a real bug — ignore it. Two real errors,
  `JAVASCRIPT-REACT-2`/`-3`, showed up 2026-07-15 — see Fixed below).
- **How to check**: the `claude.ai Sentry` MCP connector for this account
  keeps authorizing against an unrelated University of Auckland Sentry org
  no matter how many times it's reconnected (tried multiple full
  disconnect/reconnect cycles, incognito, logging out — never resolved).
  Don't waste time retrying that path. Instead, ask the user for a
  short-lived, read-only Sentry auth token (Settings → Auth Tokens in the
  `ben-po` org, scopes `org:read` + `project:read` + `event:read` only) and
  query the REST API directly, e.g.:
  ```
  curl -s "https://sentry.io/api/0/projects/ben-po/javascript-react/issues/?statsPeriod=14d" \
    -H "Authorization: Bearer <token>"
  ```
  Also useful: `GET /api/0/organizations/ben-po/projects/` (check `firstEvent`
  — `null` means no real events have ever landed). Never write the token
  itself into this file or any committed file; it's provided fresh each
  session and the user can revoke it after.

## P0 — Fix first (visible to every customer, or blocks purchase)

- [ ] **Checkout forces account creation/login before purchase** — `/checkout`
  is wrapped in `<ProtectedRoute>` (`App.tsx`), no guest checkout path exists.
  **On hold, needs a product decision from the user, not just a code fix**:
  this was my audit recommendation, not an explicit requirement, and any fix
  touches production payment code (`create-checkout` edge function's auth
  guard) and/or `checkout_sessions`/`orders` RLS. Options discussed with the
  user: (a) full anonymous guest checkout — biggest schema/RLS change; (b)
  "quick registration at checkout" — front-end drops the forced pre-login,
  `create-checkout` auto-creates a real account server-side via the Admin API
  when no JWT is present, no schema/RLS change needed, but still changes the
  edge function's auth logic from "JWT required" to "optional, else
  auto-provision." Complicated by **Confirm-email being ON** in Supabase Auth,
  so a client-side `signUp()` can't get an immediate usable session — hence
  needing the server-side Admin API approach for (b). User asked to pause and
  think about it further before implementing either option.

- [ ] **Local migration history doesn't reconstruct the real production
  schema — worse than "incomplete," it's actively wrong.** Found during a
  7-item self-audit (2026-07-16). Remote `supabase_migrations.schema_migrations`
  has 43 applied migrations; `supabase/migrations/` has only 31 files — 11
  exist only on remote, invisible to git. The most severe: the *very first*
  local migration (`20260328220859_...sql`) already creates a full
  `products`/`orders`/`user_roles`/etc. schema (3-value `app_role` enum:
  `admin, moderator, user`; denormalized `orders.items jsonb`, no
  `order_items` table). A remote-only migration named `core_schema`
  (version `20260408003807`, 8.5KB of SQL, no local file) later runs a plain
  `create table public.products (...)` — no `IF NOT EXISTS` — which could
  only succeed if the original tables had already been dropped outside of
  any tracked migration (no local file drops them either). Verified against
  the live DB: production's `orders` table and `app_role` enum
  (`admin, moderator, grower, customer`) match `core_schema`'s shape, not
  the original 20260328 one — confirming the schema really was replaced
  wholesale, invisibly. **Running `supabase db push`/`db reset` from this
  repo alone today would not fail loudly — it would silently produce a
  different, incompatible, long-obsolete schema.** The other 10 remote-only
  migrations: `fix_security` (RLS + search_path hardening, also
  2026-04-08), a duplicate-named `checkout_sessions` and
  `add_sku_to_products` pair (remote has an extra version of each under a
  different timestamp than the local file), `seed_first_admin_user`, 4 of
  the "advisor_fixes_batch1-4" perf/security migrations, and an earlier
  duplicate of `fix_certificate_code_pgcrypto_search_path` (applied to
  remote 2026-07-14 22:51 via dashboard/SQL editor, then re-applied a day
  later as a proper local migration on 2026-07-15 13:00 — byte-for-byte
  identical SQL, because whoever fixed it the second time had no way of
  knowing it was already patched — **this is the direct cause of the
  certificate-generation bug below**). **Not fixed** — reconstructing the 11
  missing migrations from `supabase_migrations.schema_migrations.statements`
  (all 11 already pulled and read once this session) is mechanical but has
  real subtleties (the duplicate-named pairs need reconciling, ordering
  matters), so it needs a explicit go-ahead before touching migration
  history, not a silent fix.

## P1 — Fix soon (real but lower-frequency impact)

- [ ] **No integration/RPC test coverage — DB function bugs can fail
  silently for months.** `src/test/certificate.test.ts` only tests two pure
  JS helpers (`isCertificateCodeFormat`, `buildVerifyUrl`); nothing anywhere
  calls `generate_certificate_code()` or exercises `product_certificates`
  end-to-end. A Playwright e2e smoke test already exists
  (`tests/e2e/smoke.spec.ts` — browse → cart → checkout) but **isn't wired
  into CI** — `.github/workflows/ci.yml` only runs `npm run lint`,
  `npm run test` (vitest), and `tsc --noEmit`. Not fixed — needs a decision
  on whether to add Playwright to CI (and how to handle its
  `TEST_EMAIL`/`TEST_PASSWORD`-gated login step in that environment) plus a
  new test that actually calls the certificate RPC.

- [ ] **No documented visual/content QA gate for product images.** The
  AI-generated fake product image issue (see Fixed below) was caught
  reactively, not via any process — grepped `CLAUDE.md`, `DEVELOPMENT_GUIDE.md`,
  and `.github/` for a checklist or PR template and found nothing. The fixes
  so far were scoped to whichever products someone happened to investigate
  (duvet tiers + vest-x6); there's no evidence all ~66 live products have
  ever been fully re-audited. Not fixed — no code change possible here, this
  needs a process decision (PR checklist item, admin-panel upload warning,
  periodic re-audit cadence, etc.).

- [ ] **`stripe-webhook/index.ts` still has 4 `any`-typed usages** (lines
  ~91, ~132) in the order-creation-from-webhook path — same class of issue
  as `create-checkout`'s pricing pipeline (fixed below), not yet addressed
  since it wasn't in scope of what was approved this session.

- [ ] **Hero video footage doesn't match "luxury sleep" positioning.** Current
  loop (`public/videos/promo.mp4`, 15–48s of source) shows warehouse/shearing
  footage — operationally authentic, but not evocative of the "全球深睡新标准 /
  Luxury in Your Dreams" headline sitting on top of it. (The separate
  legibility problem originally filed alongside this — "no scrim, hard to
  read" — turned out to have a different, now-fixed root cause; see Fixed
  below. This item is now only about the footage content itself, which needs
  either a different in/out point from the existing source videos in
  `public/videos/` or new footage — a creative/content call, and re-cutting
  needs `ffmpeg`, which isn't available in this environment.)

## Fixed

- [x] **Mainland China usability prep (2026-07-16), ahead of a brand
  meeting.** User did their own codebase pass looking for concrete,
  verifiable issues rather than waiting on vague feedback. Two items
  verified and fixed here (three more — Alipay not wired up despite
  showing in checkout, WeChat Pay not available via Stripe for a
  NZ-registered business, general Vercel/Cloudflare edge latency from
  mainland China — need a business decision first, not fixed):
  - **Checkout could be completed with zero shipping address.** Found
    while checking the first item below — not a China-specific issue, a
    real bug affecting every order. `checkoutSchema` (`src/lib/schemas.ts`)
    had `province`/`city`/`district`/`address` all `.optional()`, and
    `Checkout.tsx`'s field labels only marked Name/Phone/Email as required
    (`*`) — a customer could pay for a physical product with no way to
    ship it. Fixed: `province`/`city`/`address` now required (`district`
    stays optional — some regions don't use it), labels updated to match,
    and the same check added server-side in `create-checkout/index.ts`
    (the actual trust boundary — the frontend fix alone doesn't stop a
    direct API call from skipping these fields). Added 4 regression tests
    to `business-logic.test.ts` for the new requiredness (there was
    previously zero test coverage of this at all).
  - **Google Fonts loaded via a render-blocking `@import`** in
    `src/index.css` (`fonts.googleapis.com`) — Google domains are
    unreliably reachable from mainland China, one of this app's core
    markets, so this could cause slow page loads or invisible text for
    exactly the customers being targeted. Fixed by self-hosting via
    `@fontsource/cormorant-garamond` + `@fontsource/inter` (imported in
    `main.tsx`, bundled by Vite into `dist/assets/*.woff2`). Verified:
    built output has zero references to `fonts.googleapis.com`/
    `fonts.gstatic.com` anywhere, and a real browser check (Playwright
    against the production build's preview server) confirmed zero
    requests to Google font domains and both font families render with
    the correct computed `font-family`.
  - **Not the same thing, not touched**: Google Sign-In (OAuth via
    `SocialAuthButtons.tsx`) is a separate feature from Google Fonts and
    was not part of this fix — still works exactly as before (and is
    separately subject to the same mainland-China Google-domain
    reachability caveat, worth the brand knowing about, but out of scope
    here).

- [x] **Dead code from a 7-item self-audit (2026-07-16).** User reported 7
  suspected process/quality issues; this repo's part of the fix:
  - `src/components/GrowerNetworkSection.tsx` — stale duplicate of
    `src/components/home/GrowerNetworkSection.tsx` (missing the
    Sentry.ErrorBoundary fix, imported nowhere). Deleted.
  - `src/components/ErrorBoundary.tsx` — superseded by `Sentry.ErrorBoundary`
    used everywhere else. Deleted.
  - `src/pages/AuthPage.tsx` — superseded by `src/pages/Login.tsx` (the
    actual `/login` route target); AuthPage was never routed. Deleted.
  - `src/stores/uiStore.ts` — superseded by `AppContext`'s `locale` state.
    Deleted.
  - `src/components/storefront/LiveInventory.tsx` and
    `src/components/storefront/ProductJsonLd.tsx` — fully built but never
    wired in. Wired both into `src/pages/ProductDetail.tsx`: LiveInventory
    replaced the old inline stock-threshold text (adds live polling + an
    explicit "in stock" state that didn't exist before); ProductJsonLd
    (schema.org Product structured data — nothing like this existed on the
    page before) had its prop types rewritten to match the app's actual
    mapped Product shape (it expected raw snake_case DB columns) and its
    canonical URL fixed from a stale `/shop/:slug` to the real
    `/product/:slug` route, plus made image URLs absolute (Google Rich
    Results requires this). Verified live in a real browser via Playwright
    against the local dev server — JSON-LD renders correctly, zero console
    errors.
  - `src/components/storefront/CrossSell.tsx` — **left alone, not deleted or
    wired in.** It duplicates the "Customers Also Bought" section already in
    `ProductDetail.tsx`, which has better fallback behavior (blends in
    featured products when a category is thin; CrossSell just renders
    nothing). Wiring it in too would've shipped two overlapping
    related-products widgets on one page.
  - `create-checkout/index.ts`'s cart-pricing pipeline (`resolveUnitPriceNZD`,
    the subtotal `reduce`, `pricedItems`, Stripe `lineItems`/`sessionParams`)
    was entirely `any`-typed — added real interfaces (`CartItem`,
    `PricedItem`, `DbProduct`, `SizeOption`, `CheckoutRequestBody`) and used
    Stripe's own `Stripe.Checkout.SessionCreateParams`/`LineItem` types.
    One incidental behavior addition: `resolveUnitPriceNZD` now returns
    `null` if a product lookup ever misses (previously would have thrown) —
    a no-op today since the upstream `products.length !== productIds.length`
    check already guarantees this can't happen, but safer if that check
    ever changes. **Caveat: type-only change, verified only by ESLint (the
    `any`s are gone, 99→85 warnings) and manual review** — this directory
    isn't covered by `tsconfig.app.json` or CI's `tsc` step, and Deno isn't
    installed here, so `Stripe.Checkout.SessionCreateParams.LineItem` being
    a real type path is unconfirmed by any type-checker. Also: **the
    deployed edge function won't pick this up until someone runs
    `supabase functions deploy create-checkout`** — the CD job in
    `ci.yml` only deploys the frontend to Vercel, not Supabase functions.
  - Also fixed as part of the same audit: see the still-open P0/P1 entries
    above for migration drift, missing integration tests, and no visual QA
    gate — those are real findings, not yet fixed, don't let this entry
    read as if the whole audit is closed.

- [x] **Exchange-rate widget silently broken site-wide, spamming the console
  on every page** — `useExchangeRates.ts` called `api.frankfurter.app`,
  which now 301-redirects to `api.frankfurter.dev`; the redirect response
  itself carries no CORS headers, so the browser blocked it before
  following through, on every page load. Not customer-visible (the hook
  already falls back to hardcoded rates on fetch failure — that's exactly
  what was happening), but it was cluttering Sentry breadcrumbs on every
  event, including the checkout_failed traces below, making them noisier to
  read. Found via a full customer walkthrough of the live
  site (homepage -> shop -> product detail -> add to cart -> checkout ->
  traceability/growers-info/compare/contact/wholesale/culture/corporate-gifts)
  using Playwright against production, capturing console/network errors on
  every page. Fixed by calling `api.frankfurter.dev/v1/latest` directly.

- [x] **Checkout silently broken on the `pacific-alpaca-website.vercel.app`
  alias domain — CORS mismatch.** New Sentry issue `JAVASCRIPT-REACT-7`
  "checkout_failed", 2 events 2026-07-16 (two different logged-in users),
  both from that alias domain, both
  `"error":"Failed to send a request to the Edge Function"` — the generic
  message the Supabase client throws when a fetch is blocked before it gets
  a response, e.g. by CORS. Confirmed directly against production before
  touching anything: `OPTIONS /functions/v1/create-checkout` with
  `Origin: https://pacific-alpaca-website.vercel.app` returned
  `Access-Control-Allow-Origin: https://pacificalpaca.com` (mismatch, so the
  browser blocks it). `create-checkout`'s `isAllowedOrigin()` allows
  `pacificalpaca.com`, `localhost`, `*.lovable.app`, `*.lovableproject.com` —
  not the vercel.app alias — while `wechat-auth`'s allowlist already permits
  `*.vercel.app`. Also confirmed the alias domain wasn't redirected
  (`https://pacific-alpaca-website.vercel.app/` returned `200`, not a
  redirect). Presented the user three options: (a) exact-match allowlist
  just that host in `create-checkout` (code change, payment-adjacent); (b)
  redirect the alias to `pacificalpaca.com` so there's one canonical
  checkout surface and no CORS hole at all, no payment code touched; (c)
  leave as-is. **User chose (b).** Added a host-matched redirect in
  `vercel.json` (`has: [{ type: "host", value:
  "pacific-alpaca-website.vercel.app" }]` → `https://pacificalpaca.com/:path*`,
  permanent), scoped to that exact host so preview-deployment URLs
  (`*-<hash>-<team>.vercel.app`) are unaffected. `create-checkout` and the
  other edge functions' CORS allowlists were deliberately left untouched —
  no payment code changed.

- [x] **New Sentry error, single occurrence — `JAVASCRIPT-REACT-4`,
  `Error: Map container is already initialized`, culprit `_initContainer`
  in the `FarmMap` chunk (`src/components/growers/FarmMap.tsx`, the
  react-leaflet map shared by the homepage and `/growers-info`). First/only
  seen 2026-07-16T02:12 UTC, 1 event, 0 identified users, but disproportionately
  severe: the app's only `Sentry.ErrorBoundary` was at root level
  (`src/main.tsx`), so this widget-level crash was blanking the *entire
  page* to the generic "Something went wrong, please refresh" fallback. No
  repro was found for the underlying react-leaflet double-init (a known
  library failure mode when `L.map()` runs twice against the same DOM
  node), so rather than guess-fix that unconfirmed cause, contained the
  blast radius instead: added a local `Sentry.ErrorBoundary` around the
  `<Suspense><FarmMap /></Suspense>` block at both call sites
  (`src/components/home/GrowerNetworkSection.tsx`,
  `src/pages/GrowersInfo.tsx`), each with a small inline "map temporarily
  unavailable" fallback matching the section's existing loading-state
  styling. If this recurs, Sentry will still capture it (still wrapped by
  `Sentry.ErrorBoundary`, just scoped lower) — the rest of the page now
  survives it.

- [x] **Stale-tab chunk load failures after a deploy** — Sentry showed two real
  errors (`JAVASCRIPT-REACT-2`, `JAVASCRIPT-REACT-3`, 2026-07-15), both
  `TypeError: Failed to fetch dynamically imported module` for the
  `FarmMap` chunk (`src/components/growers/FarmMap.tsx`, lazy-loaded on the
  homepage and `/growers-info`). Root cause: a browser tab open across a
  deploy still references the old build's hashed chunk filenames; once the
  new deploy removes those files, a lazy `import()` for one 404s. Fixed by
  listening for Vite's `vite:preloadError` event in `src/main.tsx` and
  reloading the page once (a `sessionStorage` flag prevents a reload loop
  if the fetch keeps failing). Also removed a stray duplicate of
  `20260329100000_add_growers_user_id.sql` that existed both at the repo
  root and in `supabase/migrations/` — harmless but dead weight.

- [x] **AI-generated fake webpage mockups used as product images — wider than
  first scoped.** Same class of bug previously found and fixed for
  `coat-classic` (commit `d311094`). Initial audit found 3 files; investigating
  the fix surfaced the same `image` (legacy singular column) vs `images`
  (JSONB array) staleness pattern across all 3 duvet tiers, plus a second,
  distinct sub-case on `vest-x6` where the array's own primary was fake.
  Confirmed with the user (screenshot-by-screenshot) before writing the DB
  migration, per the standing rule of never treating unconfirmed-provenance
  photos as final.
  - `duvet-luxury` / `duvet-classic` / `duvet-premium`: the `images` array's
    primary photo was already correct (fixed in an earlier session), but the
    legacy `image` column was never updated to match — so anywhere reading
    `product.image` directly (`BrandHeritageSection.tsx`, `ChinaLanding.tsx`,
    the local fallback catalogue in `src/lib/store.ts`) still rendered the old
    fake mockup. Synced `image` to the array's real primary for all three.
  - `vest-x6`: the `images` array's own primary (`product-vest-x6.jpg`, the
    Shop-grid thumbnail — the most-seen image on the site after the homepage)
    was itself the fake mockup, and a second array entry
    (`product-vest-x6-front.jpg`) was a mislabeled runway photo of a *coat*
    captioned as the vest. Reassigned the array's primary to a real gift-bag
    photo (`product-vest-x6-giftbag.jpg`) and dropped the mislabeled coat
    entry from the array entirely.
  - Fixed two hardcoded direct references that bypassed the DB entirely:
    `BrandHeritageSection.tsx`'s "Cloud of Dreams" story image and its
    4-photo `GALLERY` array's vest entry; the same two spots duplicated in
    `ChinaLanding.tsx`, plus its "coming soon" Alpaca Topper placeholder image.
  - Migration: `supabase/migrations/20260713190000_fix_stale_product_images.sql`
    (commit `65b2a29` — **run this migration's SQL manually in the Supabase
    SQL Editor**; it is not applied automatically).

- [x] **Traceability page (`/traceability`) landing state was mostly blank**
  below the search box until a batch number was entered. Added an always-visible
  "How Traceability Works" section (the real 6-step process data that already
  existed but was previously only shown after a successful search) so the
  empty state has substantive content instead of whitespace. (commit `322a40d`)

- [x] **Untranslated enum leaks into UI**: `处理状态: ready` and `等级: royal`
  were rendering the raw DB enum value instead of a translated label — found
  in both `ProductTraceability.tsx` (product detail / cart traceability block)
  and `Traceability.tsx` (the dedicated lookup page, which had the same leak
  for `grade` in addition to `processing_status`). Added zh/en label maps and
  used them in both places. (commit `322a40d`)

- [x] **Site-wide: the entire `pa-*` custom color namespace (`pa-navy`,
  `pa-ivory`, `pa-gold`, `pa-gold-lt`) was never defined in
  `tailwind.config.ts`.** This is the real root cause of the hero headline
  looking illegible — `text-pa-ivory` on the H1 was a no-op class, so the
  headline silently fell back to the inherited near-black `--foreground`
  color and rendered as dark text directly on the hero video, not a scrim
  problem. The same undefined classes are used throughout
  `FarmStorySection.tsx` (its entire dark navy/ivory section) and
  `CrossSell.tsx`'s price text, so this had site-wide reach on the homepage,
  not just the hero. Fixed by adding a `pa` color group to
  `tailwind.config.ts` that reuses the existing `--navy`/`--cream`/`--gold`/
  `--gold-light` CSS variables (so `pa-ivory` = `--cream`, etc.) — no new
  colors invented, just wiring up tokens that were already designed for this
  exact purpose. Also added a real `.hero-overlay` CSS rule (it too was
  referenced in `HeroSection.tsx` but never defined, so no scrim was ever
  actually applied) as defence-in-depth for legibility against bright frames.
  (commit `7106ce0`)

- [x] **FarmStorySection step icons were dead decoration** (just a static
  number badge) instead of links. Removed the numbers and made each icon
  link to the page that covers that step (farm -> `/growers-info`,
  shearing/processing/craftsmanship -> `/traceability`, luxury product ->
  `/shop`). (commit `4323c0b`)

- [x] **i18n copy read as literally-translated marketing fluff in both
  directions** — e.g. hero eyebrow "引领天然睡眠材料革命" / "Leading the Natural
  Sleep Material Revolution" and fiber section "会呼吸的软黄金" / "The Breathing
  Soft Gold" sounded like machine translation, not brand voice, undermining
  trust. Reworked hero/brand/fiber/process/certs copy in `i18n/index.ts`
  plus the inline copy in `FarmStorySection.tsx` and
  `BrandHeritageSection.tsx`'s "Cloud of Dreams" block to be warmer and
  story-driven in both languages, while leaving every factual claim (cert
  numbers, percentages, brand names, historical facts) untouched. **This is
  only the homepage** — a full-site grep found ~573 more inline `zh`/`en`
  string pairs across 40 files (product pages, checkout, account pages,
  etc.) not yet reviewed; treat this as an ongoing pass, not a completed
  audit. Also strengthened two related trust-signal UI gaps:
  `AuthorityBanner.tsx`'s badge strip had no heading (read as decoration, not
  certification), and `CertificationBadges.tsx` hid cert numbers behind a
  hover-only tooltip that doesn't reliably work on touch devices — both now
  show their trust info without requiring hover. (commit `0f24e85`)
  - **Not done**: the broader "generic AI-template look" UI concern raised
    alongside this — that's a visual design pass (layout/spacing/component
    styling), separate from copy or trust-signal visibility, and hasn't been
    scoped or started yet.

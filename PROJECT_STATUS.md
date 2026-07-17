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
- **As of the 2026-07-17 check**, `JAVASCRIPT-REACT-2` through `-8` are all
  accounted for: `-2`/`-3` (FarmMap chunk-load) and `-4` (Map container
  re-init) predate the `a396b83`/`de17cdf` fixes and haven't recurred; `-7`
  (`checkout_failed` from the vercel.app alias) predates the `de17cdf`
  redirect and hasn't recurred either. `-5`/`-6`/`-8` (Contact/Shop/
  ProductDetail stale-chunk errors) **did recur after** the `e85826a`
  reload-on-preload-error fix — root cause and fix below. `-2`/`-3`/`-4`/`-7`
  marked resolved in Sentry via the API (commit `f931bcf`'s session);
  `-5`/`-6`/`-8` deliberately left unresolved until the `f931bcf` fix is
  confirmed live in production, and `-1` left alone (known Sentry sample).
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

- [x] **Local migration history didn't reconstruct the real production
  schema — worse than "incomplete," it was actively wrong.** Found during a
  7-item self-audit (2026-07-16), reconciled 2026-07-17 with explicit
  go-ahead. **Read this split carefully — it's two different facts, not
  one:**

  **Done: local migration *history* now matches remote exactly.** Pulled
  fresh state before touching anything (things can drift between sessions):
  remote `supabase_migrations.schema_migrations` had 42 applied migrations,
  local had 31 files, 11 remote-only. Wrote all 11 as local `.sql` files,
  generated programmatically from `schema_migrations.statements` (not
  retyped by hand — the whole point was faithfulness) at their real
  timestamps, including both members of every duplicate-named pair
  (`checkout_sessions`, `add_sku_to_products`, three `advisor_fixes_batchN`
  pairs, `fix_certificate_code_pgcrypto_search_path`, `wechat_identities` —
  each pair genuinely is two independently-applied migrations on remote,
  not a mistake to collapse). Re-diffed programmatically after writing:
  42 local versions, 42 remote versions, zero discrepancy either direction.
  Confirmed nothing written here reflects guesswork — every file's content
  came directly from the authoritative `schema_migrations` table.

  **Not done, and can't be done from tracked history alone: a from-scratch
  rebuild still doesn't work.** Didn't take that on faith — ran the actual
  discriminating test: `supabase start` (local Docker Postgres, zero
  contact with production) replaying every migration in order. It fails,
  confirming the original finding empirically rather than just by
  inspection: `core_schema` (`20260408003807`) runs a bare
  `create table public.growers (...)` with no `IF NOT EXISTS`, and errors
  `relation "growers" already exists` — because the *original* schema
  (`20260328220859`, 3-value `app_role`, denormalized `orders.items jsonb`)
  already created it, and whatever dropped the original tables before
  `core_schema` recreated them was never captured in any tracked
  migration, local or remote. That gap is real and, from migration history
  alone, unrecoverable — the actual `DROP` was executed directly against
  the database outside of migration tracking, at a moment nothing here has
  a record of. **Deliberately did not paper over this with a hand-written
  synthetic drop migration**: even a correct one wouldn't be sufficient —
  `20260714120018` (one of the 11 just added) runs `ALTER POLICY ... ON
  public.product_reviews` and calls `can_review_product()`, but
  `product_reviews` isn't created until the later `20260714130000`. Fixing
  one forward-reference without knowing whether others exist is exactly
  the kind of guess that could quietly introduce a *new* silent divergence
  — the same class of bug this whole item is about. A real from-scratch
  rebuild needs a dedicated pass with the local DB up, fixing errors one at
  a time as `db reset` surfaces them, verifying each fix against actual
  replay rather than reasoning about the SQL — not something to rush
  through as a side effect of a history-reconciliation pass.

  **What this does fix today, concretely**: local `supabase/migrations/`
  now enumerates the same 42 versions as production, so schema-drift
  tooling (e.g. a future `supabase db diff` CI check) has an accurate
  baseline to compare against, and nobody reads this repo's migration
  folder and reasonably concludes it's the complete history — it now is,
  even though replaying it from zero still isn't possible yet.

  Verified via `supabase migration list --linked` was attempted and hit
  the same CLI-auth wall documented elsewhere in this file (`LegacyProjectNotLinkedError`)
  — the version-set diff above (done via direct comparison against
  `list_migrations`, not the CLI) is the actual verification instead, and
  is equivalent to what that command would have shown.

## P1 — Fix soon (real but lower-frequency impact)

- [ ] **Migration history can't be replayed from scratch yet** (split off
  from the reconciliation work above, 2026-07-17, so it doesn't get lost in
  that entry's prose). Confirmed via an actual local `supabase start` +
  migration replay, not just reasoning: fails at `core_schema`
  (`relation "growers" already exists" — an untracked `DROP` that happened
  outside any migration, sometime between the original schema and
  `core_schema` replacing it, with no record anywhere of what exactly ran).
  There's likely at least one more failure past that — `20260714120018`
  references `product_reviews`/`can_review_product()` before
  `20260714130000` creates them — and possibly others not yet discovered,
  since replay stops at the first error. Needs a dedicated session with a
  local Supabase instance running: fix one `db reset` failure at a time,
  re-run, repeat until a fresh reset actually succeeds, verified by the
  tool each time rather than assumed. Not urgent — production itself is
  fine and unaffected either way — but real: today, disaster recovery or
  spinning up a genuinely fresh environment from this repo alone would not
  work.

- [ ] **No integration/RPC test coverage — DB function bugs can fail
  silently for months.** `src/test/certificate.test.ts` only tests two pure
  JS helpers (`isCertificateCodeFormat`, `buildVerifyUrl`); nothing anywhere
  calls `generate_certificate_code()` or exercises `product_certificates`
  end-to-end. ~~A Playwright e2e smoke test already exists
  (`tests/e2e/smoke.spec.ts` — browse → cart → checkout) but isn't wired
  into CI~~ — **fixed (2026-07-17)**: added an `e2e` job to
  `ci.yml` that builds against pulled preview env vars, serves it, and runs
  the suite, gating `deploy-production` on it (`deploy-preview` stays
  ungated so reviewer preview links don't slow down). Along the way found
  `playwright.config.ts`'s `testDir` pointed at a `playwright/` directory
  that's never existed — the suite was undiscoverable by a plain
  `npx playwright test` even locally; fixed to `tests/e2e`. Still not fixed:
  a new test that actually calls the certificate RPC, and the suite's
  `TEST_EMAIL`/`TEST_PASSWORD`-gated login continuation has no secrets set
  in CI yet, so it exercises browse → cart → checkout-redirect but skips the
  post-login continuation until those two repo secrets are added.

- [ ] **No documented visual/content QA gate for product images.** The
  AI-generated fake product image issue (see Fixed below) was caught
  reactively, not via any process — grepped `CLAUDE.md`, `DEVELOPMENT_GUIDE.md`,
  and `.github/` for a checklist or PR template and found nothing. The fixes
  so far were scoped to whichever products someone happened to investigate
  (duvet tiers + vest-x6); there's no evidence all ~66 live products have
  ever been fully re-audited. Not fixed — no code change possible here, this
  needs a process decision (PR checklist item, admin-panel upload warning,
  periodic re-audit cadence, etc.).

- [ ] **WeChat Pay is not available through Stripe for a NZ-registered
  business** (2026-07-16, confirmed against Stripe's own docs — NZ isn't on
  Stripe's WeChat Pay eligible-country list, unlike Alipay, which
  specifically includes NZ and is now wired up, see Fixed above). This is a
  real processor constraint, not neglect or an unfinished integration —
  worth surfacing to the brand as exactly that framing. Needs a business
  decision, not a code fix: (a) add a different payment processor that
  supports WeChat Pay for NZ-to-China (e.g. Airwallex, which markets this
  specifically) alongside Stripe; (b) register a business entity in a
  country Stripe does support for WeChat Pay; (c) accept the gap and lean
  on Alipay + card as the mainland-facing payment options. The WeChat Pay
  button in checkout is currently shown but disabled ("Coming soon") rather
  than removed, so it's a one-line UI change once a direction is picked.

- [x] ~~`stripe-webhook/index.ts` still has 4 `any`-typed usages~~ (lines
  ~91, ~132) in the order-creation-from-webhook path — **fixed (2026-07-17)**:
  added `StoredCheckoutItem`/`CheckoutSessionRow` interfaces matching the
  exact shape `create-checkout` writes into `checkout_sessions.items`, same
  read-result-cast pattern already used for `create-checkout`'s `DbProduct`
  reads. Same caveat as that earlier fix: type-only change, verified via
  ESLint (85→81 warnings) and `tsc --noEmit`, not a real Deno type-check
  (still not installed here) — and, like `create-checkout`, the deployed
  edge function won't pick this up until someone runs
  `supabase functions deploy stripe-webhook`.

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

- [ ] **Two more dead files found while fixing image lazy-loading (2026-07-17)**,
  same pattern as the 2026-07-16 dead-code audit's `GrowerNetworkSection`/
  `ErrorBoundary`/`AuthPage`/`uiStore` finds — not deleted here, out of scope
  for what was being worked on: `src/pages/Admin.tsx` (a standalone admin
  page, entirely superseded by `AdminLayout` + `pages/admin/*` — not
  imported or routed anywhere in `App.tsx`) and
  `src/components/cart/CartDrawer.tsx` (a duplicate of the real, actually-used
  `src/components/CartDrawer.tsx` imported by `PublicLayout.tsx` — zero
  references to the `cart/` one anywhere). Both confirmed via grep, not
  deleted since deleting wasn't asked for.

- [x] ~~Responsive/next-gen product images~~ — investigated then built
  (2026-07-17: queried the live `products` table, confirmed every image is
  a static `/images/*.jpg` file with no admin upload path that could
  produce a remote URL, so a build-time approach fully covers today's
  catalog with no new recurring cost — see the Fixed section below for
  what got built).

## Fixed

- [x] **Added post-deploy health check + automatic rollback to `ci.yml`
  (2026-07-17)**, at the user's request after asking how CI/CD could keep
  being strengthened. The `e2e` job already gates *before* a deploy, but
  can't catch problems that only exist on real production infrastructure —
  exactly the class of bug that broke the new crawler-metadata middleware
  twice this same session (a Cloudflare 403, a cache-poisoning bug —
  neither would show up in a local/CI build). New `verify-production` job
  runs after `deploy-production`: waits for edge propagation, checks the
  live homepage actually serves real content, and if not, rolls back to
  the exact production deployment that was live immediately before this
  one (captured via a new `capture_previous` step at the *start* of
  `deploy-production`, before it gets replaced — `vercel rollback` in this
  CLI version needs an explicit deployment id/url, there's no bare "undo
  the last one" form). Uses `v7/deployments` with `rollbackCandidate=true`
  (not `v6`) and reads the `id` field, not `uid` — confirmed against real
  data from this session's own diagnostic work, not guessed. A rollback
  still fails the job on purpose (loud, emails the repo's Actions
  notification recipients) — the point is "stop the bleeding
  automatically, then make sure a human notices," not silently paper over
  a bad deploy. Deliberately did **not** attempt "automatically fix the
  bug" — safe automated remediation here means reverting to known-good,
  not letting anything rewrite code unsupervised on a payment-processing
  site.

  **Still open, needs the user to provide something before it can be
  built**: Edge Function auto-deploy is fully scaffolded already (see the
  `deploy-functions` job) but inert until a `SUPABASE_ACCESS_TOKEN` repo
  secret exists; full login→checkout e2e coverage is similarly gated on
  `TEST_EMAIL`/`TEST_PASSWORD` secrets (a dedicated test account). Neither
  can be added by an agent directly — GitHub's secret-write API needs a
  token this session doesn't have, and secrets should be added by the
  user directly in any case, not relayed through chat.

- [x] **New `/product/:id` crawler-metadata middleware (`middleware.ts`,
  started this session per the platform audit's "Later" tier SSR item —
  a Vercel Routing Middleware that serves correct per-product
  `og:title`/`og:image`/etc. to known social-crawler user agents only,
  leaving real users' SPA untouched) went through two real bugs before it
  actually worked in production, both caught by checking the live
  deployment directly rather than trusting a green build.**

  **Bug 1 — cache poisoning.** The first version's crawler response set
  `Cache-Control: public, max-age=300, s-maxage=3600` — a *shared* cache
  directive, which both Vercel's edge cache and Cloudflare in front of it
  key by URL, not User-Agent, by default. A real browser's plain request
  to `/product/716a392f-...` got cached first; every later crawler
  request to that same URL then got served the cached generic page
  instead of ever re-running the middleware — confirmed via
  `get_runtime_logs(source: edge-middleware)` showing `cache=HIT`/`MISS`
  on exactly that path. Fixed by dropping shared caching entirely
  (`private, no-store`) rather than fighting it with `Vary: User-Agent`,
  which would need two independent CDN layers to cooperate to be
  reliable — not worth the fragility for this traffic volume.

  **Bug 2 — the real one, found after fixing bug 1 and still seeing the
  generic page.** The original design fetched the real built `index.html`
  from the origin (`fetch(new URL('/', request.url))`) to reuse its
  script tags, then swapped just the meta tags. That self-fetch routed
  back out through Cloudflare — this zone has Bot Fight Mode enabled (see
  `infra/terraform/cloudflare.tf`) — and got a **403**, confirmed by
  adding temporary diagnostic logging and reading it back via
  `get_runtime_logs` (`mw: shell fetch status: 403`). Same underlying
  cause as the `uptime.yml` flakiness noted below: server-to-server
  requests from cloud/datacenter infrastructure are exactly what Bot
  Fight Mode is built to challenge.

  Rather than work around Cloudflare (allowlisting Vercel's edge IaaS
  ranges isn't practical — they're not static/published), reconsidered
  the design: every crawler this middleware targets (Facebook, Twitter,
  LinkedIn, Slack, Discord, WhatsApp, Telegram, Pinterest, Reddit) never
  executes JS, so none of them need the real app shell's hashed script
  tags at all — only correct `<head>` meta tags. **Removed Googlebot,
  Bingbot, and Applebot from the crawler list entirely** — all three
  execute JS for indexing and already see `SEOHead`'s correct per-page
  tags via a normal render, so they never needed this middleware in the
  first place. With only non-JS crawlers left to serve, the middleware
  now builds a minimal, self-contained HTML document directly (no
  network fetch at all) — eliminating the Cloudflare round-trip
  entirely instead of routing around it.

  **Verified end-to-end against the live production site** (not just
  reasoned about): a real `facebookexternalhit` UA gets the correct
  product-specific title/description/image with no caching; a real
  WeChat in-app browser UA and a real desktop Chrome UA both still get
  the exact same working SPA (`<div id="root">` present) as before this
  middleware existed.

- [x] **Every deploy silently failed for most of today (2026-07-17) — nothing
  from the platform-audit "Now" tier onward actually reached production
  until this was caught and fixed.** Root cause: `add273c` (the first
  Now-tier commit) added the `e2e` CI job as a hard requirement for
  `deploy-production` (`needs: [test, e2e]`) in the same commit that
  changed `index.html`. The `e2e` job passed locally every time it was
  checked this session, but failed in real GitHub Actions on every single
  push since — confirmed via the GitHub API (`gh` CLI isn't available
  here, but the repo is public, so `api.github.com/repos/.../actions/runs`
  and `.../check-runs/{id}/annotations` are readable without a token; that
  path is how this got diagnosed and later verified fixed, since raw log
  download does require auth this session never had). This was caught
  *because* a routine follow-up check (confirming an earlier index.html
  fix was actually live) found the production site still serving the old,
  supposedly-already-fixed Lovable placeholder image — the fix was real
  and correct in the repo, just never deployed.

  Root cause of the `e2e` failure itself: it pulled Vercel's **preview**
  environment's env vars, which — this repo has only ever pushed straight
  to `master`, no PR has ever actually triggered `deploy-preview` — had
  never been exercised or verified to contain working Supabase
  credentials. Fixed by switching to `--environment=production`, matching
  `deploy-production`'s own long-proven-working env source (there's only
  one real Supabase project used anywhere in this repo regardless).
  Verified the fix landed by watching the next real CI run to completion
  via the GitHub API rather than assuming: `Deploy Production` succeeded,
  and the live site was independently re-checked afterward (correct
  `og:image`/`og:url`, correct CSP headers all present).

  **Update, same session**: while this was being fixed, the user
  independently committed two more CI hardening passes directly
  (`9a873df`, `b2e66f8` — concurrency groups, per-job timeouts, a
  Node-based Supabase-credential sanity check now run as
  `npm run ci:check-supabase-env`, a `preview-smoke` job that actually
  exercises a real deployed preview URL, and fixed `smoke.spec.ts` to use
  Playwright's `baseURL` instead of a hardcoded `localhost:8080`). Those
  are folded in as-is, not redone.

  **Separately found, not yet resolved**: the new `uptime.yml` scheduled
  check (added earlier this session) has itself failed twice with a
  non-2xx response (`curl -sf` exit 22) at times when the site was
  independently confirmed healthy — plausibly Cloudflare's Bot Fight Mode
  (enabled on this zone) challenging GitHub Actions' datacenter IP range,
  a very different traffic profile than a real browser. Added a browser
  User-Agent and explicit status-code logging so the next occurrence is
  self-diagnosing; if it keeps happening, the real fix is likely
  allowlisting GitHub Actions' IP ranges in the Cloudflare zone config, not
  something to guess at further without more failed-run evidence.

- [x] **Built a free responsive/WebP image pipeline for product photos
  (2026-07-17)**, after confirming (see the struck-through item above) that
  every product image is a static repo-bundled file, not a Storage/R2 URL,
  and there's no upload path that could add one — so a build-time approach
  fully covers today's catalog with zero new recurring cost, unlike the
  Cloudflare Pro upgrade or Supabase Storage transforms the original
  audit item considered. `scripts/generate-image-variants.mjs` (new
  `sharp` devDependency) generates WebP at 480/800/1200px for every
  `public/images/product-*.{jpg,png}` file, capped to never upscale past
  the source, skipping regeneration when a variant is already newer than
  its source. Not wired into the CI build — these are static, rarely-added
  assets, re-run manually via `npm run generate-image-variants` after
  adding a new product photo, then commit the output alongside it (documented
  in the script's own header). New `ResponsiveImage` component
  (`src/components/storefront/ResponsiveImage.tsx`) renders a
  `<picture>`/`srcset` for any recognized `/images/product-*` path and
  falls back to a plain `<img>` for anything else, rather than guessing at
  a variant that might not exist. Wired into every product-image render
  site: `Shop.tsx`'s grids, `ProductDetail.tsx`'s hero (kept `fetchPriority
  ="high"`, this page's LCP element), thumbnail strip, zoom dialog, and
  related-products grids, and `CartDrawer.tsx`. **Verified against a real
  browser, not just the build output**: served the actual production
  build and drove it with Playwright — all 18 real product-image requests
  on the Shop page resolved as WebP with zero failures, and confirmed the
  responsive behavior actually works (a narrow 400px viewport correctly
  requests the 480w variant instead of 1200w). 126 variants generated,
  totalling 3.4MB combined — smaller than the 4.8MB of source JPEGs alone,
  before even counting that any single page load only fetches one variant
  per image, not all three.

- [x] **`SEOHead` was shipping duplicate, spec-losing `og:*`/`twitter:*`
  meta tags on all 16 pages that used it — found while wiring per-page SEO
  into `ProductDetail.tsx` (2026-07-17).** `react-helmet-async` only
  dedupes tags against its own previously-rendered instances, not
  pre-existing static markup — so it never removed `index.html`'s static
  `og:title`/`og:description`/etc., meaning every `<SEOHead>` page ended up
  with two conflicting copies of each tag. Per the Open Graph spec, the
  *first* tag wins in a conflict — the static, generic one — meaning
  per-page social-sharing metadata has likely never actually worked for any
  JS-executing crawler on any of these 16 pages: Shop, Compare, ApplyGrower,
  CorporateGifts, Culture, ForgotPassword, GrowerBatches, GrowerCredits,
  GrowersInfo, Index, Lookbook, Login, MyOrders, ResetPassword, Register,
  Returns. Separately found the `og-default.jpg` fallback image (used by
  every one of those pages except product pages, which always pass an
  explicit `image`) was never a real file — a 404 shipping sitewide. Fixed
  both in `SEOHead.tsx`: a `useEffect` now removes the stale static
  duplicate (identified by the absence of Helmet's own `data-rh` marker)
  once this component's tags land, and the fallback image now points at
  the same real asset `index.html`'s own static default uses. Also added
  `twitter:image` (previously not set at all, silently falling back to
  Twitter's own `og:image` fallback behavior — worked, but wasn't explicit
  and wasn't fixed by the og:image correction alone since Twitter checks
  `twitter:image` first). **Verified against a real browser**, not just
  reasoned about: built the app, served it, and drove it with Playwright —
  confirmed exactly one `og:title` (not two) on `/shop`, confirmed a page
  that never renders `<SEOHead>` (`/contact`) is untouched (no regression),
  and confirmed a real product page's `twitter:image` resolves to that
  product's actual photo, not the generic fallback.

- [x] **Wired `<SEOHead>` + `<ProductJsonLd>`-style per-page metadata into
  `ProductDetail.tsx` (2026-07-17)** — the one page type most relevant to
  social-commerce sharing had never had it, unlike 16 other pages (see
  above). Also made `Shop.tsx`'s existing `<SEOHead>` category-aware (a
  filtered `?cat=duvet` link now titles as "Duvets — Pacific Alpacas"
  instead of the generic "Shop" title for every category). Extracted a
  shared `toAbsoluteUrl()` helper (`src/lib/seo.ts`) used by both
  `SEOHead`'s image prop and `ProductJsonLd`'s existing (slightly
  duplicated) absolute-URL logic. Note the real limit here, unchanged by
  this fix: this is still a client-rendered SPA with no SSR/prerendering,
  so this helps crawlers that execute JS (Googlebot does) but does **not**
  fix link previews for unfurlers that only read the initial static HTML —
  classic Facebook/Twitter/WeChat behavior. `index.html`'s static tags are
  still what those see for every page. Closing that gap needs
  prerendering — still a "Later" tier item, not done here.

- [x] **Added a scheduled uptime-check workflow** (`.github/workflows/uptime.yml`,
  every 15 min) — deliberately not a bare "curl / and check for 200":
  `vercel.json` rewrites every path to `index.html`, so a plain status check
  on `/login` or `/checkout` can't distinguish a broken route from a working
  one, the SPA shell always loads. Checks instead: homepage serves real
  content (catches the DNS-negative-cache class of issue from earlier this
  session), the Supabase REST API is reachable, and the `create-checkout`
  CORS preflight still allows `pacificalpaca.com` — this last one is the
  exact class of bug behind the already-fixed `JAVASCRIPT-REACT-7`
  incident, verified by running all three checks against real production
  infrastructure before committing the workflow. On failure, GitHub emails
  the repo's default Actions-notification recipients — no new secret
  needed. Slack/SMS paging instead would need a webhook URL as a new secret.

- [x] **Scaffolded Supabase Edge Function CI/CD** — a `deploy-functions` job
  in `ci.yml` that runs `supabase functions deploy --use-api` (server-side
  bundling, no Docker needed in the runner) after `test` passes on master.
  **Inactive until a `SUPABASE_ACCESS_TOKEN` repo secret is added**
  (Supabase dashboard → Account → Access Tokens) — that's a personal access
  token, a different and simpler auth path than the browser-OAuth
  `supabase login` flow that's been 401ing all session, worth trying even
  though CLI login itself is broken. Deliberately skips (not fails) when
  the secret is missing, rather than showing red on every single push
  regardless of what changed — that would train people to ignore CI,
  undermining the e2e gate added in the same session. Once the secret
  exists, this replaces the manual dashboard-paste deploy workflow
  entirely, including for the `create-checkout` (Alipay) and
  `stripe-webhook` (typing) fixes that are still sitting
  deployed-in-git-but-not-in-production.

- [x] **Platform-audit "Now" tier fixed end-to-end (2026-07-17)** — the
  six near-term items from that session's architecture review, in one pass:
  - `index.html`'s `og:image`/`twitter:image` pointed at a leftover Lovable
    scaffold screenshot, `twitter:site` still read `@Lovable`, and a stray
    `<!-- TODO: Set the document title... -->` comment shipped on every page.
    Replaced the image with a real on-domain asset
    (`https://pacificalpaca.com/images/hero-comforter.jpg`, already used as
    the hero video's poster frame); dropped `twitter:site` entirely rather
    than invent a handle — the only real social account referenced anywhere
    in the codebase is Instagram (`instagram.com/pacific_alpacas`), no
    Twitter/X account exists to cite.
  - Added a `headers` block to `vercel.json`: a CSP (`script-src 'self'`,
    no `unsafe-eval`/inline scripts — the built output has none),
    `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
    `Referrer-Policy: strict-origin-when-cross-origin`, and a
    `Permissions-Policy` disabling camera/mic/geolocation (grepped — unused
    anywhere). `connect-src` scoped to the real Supabase project
    (`pymnquyxpoeqkkuzzial.supabase.co`, both `https:`/`wss:`), Frankfurter,
    and Sentry's ingest host. **Verified against a real browser, not just
    reasoned about**: built the app, served it with the same CSP injected as
    a meta tag, and drove it with Playwright across every public route
    (including `/growers-info`'s Leaflet/OpenStreetMap map and an
    unauthenticated `/checkout` redirect) — zero CSP console violations.
  - Added `npm audit --omit=dev --audit-level=high` to `ci.yml`. Scoped to
    production deps deliberately: the one existing finding
    (GHSA-67mh-4wv8-2f99, esbuild's dev server) lives entirely in
    vite/esbuild devDependencies, never ships to production, and its fix is
    an intentional Vite 5→8 major bump — already a known, deferred decision,
    not something this check should turn permanently red over.
  - Wired the existing Playwright e2e suite into CI as a real gate — see the
    struck-through P1 entry above for the details, including the
    `playwright.config.ts` `testDir` bug found along the way.
  - Made `loading="lazy"` consistent across the product-grid, cart-drawer,
    and related-products images that were missing it (`Shop.tsx`,
    `ProductDetail.tsx`, `CartDrawer.tsx`); gave `ProductDetail.tsx`'s main
    product image `fetchPriority="high"` instead, since it's that page's LCP
    element — matching the pattern `HeroSection.tsx` already uses. Checked
    first whether missing width/height was a real layout-shift risk here:
    it isn't — every one of these images sits inside a CSS `aspect-square`
    wrapper, which reserves the box before the image loads regardless of
    HTML width/height attributes, so that part of the original audit finding
    was overstated and no width/height changes were needed.
  - See the struck-through P1 entry above for the `stripe-webhook` typing
    fix.
  
  All six verified together: `tsc --noEmit` clean, ESLint 0 errors (85→81
  warnings), all 59 vitest tests pass, full production build succeeds.
  **Not yet deployed** — needs a push to `master` (frontend changes) plus a
  manual `supabase functions deploy stripe-webhook` (edge functions still
  aren't in CI/CD, see the migration-drift and CLI-auth notes elsewhere in
  this file).

- [x] **Stale-chunk reload fix wasn't actually suppressing the Sentry report it
  was meant to suppress (2026-07-17).** Found via the Sentry check above:
  `JAVASCRIPT-REACT-5`/`-6`/`-8` (chunk-load `TypeError`s for `ProductDetail`,
  `Shop`, `Contact`) kept appearing *after* `e85826a` ("Reload once on stale
  chunk load failure after a deploy") landed, which shouldn't happen if that
  fix worked. Root cause: the `vite:preloadError` listener in `src/main.tsx`
  reloaded the page but never called `event.preventDefault()` — per Vite's
  own event semantics, without that call the original import error is
  rethrown after the listener runs and still reaches Sentry's global handler
  as an unhandled error, even though the user's browser recovers fine via the
  reload. So the fix was working for the user (silent recovery) but not for
  the noise it was supposed to eliminate from Sentry. One-line fix: added
  `event.preventDefault()`. Verified: `tsc --noEmit` clean, `npm run build`
  succeeds, all 59 vitest tests still pass.

- [x] **WeChat Mini Store QR code gave impractical instructions on mobile
  (2026-07-16).** `WeChatStoreButton.tsx` only branched on whether the page
  was open inside WeChat's own in-app browser. Outside WeChat, it always
  said "open WeChat and scan this QR code" — correct advice on desktop
  (the QR is on a different device from the phone that scans it), but
  useless on a phone in a normal browser (Safari/Chrome), where the QR code
  and the camera that would scan it are the same device — you can't
  usefully point a phone's camera at its own screen. Real customers were
  hitting this: save the image, then use WeChat's scan-from-album feature.
  Added a third branch using the existing `useIsMobile` viewport hook
  (already used elsewhere for the same purpose) so mobile-not-in-WeChat now
  says "press and hold to save the image, then open WeChat Scan, tap the
  album icon, and select the saved image" instead. Verified all three
  states (desktop / mobile-in-WeChat / mobile-not-in-WeChat) render the
  correct copy via Playwright against the local dev server, using device
  emulation and a `MicroMessenger` UA override for the WeChat case.

- [x] **Mainland China usability prep (2026-07-16), ahead of a brand
  meeting.** User did their own codebase pass looking for concrete,
  verifiable issues rather than waiting on vague feedback. Three items
  fixed here; two more need a business decision first — see the new P1
  entry below for WeChat Pay, and general Vercel/Cloudflare edge latency
  from mainland China isn't a code fix at all, it's a hosting/CDN-strategy
  question worth the brand being aware of:
  - **Alipay showed as a payment option at checkout but wasn't actually
    wired up** — selecting it just showed a "not available yet" toast.
    Verified against Stripe's docs that Alipay genuinely supports this
    account (NZD/CNY/USD are all Alipay-eligible settlement currencies,
    and it works with Stripe's standard hosted Checkout Session in
    `mode: "payment"`, no architecture change needed). Wired it up: the
    frontend (`Checkout.tsx`) now sends `paymentMethod` through to
    `create-checkout`, which sets `payment_method_types: ["alipay"]`
    instead of `["card"]` when selected. Also disabled the WeChat Pay
    button in the UI (was previously clickable, always led to the same
    dead-end toast) with a "Coming soon" label, and moved the "Secured by
    Stripe" badge onto Alipay too, since it's genuinely processed by
    Stripe now. **Not yet deployed** — like the earlier `create-checkout`
    type change, this needs a manual `supabase functions deploy
    create-checkout` (or paste into the Dashboard editor); the CD pipeline
    only deploys the Vercel frontend.
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

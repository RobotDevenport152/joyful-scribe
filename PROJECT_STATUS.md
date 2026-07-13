# Project Status — Known Issues

> Source: a full customer walkthrough of the live site (homepage → search → product
> detail → cart → checkout → traceability → lookbook → compare → contact), 2026-07-13.
> Updated as issues are found and fixed. Fixed items are struck through with the
> commit that resolved them; do not delete history — this file is the running log.

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

## P1 — Fix soon (real but lower-frequency impact)

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

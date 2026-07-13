# Project Status — Known Issues

> Source: a full customer walkthrough of the live site (homepage → search → product
> detail → cart → checkout → traceability → lookbook → compare → contact), 2026-07-13.
> Updated as issues are found and fixed. Fixed items are struck through with the
> commit that resolved them; do not delete history — this file is the running log.

## P0 — Fix first (visible to every customer, or blocks purchase)

- [ ] **Checkout forces account creation/login before purchase** — `/checkout`
  is wrapped in `<ProtectedRoute>` (`App.tsx`), no guest checkout path exists.
  Likely a real conversion drag for first-time high-value buyers who don't want
  to register before paying.

## P1 — Fix soon (real but lower-frequency impact)

- [ ] **Hero video doesn't match "luxury sleep" positioning.** Current loop
  (`public/videos/promo.mp4`, 15–48s of source) shows two workers tagging/
  weighing raw fibre bags in a warehouse — operationally authentic, but not
  evocative of the "全球深睡新标准 / Luxury in Your Dreams" headline sitting on
  top of it. Headline text also has no scrim in some frames, hurting legibility.

- [ ] **Traceability page (`/traceability`) landing state is mostly blank**
  below the search box until a batch number is entered — no supporting content,
  large empty whitespace before the footer.

## P2 — Polish

- [ ] **Untranslated enum leaks into UI**: cart / product-detail traceability
  block shows `处理状态: ready` — raw English enum value (`processing_status`)
  instead of a translated Chinese label (should be something like "已就绪").

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

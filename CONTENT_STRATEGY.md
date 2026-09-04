# CONTENT_STRATEGY.md — Site IA & Content Roadmap

> This file tracks the planned content/information-architecture overhaul and the
> competitive research behind it. For engineering architecture and standards, see
> `CLAUDE.md`. For the live bug/incident log, see `PROJECT_STATUS.md` — this file
> is neither; it's a content/IA plan, checked off as sections ship. Update the
> checkboxes in place (don't delete history) as each item lands, same convention
> as `PROJECT_STATUS.md`.
>
> Origin: 2026-07-29, a content-framework sketch (7-section IA) plus a competitive
> benchmark of two luxury bedding brands (Vispring, Hästens), done to give the
> planned nav/page overhaul concrete, evidence-backed direction instead of opinion.

---

## 1. Target Information Architecture

Seven top-level sections, replacing the current Navbar structure (6 primary links +
a 12-item "更多功能" dropdown that mixes B2C customer-service and B2B links).

| # | Section | Target route | Current state | Work needed |
|---|---|---|---|---|
| 1 | 首页 Home | `/` | `Index.tsx` stacks 8+ sections (Hero, BrandHeritage, FarmStory, Certifications, MediaCoverage, GrowerNetwork, SleepScience, AuthorityBanner…) | Trim to Hero + category-quick-links + one CTA; move deep content to #2 and #4 |
| 2 | 关于我们 About | `/about` (new) | No dedicated page. Content scattered across `BrandHeritageSection.tsx`, `FarmStorySection.tsx`, `Culture.tsx` | Build `src/pages/About.tsx` |
| 3 | 产品系列 Products | `/shop` (existing) | `Shop.tsx` — full filter/sort/search shelf, 8 categories | Mostly fine; add a category-quick-look strip above the filterable shelf |
| 4 | 品质认证 Quality | `/quality` (new) | No dedicated page. Split across `CertificationsSection.tsx` (home), `CertificationBadges.tsx` (product-level), `public/docs/certificate-of-licence.pdf` | Build `src/pages/Quality.tsx` |
| 5 | 防伪验证 Verify | `/verify`, `/verify/:code` (existing) | `Verify.tsx` already matches the target 1-to-1 | No structural change; UI-polish pass only |
| 6 | 合作与服务 Partnership | `/wholesale` (repurpose) | Split across `Wholesale.tsx`, `CorporateGifts.tsx`, `ApplyGrower.tsx`, with after-sales info only in `Returns.tsx` | Turn `Wholesale.tsx` into an overview page that fans out to the other three + a short after-sales/logistics summary |
| 7 | 联系我们 Contact | `/contact` (existing) | `Contact.tsx` exists | Verify it includes a "partnership channel" link to #6; add if missing |

`Culture.tsx` (art gallery), `GrowersInfo.tsx`, `Lookbook.tsx`, `Compare.tsx`, `Returns.tsx`,
and `/china` stay as-is and get linked *into* the 7 sections above rather than
occupying primary nav slots.

**Suggested build order** (each step independently deployable):
1. [ ] Navbar restructure — 7 primary links, secondary links demoted to footer/utility menu
2. [ ] `src/pages/About.tsx`
3. [ ] `src/pages/Quality.tsx`
4. [ ] `Wholesale.tsx` → partnership overview
5. [ ] Trim `Index.tsx`
6. [ ] `Contact.tsx` partnership-channel link
7. [ ] i18n strings (`src/i18n/index.ts`) + `SEOHead` meta for new routes
8. [ ] `public/sitemap.xml` + `tests/e2e/smoke.spec.ts` route coverage for `/about`, `/quality`, and the repurposed partnership page

---

## 2. Competitive Benchmark — Vispring & Hästens

Researched 2026-07-29 against [vispring.com](https://www.vispring.com/) (UK, est. 1901)
and [hastens.com](https://www.hastens.com/) (Sweden, est. 1852) — two luxury bedding
brands with the closest positioning match to Pacific Alpacas (natural-material,
heritage-led, high price point).

**Sourcing note:** Vispring's site content was fetched directly. Hästens' site is
heavily client-rendered, so its content below is cross-checked against secondary
sources (Tharawat Magazine, BLLNR) rather than scraped directly — treat Hästens
facts as verified-but-secondhand, not primary-source screenshots.

| Dimension | Vispring | Hästens | Pacific Alpacas (current) |
|---|---|---|---|
| Origin story | Engineer James Marshall invents the pocket spring for his ill wife (1901); Titanic first-class provenance | Pehr Adolf Janson, certified Master Saddler by King Oscar I, 22 Mar 1852; six generations; Swedish Royal Court supplier since 1952 | No origin narrative — only rollup stats ("25+ years", "800+ farms") in `BrandHeritageSection.tsx` |
| Craft visualization | 6 named process steps with concrete numbers (up to 6 rows of hand side-stitching, 8 hours per mattress, 4 fleeces of Shetland wool per mattress) | Materials-and-provenance focus (Swedish pine, horsehair/flax/wool, heat-treated Swedish steel springs); flagship Grand Vividus: 9 master artisans, 45 days | Supply-chain timeline exists (`FarmStorySection.tsx`) but as one of 8 homepage sections, no independent page, no process-level numbers |
| Authority signals | Footer badges: Flex Bedding Group, Walpole, SBID — industry-peer credentials, not consumer badges | Royal Warrant title, no badge wall | 4 icons on homepage (`CertificationsSection.tsx`: FernMark/NZ Made/IAA/Hurun) — real certifications, presented as an isolated homepage block, not unified with the per-product `CertificationBadges.tsx` |
| Visual identity mark | Hare motif + Roman numeral VI (from "six springs per pocket") | Blue-check pattern, reused across product, packaging, and storefront | "Cloud of Dreams / 云之梦" Māori-designed embroidery pattern exists but only appears as *text* on `ChinaLanding.tsx`, not as a reusable visual asset |
| Primary nav | 7 items | Minimal, story/craft/product/designer-collab cleanly layered | 6 items + 12-item "更多功能" dropdown mixing B2C and B2B |
| Homepage density | Medium — story → craft → collections, progressive | Low — sparse copy, relies on the blue-check visual mark to carry meaning | High — 8+ sections front-loaded |
| Flagship/limited product | Original/Classic/Luxe tiers, escalating customization | Grand Vividus told as a 3-chapter narrative, not a spec sheet | "羊驼顶垫 · 2026 global launch" exists in `ChinaLanding.tsx` PRODUCTS array with just a "新" tag — no narrative treatment |

---

## 3. Key Insights

1. **Credibility comes from one specific story, not aggregated stats.** Vispring has
   a named inventor and a motive; Hästens has an exact date and a royal certificate.
   "25+ years / 800+ farms / 70% market share" is a rollup with no anchor moment —
   the gap `About.tsx` needs to close.
2. **Craft claims need a verb and a number, not an adjective.** "Handcrafted with
   care" persuades no one; "hand side-stitched, up to 6 rows, 8 hours" does. The
   supply-chain material already exists (`FarmStorySection.tsx`); it just needs
   concrete process numbers, which is a content gap — see §5.
3. **Certifications read as more authoritative when shown sparingly**, not as a
   badge wall repeated on every page. Consolidate onto `/quality`; other pages
   reference at most 1–2.
4. **A reusable visual mark travels across language better than copy does.**
   Hästens' blue-check works identically in every locale. "云之梦" has the same
   potential but today is a paragraph of text on one landing page, not an asset
   used across pages/packaging.
5. **Sparse homepages read as confidence, not neglect.** Neither competitor tries
   to say everything on one screen. This directly supports the `Index.tsx` trim
   already planned in §1.

---

## 4. Action Items

Priority follows the `PROJECT_STATUS.md` convention (P0 = blocks the IA rollout,
P1 = real but not blocking).

### P0

- [ ] **`About.tsx`: lead with one concrete origin story, not a stats rollup.**
  Confirm with the business whether a nameable founding moment (who, what year,
  why alpaca fiber) exists to open the page with; demote the existing
  25+/800+/70% stats to supporting evidence underneath it.
- [ ] **`Quality.tsx`: attach real numbers to each process step.** Reuse
  `FarmStorySection.tsx`'s farm → shear → process → finish timeline, but each
  step needs a concrete figure (grading turnaround, processing days, farms per
  batch, etc.) — currently a content gap, see §5.
- [ ] **Trim `Index.tsx` to Hero + category quick-links + one CTA**, moving
  `BrandHeritageSection`, `FarmStorySection`, and `CertificationsSection` content
  to `/about` and `/quality`. Sequence after both new pages ship so nothing is
  orphaned mid-migration.

### P1

- [ ] **Turn "Cloud of Dreams / 云之梦" into a reusable visual asset**, not just
  copy on `ChinaLanding.tsx`. Needs a design-side export of the pattern itself
  (not the description) for reuse as a header image on `/about`, a divider/watermark
  on `/quality`, and eventually packaging.
- [ ] **Give the 2026 alpaca topper launch a narrative treatment** instead of a
  single "新" tag in the `PRODUCTS` array on `ChinaLanding.tsx` — design
  inspiration, scarcity, pre-order mechanics, similar in spirit to how Hästens
  narrates the Grand Vividus.
- [ ] **De-duplicate certification badges across pages** once `/quality` ships —
  each page should surface at most 1–2 certifications relevant to its own task,
  not repeat the full set.

---

## 5. Content Gaps Needing Business Input

These blockers aren't code — they're missing source material:

- [ ] **A nameable brand origin moment** for `About.tsx` (who started it, what
  year, why alpaca fiber) — the current stats have no anchor story.
- [ ] **Concrete process numbers** for `Quality.tsx` (grading turnaround time,
  processing duration, farms represented per batch, etc.) to replace adjective-only
  descriptions of the supply chain.
- [ ] **An exportable "Cloud of Dreams" pattern asset** (not just the existing
  paragraph description) for reuse as a cross-page visual mark.

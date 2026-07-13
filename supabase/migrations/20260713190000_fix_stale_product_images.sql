-- Fixes AI-mockup fake images that were left behind in the legacy singular
-- `image` column after the real photos were already added to the `images`
-- JSONB array in an earlier migration (same root cause as coat-classic,
-- fixed in 20260713180000_real_coat_photos.sql).

-- duvet-luxury / duvet-classic / duvet-premium: legacy `image` column still
-- pointed at the old fake mockup; `images` array's primary was already correct.
UPDATE public.products SET image = '/images/product-duvet-giftbox.jpg' WHERE slug = 'duvet-luxury';
UPDATE public.products SET image = '/images/product-duvet-rolled.jpg' WHERE slug = 'duvet-classic';
UPDATE public.products SET image = '/images/product-duvet-box.jpg' WHERE slug = 'duvet-premium';

-- vest-x6: the `images` array's own primary was the fake mockup, and a second
-- fake/mislabeled entry (a coat photo captioned as a vest) was also present.
-- Replace both with real photos and drop the mislabeled one.
UPDATE public.products SET
  image = '/images/product-vest-x6-giftbag.jpg',
  images = '[
    {"url":"/images/product-vest-x6-giftbag.jpg","alt":"X6 Alpaca Vest — Gift Bag","is_primary":true},
    {"url":"/images/product-vest-x6-tag-detail.jpg","alt":"X6 Alpaca Vest — Collar Tag","is_primary":false},
    {"url":"/images/product-vest-x6-packaging.jpg","alt":"X6 Alpaca Vest — Gift Box","is_primary":false},
    {"url":"/images/product-vest-color-mauve.jpg","alt":"Alpaca Vest — Mauve","is_primary":false},
    {"url":"/images/product-vest-color-coral.jpg","alt":"Alpaca Vest — Coral","is_primary":false},
    {"url":"/images/product-vest-color-blush.jpg","alt":"Alpaca Vest — Blush","is_primary":false},
    {"url":"/images/product-vest-color-ivory.jpg","alt":"Alpaca Vest — Ivory","is_primary":false},
    {"url":"/images/product-vest-color-mustard.jpg","alt":"Alpaca Vest — Mustard","is_primary":false},
    {"url":"/images/product-vest-color-black.jpg","alt":"Alpaca Vest — Black","is_primary":false},
    {"url":"/images/product-vest-color-periwinkle.jpg","alt":"Alpaca Vest — Periwinkle","is_primary":false}
  ]'::jsonb
WHERE slug = 'vest-x6';

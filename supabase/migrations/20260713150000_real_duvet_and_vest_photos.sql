-- Replaces single generic placeholder photos with real professional product
-- photography (duvet studio shoot + vest colour range) sourced from the
-- brand's own archive. Images live at public/images/product-duvet-*.jpg and
-- public/images/product-vest-*.jpg (already committed).

UPDATE public.products SET images =
  '[
    {"url":"/images/product-duvet-rolled.jpg","alt":"Alpaca Duvet — Rolled","is_primary":true},
    {"url":"/images/product-duvet-folded-2.jpg","alt":"Alpaca Duvet — Folded","is_primary":false},
    {"url":"/images/product-duvet-box.jpg","alt":"Alpaca Duvet — Packaging","is_primary":false},
    {"url":"/images/product-duvet-bed-lifestyle.jpg","alt":"Alpaca Duvet — On Bed","is_primary":false},
    {"url":"/images/product-duvet-texture.jpg","alt":"Alpaca Duvet — Quilting Detail","is_primary":false}
  ]'::jsonb
WHERE slug = 'duvet-classic';

UPDATE public.products SET images =
  '[
    {"url":"/images/product-duvet-giftbox.jpg","alt":"Alpaca Duvet — Gift Box","is_primary":true},
    {"url":"/images/product-duvet-folded-2.jpg","alt":"Alpaca Duvet — Folded","is_primary":false},
    {"url":"/images/product-duvet-bed-lifestyle.jpg","alt":"Alpaca Duvet — On Bed","is_primary":false},
    {"url":"/images/product-duvet-texture.jpg","alt":"Alpaca Duvet — Quilting Detail","is_primary":false}
  ]'::jsonb
WHERE slug = 'duvet-luxury';

UPDATE public.products SET images =
  '[
    {"url":"/images/product-duvet-box.jpg","alt":"Alpaca Duvet — Packaging","is_primary":true},
    {"url":"/images/product-duvet-rolled.jpg","alt":"Alpaca Duvet — Rolled","is_primary":false},
    {"url":"/images/product-duvet-bed-lifestyle.jpg","alt":"Alpaca Duvet — On Bed","is_primary":false},
    {"url":"/images/product-duvet-texture.jpg","alt":"Alpaca Duvet — Quilting Detail","is_primary":false}
  ]'::jsonb
WHERE slug = 'duvet-premium';

UPDATE public.products SET images =
  '[
    {"url":"/images/product-duvet-packbag.jpg","alt":"Alpaca Duvet","is_primary":true},
    {"url":"/images/product-duvet-folded-2.jpg","alt":"Alpaca Duvet — Folded","is_primary":false}
  ]'::jsonb
WHERE slug IN ('all-seasons', 'spring-autumn-duvet', 'summer-duvets');

UPDATE public.products SET images =
  '[
    {"url":"/images/product-vest-x6.jpg","alt":"X6 Alpaca Vest","is_primary":true},
    {"url":"/images/product-vest-x6-front.jpg","alt":"X6 Alpaca Vest — Front","is_primary":false},
    {"url":"/images/product-vest-x6-packaging.jpg","alt":"X6 Alpaca Vest — Gift Box","is_primary":false},
    {"url":"/images/product-vest-x6-tag-detail.jpg","alt":"X6 Alpaca Vest — Collar Tag","is_primary":false},
    {"url":"/images/product-vest-x6-giftbag.jpg","alt":"X6 Alpaca Vest — Gift Bag","is_primary":false},
    {"url":"/images/product-vest-color-mauve.jpg","alt":"Alpaca Vest — Mauve","is_primary":false},
    {"url":"/images/product-vest-color-coral.jpg","alt":"Alpaca Vest — Coral","is_primary":false},
    {"url":"/images/product-vest-color-blush.jpg","alt":"Alpaca Vest — Blush","is_primary":false},
    {"url":"/images/product-vest-color-ivory.jpg","alt":"Alpaca Vest — Ivory","is_primary":false},
    {"url":"/images/product-vest-color-mustard.jpg","alt":"Alpaca Vest — Mustard","is_primary":false},
    {"url":"/images/product-vest-color-black.jpg","alt":"Alpaca Vest — Black","is_primary":false},
    {"url":"/images/product-vest-color-periwinkle.jpg","alt":"Alpaca Vest — Periwinkle","is_primary":false}
  ]'::jsonb
WHERE slug = 'vest-x6';

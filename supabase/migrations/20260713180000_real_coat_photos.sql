-- coat-classic ("Cloud of Dreams Coat") was using two AI-generated fake webpage
-- mockups as its primary images (product-coat-main.jpg / product-coat-detail.jpg) —
-- baked-in fake nav bars, garbled AI text ("L—m" size selector, strikethrough
-- artifacts on the feature labels). Replacing with real clean flat-lay product
-- photos (front + back, camel + black) that carry the correct "Cloud of dreams"
-- brand tag on the collar — confirmed by brand owner as real product photography.
-- Dropping product-coat-women.jpg/product-coat-men.jpg — those show a
-- different-cut garment, not confirmed to be this exact SKU.

UPDATE public.products SET
  image = '/images/product-coat-cloud-camel.jpg',
  images = '[
    {"url":"/images/product-coat-cloud-camel.jpg","alt":"云梦羊驼大衣 — 驼色","is_primary":true},
    {"url":"/images/product-coat-cloud-camel-back.jpg","alt":"云梦羊驼大衣 — 驼色背面","is_primary":false},
    {"url":"/images/product-coat-cloud-black.jpg","alt":"云梦羊驼大衣 — 黑色","is_primary":false},
    {"url":"/images/product-coat-cloud-black-back.jpg","alt":"云梦羊驼大衣 — 黑色背面","is_primary":false}
  ]'::jsonb
WHERE slug = 'coat-classic';

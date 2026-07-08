-- The initial product seed (20260328222759) pointed every product's `images`
-- column at generic Unsplash stock photos (e.g. a random llama, a random bed)
-- that have nothing to do with Pacific Alpacas. Meanwhile, real branded
-- photography for these exact products was already sitting unused in
-- public/images (screenshots from pacificalpacas.com and the Cloud of
-- Dreams runway/lookbook). This swaps every product over to the matching
-- local asset, and adds real product photography (duvet packaging shots,
-- physical Cloud of Dreams coat photos) as secondary images where available.
-- Migrations are append-only, so this corrects via UPDATE rather than
-- editing the original seed migration.

UPDATE public.products SET images =
  '[{"url":"/images/product-newborn-blanket.jpg","alt":"初生羊驼被","is_primary":true}]'::jsonb
WHERE slug = 'newborn-alpaca-blanket';

UPDATE public.products SET images =
  '[{"url":"/images/product-classic-duvet.jpg","alt":"经典款春秋被","is_primary":true},
    {"url":"/images/product-duvet-packaging-front.jpg","alt":"包装展示","is_primary":false}]'::jsonb
WHERE slug = 'classic-spring-autumn';

UPDATE public.products SET images =
  '[{"url":"/images/product-classic-duvet.jpg","alt":"经典款冬被","is_primary":true},
    {"url":"/images/product-duvet-packaging-back.jpg","alt":"包装展示","is_primary":false}]'::jsonb
WHERE slug = 'classic-winter';

UPDATE public.products SET images =
  '[{"url":"/images/product-luxury-duvet.jpg","alt":"轻奢款夏被","is_primary":true},
    {"url":"/images/product-duvet-packaging-front.jpg","alt":"包装展示","is_primary":false}]'::jsonb
WHERE slug = 'luxury-summer';

UPDATE public.products SET images =
  '[{"url":"/images/product-luxury-duvet.jpg","alt":"轻奢款春秋被","is_primary":true},
    {"url":"/images/product-duvet-packaging-spec.jpg","alt":"规格说明","is_primary":false}]'::jsonb
WHERE slug = 'luxury-spring-autumn';

UPDATE public.products SET images =
  '[{"url":"/images/product-luxury-duvet.jpg","alt":"轻奢款冬被","is_primary":true},
    {"url":"/images/product-duvet-packaging-back.jpg","alt":"包装展示","is_primary":false}]'::jsonb
WHERE slug = 'luxury-winter';

UPDATE public.products SET images =
  '[{"url":"/images/product-premium-duvet.jpg","alt":"高奢款冬被","is_primary":true},
    {"url":"/images/product-duvet-packaging-spec.jpg","alt":"规格说明","is_primary":false}]'::jsonb
WHERE slug = 'premium-luxury-winter';

UPDATE public.products SET images =
  '[{"url":"/images/product-coat-main.jpg","alt":"经典款羊驼大衣","is_primary":true},
    {"url":"/images/product-coat-cloud-black.jpg","alt":"黑色款实拍","is_primary":false},
    {"url":"/images/product-coat-cloud-camel.jpg","alt":"驼色款实拍","is_primary":false}]'::jsonb
WHERE slug = 'classic-alpaca-coat';

UPDATE public.products SET images =
  '[{"url":"/images/product-vest-x6.jpg","alt":"X6羊驼马甲","is_primary":true}]'::jsonb
WHERE slug = 'x6-alpaca-vest';

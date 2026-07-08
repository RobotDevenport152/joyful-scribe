-- The later duvet re-seed (20260707184116_add_sku_to_products) added
-- all-seasons / spring-autumn-duvet / summer-duvets with no `images` at
-- all, so they render with no product photo. public/images/product-duvet.jpg
-- is an unused generic folded-duvet shot that fits all three category tiles.

UPDATE public.products SET images =
  '[{"url":"/images/product-duvet.jpg","alt":"All-Seasons Duvets","is_primary":true}]'::jsonb
WHERE slug = 'all-seasons';

UPDATE public.products SET images =
  '[{"url":"/images/product-duvet.jpg","alt":"Spring/Autumn Duvets","is_primary":true}]'::jsonb
WHERE slug = 'spring-autumn-duvet';

UPDATE public.products SET images =
  '[{"url":"/images/product-duvet.jpg","alt":"Summer Duvets","is_primary":true}]'::jsonb
WHERE slug = 'summer-duvets';

-- sweater-alpaca was using 2 AI-generated placeholder images (a synthetic
-- "model + alpacas in a field" composite). Replacing with real knitwear
-- reference photography. Note: these are supplier-catalog photos for the
-- knitwear category, not a confirmed dedicated Pacific Alpacas product
-- shoot for this exact SKU — swap for real product photography when
-- available.

UPDATE public.products SET images =
  '[
    {"url":"/images/product-sweater-cardigan-lifestyle.jpg","alt":"Alpaca Wool Cardigan","is_primary":true},
    {"url":"/images/product-sweater-cardigan-pair.jpg","alt":"Alpaca Wool Cardigan — Detail","is_primary":false}
  ]'::jsonb
WHERE slug = 'sweater-alpaca';

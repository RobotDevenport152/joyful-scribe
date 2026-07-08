-- Adds real per-size pricing to size_options for the 20 carpet products
-- seeded in 20260709130000. Prices match the live pacificalpacas.com
-- WooCommerce variation prices exactly (fetched via its Store API).
-- create-checkout now looks up size_options[].price_nzd when a variant
-- is selected, so this is what actually gets charged per size.

update public.products set size_options =
  '[
    {"label":"70cm x 140cm (0.98m2)","price_nzd":840},
    {"label":"90cm x 160cm (1.44m2)","price_nzd":1234},
    {"label":"120cm x 180cm (2.16m2)","price_nzd":1851},
    {"label":"140cm x 200cm (2.80m2)","price_nzd":2400},
    {"label":"170cm x 240cm (4.08m2)","price_nzd":3497},
    {"label":"200cm x 200cm (4.00m2)","price_nzd":3429},
    {"label":"200cm x 250cm (5.00m2)","price_nzd":4286},
    {"label":"200cm x 300cm (6.00m2)","price_nzd":5143},
    {"label":"250cm x 300cm (7.50m2)","price_nzd":6429},
    {"label":"250cm x 350cm (8.75m2)","price_nzd":7500},
    {"label":"300cm x 400cm (12.00m2)","price_nzd":10286}
  ]'::jsonb
where category = 'carpet';

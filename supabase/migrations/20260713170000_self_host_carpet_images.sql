-- The 20 carpet products seeded in 20260709130000_seed_carpet_products.sql hotlinked
-- their images directly from the old pacificalpacas.com WordPress site
-- (wp-content/uploads/...). If that site is ever taken down or restructured, every
-- carpet product image breaks. Downloaded the same real photos and self-hosted them
-- under public/images/carpets/ — same images, no content change, just a stable URL.

UPDATE public.products SET image = '/images/carpets/carpet-kirwee.jpg', images = '[{"url":"/images/carpets/carpet-kirwee.jpg","alt":"Kirwee","is_primary":true}]'::jsonb WHERE slug = 'carpet-kirwee';
UPDATE public.products SET image = '/images/carpets/carpet-mackenzie.jpg', images = '[{"url":"/images/carpets/carpet-mackenzie.jpg","alt":"Mackenzie","is_primary":true}]'::jsonb WHERE slug = 'carpet-mackenzie';
UPDATE public.products SET image = '/images/carpets/carpet-napier.jpg', images = '[{"url":"/images/carpets/carpet-napier.jpg","alt":"Napier","is_primary":true}]'::jsonb WHERE slug = 'carpet-napier';
UPDATE public.products SET image = '/images/carpets/carpet-waikato.jpg', images = '[{"url":"/images/carpets/carpet-waikato.jpg","alt":"Waikato","is_primary":true}]'::jsonb WHERE slug = 'carpet-waikato';
UPDATE public.products SET image = '/images/carpets/carpet-taupo.jpg', images = '[{"url":"/images/carpets/carpet-taupo.jpg","alt":"Taupo","is_primary":true}]'::jsonb WHERE slug = 'carpet-taupo';
UPDATE public.products SET image = '/images/carpets/carpet-kapiti.jpg', images = '[{"url":"/images/carpets/carpet-kapiti.jpg","alt":"Kapiti","is_primary":true}]'::jsonb WHERE slug = 'carpet-kapiti';
UPDATE public.products SET image = '/images/carpets/carpet-milford.jpg', images = '[{"url":"/images/carpets/carpet-milford.jpg","alt":"Milford","is_primary":true}]'::jsonb WHERE slug = 'carpet-milford';
UPDATE public.products SET image = '/images/carpets/carpet-fairlie.jpg', images = '[{"url":"/images/carpets/carpet-fairlie.jpg","alt":"Fairlie","is_primary":true}]'::jsonb WHERE slug = 'carpet-fairlie';
UPDATE public.products SET image = '/images/carpets/carpet-ranfurly.jpg', images = '[{"url":"/images/carpets/carpet-ranfurly.jpg","alt":"Ranfurly","is_primary":true}]'::jsonb WHERE slug = 'carpet-ranfurly';
UPDATE public.products SET image = '/images/carpets/carpet-gisborne.jpg', images = '[{"url":"/images/carpets/carpet-gisborne.jpg","alt":"Gisborne","is_primary":true}]'::jsonb WHERE slug = 'carpet-gisborne';
UPDATE public.products SET image = '/images/carpets/carpet-glenorchy.jpg', images = '[{"url":"/images/carpets/carpet-glenorchy.jpg","alt":"Glenorchy","is_primary":true}]'::jsonb WHERE slug = 'carpet-glenorchy';
UPDATE public.products SET image = '/images/carpets/carpet-rotorua.jpg', images = '[{"url":"/images/carpets/carpet-rotorua.jpg","alt":"Rotorua","is_primary":true}]'::jsonb WHERE slug = 'carpet-rotorua';
UPDATE public.products SET image = '/images/carpets/carpet-naseby.jpg', images = '[{"url":"/images/carpets/carpet-naseby.jpg","alt":"Naseby","is_primary":true}]'::jsonb WHERE slug = 'carpet-naseby';
UPDATE public.products SET image = '/images/carpets/carpet-nelson.jpg', images = '[{"url":"/images/carpets/carpet-nelson.jpg","alt":"Nelson","is_primary":true}]'::jsonb WHERE slug = 'carpet-nelson';
UPDATE public.products SET image = '/images/carpets/carpet-balclutha.jpg', images = '[{"url":"/images/carpets/carpet-balclutha.jpg","alt":"Balclutha","is_primary":true}]'::jsonb WHERE slug = 'carpet-balclutha';
UPDATE public.products SET image = '/images/carpets/carpet-ophir.jpg', images = '[{"url":"/images/carpets/carpet-ophir.jpg","alt":"Ophir","is_primary":true}]'::jsonb WHERE slug = 'carpet-ophir';
UPDATE public.products SET image = '/images/carpets/carpet-akaroa.jpg', images = '[{"url":"/images/carpets/carpet-akaroa.jpg","alt":"Akaroa","is_primary":true}]'::jsonb WHERE slug = 'carpet-akaroa';
UPDATE public.products SET image = '/images/carpets/carpet-tongariro.jpg', images = '[{"url":"/images/carpets/carpet-tongariro.jpg","alt":"Tongariro","is_primary":true}]'::jsonb WHERE slug = 'carpet-tongariro';
UPDATE public.products SET image = '/images/carpets/carpet-manakau.jpg', images = '[{"url":"/images/carpets/carpet-manakau.jpg","alt":"Manakau","is_primary":true}]'::jsonb WHERE slug = 'carpet-manakau';
UPDATE public.products SET image = '/images/carpets/carpet-haast.jpg', images = '[{"url":"/images/carpets/carpet-haast.jpg","alt":"Haast","is_primary":true}]'::jsonb WHERE slug = 'carpet-haast';

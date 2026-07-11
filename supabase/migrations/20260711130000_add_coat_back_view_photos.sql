-- Adds real back-view photography for the Classic Alpaca Coat (black & camel).
-- The front-view files (product-coat-cloud-black.jpg / product-coat-cloud-camel.jpg)
-- already existed in this products row from migration 20260708120000; this only
-- appends the matching back-view shots from the same professional photoshoot
-- (Canon EOS 80D, Oct 2023) rather than replacing the existing array, since
-- migrations are append-only.

UPDATE public.products SET images = images || '[
    {"url":"/images/product-coat-cloud-black-back.jpg","alt":"黑色款背面实拍","is_primary":false},
    {"url":"/images/product-coat-cloud-camel-back.jpg","alt":"驼色款背面实拍","is_primary":false}
  ]'::jsonb
WHERE slug = 'classic-alpaca-coat';

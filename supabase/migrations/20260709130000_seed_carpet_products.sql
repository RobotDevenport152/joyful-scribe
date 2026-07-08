-- 20 real Suri alpaca carpet products, sourced from the live pacificalpacas.com
-- WooCommerce catalogue (product-category/carpets) via its public Store API.
-- price_nzd is the entry-level (70cm x 140cm) price; the live site prices each
-- of the 11 sizes separately ($840-$10,286) but this schema/UI has no per-variant
-- pricing yet, so every size currently sells at the base price until that is built.

INSERT INTO public.products (name_zh, name_en, slug, category, description_zh, description_en, price_nzd, image, images, size_options, fill_material, stock, stock_quantity, is_active, is_featured, sort_order, certifications, sku) VALUES (
  'Kirwee', 'Kirwee', 'carpet-kirwee', 'carpet',
  '匠心手工制作，选用新西兰苏利羊驼优质纤维，尽显自然优雅与卓越品质。苏利羊驼毛纤维细长丝滑，赋予每张地毯柔和光泽与顺滑触感，风格现代精致，脚感温暖持久。天然低敏、可持续采集，每件皆为纯手工制作，独一无二。是一件历久弥新、工艺考究的地毯艺术品，为空间带来低调奢华与舒适质感。',
  'Handcrafted from luxurious Suri alpaca fibre, these carpets are a celebration of natural elegance and exceptional quality. Suri alpaca fibre is prized for its long, silky strands that create a soft lustre and smooth texture, giving each carpet a refined, contemporary look while remaining warm and durable underfoot. Naturally hypoallergenic and sustainably sourced, every piece is individually handmade, ensuring no two carpets are ever the same. Quality: 9/45 Persian knot (100knt), 10-12mm pile length.',
  840.00, 'https://pacificalpacas.com/wp-content/uploads/2026/06/Rugs-20-scaled.jpg',
  '[{"url":"https://pacificalpacas.com/wp-content/uploads/2026/06/Rugs-20-scaled.jpg","alt":"Kirwee","is_primary":true}]'::jsonb,
  '["70cm x 140cm (0.98m2)","90cm x 160cm (1.44m2)","120cm x 180cm (2.16m2)","140cm x 200cm (2.80m2)","170cm x 240cm (4.08m2)","200cm x 200cm (4.00m2)","200cm x 250cm (5.00m2)","200cm x 300cm (6.00m2)","250cm x 300cm (7.50m2)","250cm x 350cm (8.75m2)","300cm x 400cm (12.00m2)"]'::jsonb,
  '100% New Zealand Suri Alpaca Fibre', 5, 5, true, false, 9, ARRAY['NZ Grown'], 'RUG20'
);

INSERT INTO public.products (name_zh, name_en, slug, category, description_zh, description_en, price_nzd, image, images, size_options, fill_material, stock, stock_quantity, is_active, is_featured, sort_order, certifications, sku) VALUES (
  'Mackenzie', 'Mackenzie', 'carpet-mackenzie', 'carpet',
  '匠心手工制作，选用新西兰苏利羊驼优质纤维，尽显自然优雅与卓越品质。苏利羊驼毛纤维细长丝滑，赋予每张地毯柔和光泽与顺滑触感，风格现代精致，脚感温暖持久。天然低敏、可持续采集，每件皆为纯手工制作，独一无二。是一件历久弥新、工艺考究的地毯艺术品，为空间带来低调奢华与舒适质感。',
  'Handcrafted from luxurious Suri alpaca fibre, these carpets are a celebration of natural elegance and exceptional quality. Suri alpaca fibre is prized for its long, silky strands that create a soft lustre and smooth texture, giving each carpet a refined, contemporary look while remaining warm and durable underfoot. Naturally hypoallergenic and sustainably sourced, every piece is individually handmade, ensuring no two carpets are ever the same. Quality: 9/45 Persian knot (100knt), 10-12mm pile length.',
  840.00, 'https://pacificalpacas.com/wp-content/uploads/2026/06/Rugs-19-scaled.jpg',
  '[{"url":"https://pacificalpacas.com/wp-content/uploads/2026/06/Rugs-19-scaled.jpg","alt":"Mackenzie","is_primary":true}]'::jsonb,
  '["70cm x 140cm (0.98m2)","90cm x 160cm (1.44m2)","120cm x 180cm (2.16m2)","140cm x 200cm (2.80m2)","170cm x 240cm (4.08m2)","200cm x 200cm (4.00m2)","200cm x 250cm (5.00m2)","200cm x 300cm (6.00m2)","250cm x 300cm (7.50m2)","250cm x 350cm (8.75m2)","300cm x 400cm (12.00m2)"]'::jsonb,
  '100% New Zealand Suri Alpaca Fibre', 5, 5, true, false, 10, ARRAY['NZ Grown'], 'RUG19'
);

INSERT INTO public.products (name_zh, name_en, slug, category, description_zh, description_en, price_nzd, image, images, size_options, fill_material, stock, stock_quantity, is_active, is_featured, sort_order, certifications, sku) VALUES (
  'Napier', 'Napier', 'carpet-napier', 'carpet',
  '匠心手工制作，选用新西兰苏利羊驼优质纤维，尽显自然优雅与卓越品质。苏利羊驼毛纤维细长丝滑，赋予每张地毯柔和光泽与顺滑触感，风格现代精致，脚感温暖持久。天然低敏、可持续采集，每件皆为纯手工制作，独一无二。是一件历久弥新、工艺考究的地毯艺术品，为空间带来低调奢华与舒适质感。',
  'Handcrafted from luxurious Suri alpaca fibre, these carpets are a celebration of natural elegance and exceptional quality. Suri alpaca fibre is prized for its long, silky strands that create a soft lustre and smooth texture, giving each carpet a refined, contemporary look while remaining warm and durable underfoot. Naturally hypoallergenic and sustainably sourced, every piece is individually handmade, ensuring no two carpets are ever the same. Quality: 9/45 Persian knot (100knt), 10-12mm pile length.',
  840.00, 'https://pacificalpacas.com/wp-content/uploads/2026/04/RUG18-01.jpg',
  '[{"url":"https://pacificalpacas.com/wp-content/uploads/2026/04/RUG18-01.jpg","alt":"Napier","is_primary":true}]'::jsonb,
  '["70cm x 140cm (0.98m2)","90cm x 160cm (1.44m2)","120cm x 180cm (2.16m2)","140cm x 200cm (2.80m2)","170cm x 240cm (4.08m2)","200cm x 200cm (4.00m2)","200cm x 250cm (5.00m2)","200cm x 300cm (6.00m2)","250cm x 300cm (7.50m2)","250cm x 350cm (8.75m2)","300cm x 400cm (12.00m2)"]'::jsonb,
  '100% New Zealand Suri Alpaca Fibre', 5, 5, true, false, 11, ARRAY['NZ Grown'], 'RUG18'
);

INSERT INTO public.products (name_zh, name_en, slug, category, description_zh, description_en, price_nzd, image, images, size_options, fill_material, stock, stock_quantity, is_active, is_featured, sort_order, certifications, sku) VALUES (
  'Waikato', 'Waikato', 'carpet-waikato', 'carpet',
  '匠心手工制作，选用新西兰苏利羊驼优质纤维，尽显自然优雅与卓越品质。苏利羊驼毛纤维细长丝滑，赋予每张地毯柔和光泽与顺滑触感，风格现代精致，脚感温暖持久。天然低敏、可持续采集，每件皆为纯手工制作，独一无二。是一件历久弥新、工艺考究的地毯艺术品，为空间带来低调奢华与舒适质感。',
  'Handcrafted from luxurious Suri alpaca fibre, these carpets are a celebration of natural elegance and exceptional quality. Suri alpaca fibre is prized for its long, silky strands that create a soft lustre and smooth texture, giving each carpet a refined, contemporary look while remaining warm and durable underfoot. Naturally hypoallergenic and sustainably sourced, every piece is individually handmade, ensuring no two carpets are ever the same. Quality: 9/45 Persian knot (100knt), 10-12mm pile length.',
  840.00, 'https://pacificalpacas.com/wp-content/uploads/2026/06/Rugs-17-scaled.jpg',
  '[{"url":"https://pacificalpacas.com/wp-content/uploads/2026/06/Rugs-17-scaled.jpg","alt":"Waikato","is_primary":true}]'::jsonb,
  '["70cm x 140cm (0.98m2)","90cm x 160cm (1.44m2)","120cm x 180cm (2.16m2)","140cm x 200cm (2.80m2)","170cm x 240cm (4.08m2)","200cm x 200cm (4.00m2)","200cm x 250cm (5.00m2)","200cm x 300cm (6.00m2)","250cm x 300cm (7.50m2)","250cm x 350cm (8.75m2)","300cm x 400cm (12.00m2)"]'::jsonb,
  '100% New Zealand Suri Alpaca Fibre', 5, 5, true, false, 12, ARRAY['NZ Grown'], 'RUG17'
);

INSERT INTO public.products (name_zh, name_en, slug, category, description_zh, description_en, price_nzd, image, images, size_options, fill_material, stock, stock_quantity, is_active, is_featured, sort_order, certifications, sku) VALUES (
  'Taupo', 'Taupo', 'carpet-taupo', 'carpet',
  '匠心手工制作，选用新西兰苏利羊驼优质纤维，尽显自然优雅与卓越品质。苏利羊驼毛纤维细长丝滑，赋予每张地毯柔和光泽与顺滑触感，风格现代精致，脚感温暖持久。天然低敏、可持续采集，每件皆为纯手工制作，独一无二。是一件历久弥新、工艺考究的地毯艺术品，为空间带来低调奢华与舒适质感。',
  'Handcrafted from luxurious Suri alpaca fibre, these carpets are a celebration of natural elegance and exceptional quality. Suri alpaca fibre is prized for its long, silky strands that create a soft lustre and smooth texture, giving each carpet a refined, contemporary look while remaining warm and durable underfoot. Naturally hypoallergenic and sustainably sourced, every piece is individually handmade, ensuring no two carpets are ever the same. Quality: 9/45 Persian knot (100knt), 10-12mm pile length.',
  840.00, 'https://pacificalpacas.com/wp-content/uploads/2026/06/Rugs-16-scaled.jpg',
  '[{"url":"https://pacificalpacas.com/wp-content/uploads/2026/06/Rugs-16-scaled.jpg","alt":"Taupo","is_primary":true}]'::jsonb,
  '["70cm x 140cm (0.98m2)","90cm x 160cm (1.44m2)","120cm x 180cm (2.16m2)","140cm x 200cm (2.80m2)","170cm x 240cm (4.08m2)","200cm x 200cm (4.00m2)","200cm x 250cm (5.00m2)","200cm x 300cm (6.00m2)","250cm x 300cm (7.50m2)","250cm x 350cm (8.75m2)","300cm x 400cm (12.00m2)"]'::jsonb,
  '100% New Zealand Suri Alpaca Fibre', 5, 5, true, false, 13, ARRAY['NZ Grown'], 'RUG16'
);

INSERT INTO public.products (name_zh, name_en, slug, category, description_zh, description_en, price_nzd, image, images, size_options, fill_material, stock, stock_quantity, is_active, is_featured, sort_order, certifications, sku) VALUES (
  'Kapiti', 'Kapiti', 'carpet-kapiti', 'carpet',
  '匠心手工制作，选用新西兰苏利羊驼优质纤维，尽显自然优雅与卓越品质。苏利羊驼毛纤维细长丝滑，赋予每张地毯柔和光泽与顺滑触感，风格现代精致，脚感温暖持久。天然低敏、可持续采集，每件皆为纯手工制作，独一无二。是一件历久弥新、工艺考究的地毯艺术品，为空间带来低调奢华与舒适质感。',
  'Handcrafted from luxurious Suri alpaca fibre, these carpets are a celebration of natural elegance and exceptional quality. Suri alpaca fibre is prized for its long, silky strands that create a soft lustre and smooth texture, giving each carpet a refined, contemporary look while remaining warm and durable underfoot. Naturally hypoallergenic and sustainably sourced, every piece is individually handmade, ensuring no two carpets are ever the same. Quality: 9/45 Persian knot (100knt), 10-12mm pile length.',
  840.00, 'https://pacificalpacas.com/wp-content/uploads/2026/04/RUG15-01.jpg',
  '[{"url":"https://pacificalpacas.com/wp-content/uploads/2026/04/RUG15-01.jpg","alt":"Kapiti","is_primary":true}]'::jsonb,
  '["70cm x 140cm (0.98m2)","90cm x 160cm (1.44m2)","120cm x 180cm (2.16m2)","140cm x 200cm (2.80m2)","170cm x 240cm (4.08m2)","200cm x 200cm (4.00m2)","200cm x 250cm (5.00m2)","200cm x 300cm (6.00m2)","250cm x 300cm (7.50m2)","250cm x 350cm (8.75m2)","300cm x 400cm (12.00m2)"]'::jsonb,
  '100% New Zealand Suri Alpaca Fibre', 5, 5, true, false, 14, ARRAY['NZ Grown'], 'RUG15'
);

INSERT INTO public.products (name_zh, name_en, slug, category, description_zh, description_en, price_nzd, image, images, size_options, fill_material, stock, stock_quantity, is_active, is_featured, sort_order, certifications, sku) VALUES (
  'Milford', 'Milford', 'carpet-milford', 'carpet',
  '匠心手工制作，选用新西兰苏利羊驼优质纤维，尽显自然优雅与卓越品质。苏利羊驼毛纤维细长丝滑，赋予每张地毯柔和光泽与顺滑触感，风格现代精致，脚感温暖持久。天然低敏、可持续采集，每件皆为纯手工制作，独一无二。是一件历久弥新、工艺考究的地毯艺术品，为空间带来低调奢华与舒适质感。',
  'Handcrafted from luxurious Suri alpaca fibre, these carpets are a celebration of natural elegance and exceptional quality. Suri alpaca fibre is prized for its long, silky strands that create a soft lustre and smooth texture, giving each carpet a refined, contemporary look while remaining warm and durable underfoot. Naturally hypoallergenic and sustainably sourced, every piece is individually handmade, ensuring no two carpets are ever the same. Quality: 9/45 Persian knot (100knt), 10-12mm pile length.',
  840.00, 'https://pacificalpacas.com/wp-content/uploads/2026/04/RUG14-01.jpg',
  '[{"url":"https://pacificalpacas.com/wp-content/uploads/2026/04/RUG14-01.jpg","alt":"Milford","is_primary":true}]'::jsonb,
  '["70cm x 140cm (0.98m2)","90cm x 160cm (1.44m2)","120cm x 180cm (2.16m2)","140cm x 200cm (2.80m2)","170cm x 240cm (4.08m2)","200cm x 200cm (4.00m2)","200cm x 250cm (5.00m2)","200cm x 300cm (6.00m2)","250cm x 300cm (7.50m2)","250cm x 350cm (8.75m2)","300cm x 400cm (12.00m2)"]'::jsonb,
  '100% New Zealand Suri Alpaca Fibre', 5, 5, true, false, 15, ARRAY['NZ Grown'], 'RUG14'
);

INSERT INTO public.products (name_zh, name_en, slug, category, description_zh, description_en, price_nzd, image, images, size_options, fill_material, stock, stock_quantity, is_active, is_featured, sort_order, certifications, sku) VALUES (
  'Fairlie', 'Fairlie', 'carpet-fairlie', 'carpet',
  '匠心手工制作，选用新西兰苏利羊驼优质纤维，尽显自然优雅与卓越品质。苏利羊驼毛纤维细长丝滑，赋予每张地毯柔和光泽与顺滑触感，风格现代精致，脚感温暖持久。天然低敏、可持续采集，每件皆为纯手工制作，独一无二。是一件历久弥新、工艺考究的地毯艺术品，为空间带来低调奢华与舒适质感。',
  'Handcrafted from luxurious Suri alpaca fibre, these carpets are a celebration of natural elegance and exceptional quality. Suri alpaca fibre is prized for its long, silky strands that create a soft lustre and smooth texture, giving each carpet a refined, contemporary look while remaining warm and durable underfoot. Naturally hypoallergenic and sustainably sourced, every piece is individually handmade, ensuring no two carpets are ever the same. Quality: 9/45 Persian knot (100knt), 10-12mm pile length.',
  840.00, 'https://pacificalpacas.com/wp-content/uploads/2026/04/RUG13-01.jpg',
  '[{"url":"https://pacificalpacas.com/wp-content/uploads/2026/04/RUG13-01.jpg","alt":"Fairlie","is_primary":true}]'::jsonb,
  '["70cm x 140cm (0.98m2)","90cm x 160cm (1.44m2)","120cm x 180cm (2.16m2)","140cm x 200cm (2.80m2)","170cm x 240cm (4.08m2)","200cm x 200cm (4.00m2)","200cm x 250cm (5.00m2)","200cm x 300cm (6.00m2)","250cm x 300cm (7.50m2)","250cm x 350cm (8.75m2)","300cm x 400cm (12.00m2)"]'::jsonb,
  '100% New Zealand Suri Alpaca Fibre', 5, 5, true, false, 16, ARRAY['NZ Grown'], 'RUG13'
);

INSERT INTO public.products (name_zh, name_en, slug, category, description_zh, description_en, price_nzd, image, images, size_options, fill_material, stock, stock_quantity, is_active, is_featured, sort_order, certifications, sku) VALUES (
  'Ranfurly', 'Ranfurly', 'carpet-ranfurly', 'carpet',
  '匠心手工制作，选用新西兰苏利羊驼优质纤维，尽显自然优雅与卓越品质。苏利羊驼毛纤维细长丝滑，赋予每张地毯柔和光泽与顺滑触感，风格现代精致，脚感温暖持久。天然低敏、可持续采集，每件皆为纯手工制作，独一无二。是一件历久弥新、工艺考究的地毯艺术品，为空间带来低调奢华与舒适质感。',
  'Handcrafted from luxurious Suri alpaca fibre, these carpets are a celebration of natural elegance and exceptional quality. Suri alpaca fibre is prized for its long, silky strands that create a soft lustre and smooth texture, giving each carpet a refined, contemporary look while remaining warm and durable underfoot. Naturally hypoallergenic and sustainably sourced, every piece is individually handmade, ensuring no two carpets are ever the same. Quality: 9/45 Persian knot (100knt), 10-12mm pile length.',
  840.00, 'https://pacificalpacas.com/wp-content/uploads/2026/04/RUG12-01.jpg',
  '[{"url":"https://pacificalpacas.com/wp-content/uploads/2026/04/RUG12-01.jpg","alt":"Ranfurly","is_primary":true}]'::jsonb,
  '["70cm x 140cm (0.98m2)","90cm x 160cm (1.44m2)","120cm x 180cm (2.16m2)","140cm x 200cm (2.80m2)","170cm x 240cm (4.08m2)","200cm x 200cm (4.00m2)","200cm x 250cm (5.00m2)","200cm x 300cm (6.00m2)","250cm x 300cm (7.50m2)","250cm x 350cm (8.75m2)","300cm x 400cm (12.00m2)"]'::jsonb,
  '100% New Zealand Suri Alpaca Fibre', 5, 5, true, false, 17, ARRAY['NZ Grown'], 'RUG12'
);

INSERT INTO public.products (name_zh, name_en, slug, category, description_zh, description_en, price_nzd, image, images, size_options, fill_material, stock, stock_quantity, is_active, is_featured, sort_order, certifications, sku) VALUES (
  'Gisborne', 'Gisborne', 'carpet-gisborne', 'carpet',
  '匠心手工制作，选用新西兰苏利羊驼优质纤维，尽显自然优雅与卓越品质。苏利羊驼毛纤维细长丝滑，赋予每张地毯柔和光泽与顺滑触感，风格现代精致，脚感温暖持久。天然低敏、可持续采集，每件皆为纯手工制作，独一无二。是一件历久弥新、工艺考究的地毯艺术品，为空间带来低调奢华与舒适质感。',
  'Handcrafted from luxurious Suri alpaca fibre, these carpets are a celebration of natural elegance and exceptional quality. Suri alpaca fibre is prized for its long, silky strands that create a soft lustre and smooth texture, giving each carpet a refined, contemporary look while remaining warm and durable underfoot. Naturally hypoallergenic and sustainably sourced, every piece is individually handmade, ensuring no two carpets are ever the same. Quality: 9/45 Persian knot (100knt), 10-12mm pile length.',
  840.00, 'https://pacificalpacas.com/wp-content/uploads/2026/04/RUG11-01.jpg',
  '[{"url":"https://pacificalpacas.com/wp-content/uploads/2026/04/RUG11-01.jpg","alt":"Gisborne","is_primary":true}]'::jsonb,
  '["70cm x 140cm (0.98m2)","90cm x 160cm (1.44m2)","120cm x 180cm (2.16m2)","140cm x 200cm (2.80m2)","170cm x 240cm (4.08m2)","200cm x 200cm (4.00m2)","200cm x 250cm (5.00m2)","200cm x 300cm (6.00m2)","250cm x 300cm (7.50m2)","250cm x 350cm (8.75m2)","300cm x 400cm (12.00m2)"]'::jsonb,
  '100% New Zealand Suri Alpaca Fibre', 5, 5, true, false, 18, ARRAY['NZ Grown'], 'RUG11'
);

INSERT INTO public.products (name_zh, name_en, slug, category, description_zh, description_en, price_nzd, image, images, size_options, fill_material, stock, stock_quantity, is_active, is_featured, sort_order, certifications, sku) VALUES (
  'Glenorchy', 'Glenorchy', 'carpet-glenorchy', 'carpet',
  '匠心手工制作，选用新西兰苏利羊驼优质纤维，尽显自然优雅与卓越品质。苏利羊驼毛纤维细长丝滑，赋予每张地毯柔和光泽与顺滑触感，风格现代精致，脚感温暖持久。天然低敏、可持续采集，每件皆为纯手工制作，独一无二。是一件历久弥新、工艺考究的地毯艺术品，为空间带来低调奢华与舒适质感。',
  'Handcrafted from luxurious Suri alpaca fibre, these carpets are a celebration of natural elegance and exceptional quality. Suri alpaca fibre is prized for its long, silky strands that create a soft lustre and smooth texture, giving each carpet a refined, contemporary look while remaining warm and durable underfoot. Naturally hypoallergenic and sustainably sourced, every piece is individually handmade, ensuring no two carpets are ever the same. Quality: 9/45 Persian knot (100knt), 10-12mm pile length.',
  840.00, 'https://pacificalpacas.com/wp-content/uploads/2026/04/RUG10-01.jpg',
  '[{"url":"https://pacificalpacas.com/wp-content/uploads/2026/04/RUG10-01.jpg","alt":"Glenorchy","is_primary":true}]'::jsonb,
  '["70cm x 140cm (0.98m2)","90cm x 160cm (1.44m2)","120cm x 180cm (2.16m2)","140cm x 200cm (2.80m2)","170cm x 240cm (4.08m2)","200cm x 200cm (4.00m2)","200cm x 250cm (5.00m2)","200cm x 300cm (6.00m2)","250cm x 300cm (7.50m2)","250cm x 350cm (8.75m2)","300cm x 400cm (12.00m2)"]'::jsonb,
  '100% New Zealand Suri Alpaca Fibre', 5, 5, true, false, 19, ARRAY['NZ Grown'], 'RUG10'
);

INSERT INTO public.products (name_zh, name_en, slug, category, description_zh, description_en, price_nzd, image, images, size_options, fill_material, stock, stock_quantity, is_active, is_featured, sort_order, certifications, sku) VALUES (
  'Rotorua', 'Rotorua', 'carpet-rotorua', 'carpet',
  '匠心手工制作，选用新西兰苏利羊驼优质纤维，尽显自然优雅与卓越品质。苏利羊驼毛纤维细长丝滑，赋予每张地毯柔和光泽与顺滑触感，风格现代精致，脚感温暖持久。天然低敏、可持续采集，每件皆为纯手工制作，独一无二。是一件历久弥新、工艺考究的地毯艺术品，为空间带来低调奢华与舒适质感。',
  'Handcrafted from luxurious Suri alpaca fibre, these carpets are a celebration of natural elegance and exceptional quality. Suri alpaca fibre is prized for its long, silky strands that create a soft lustre and smooth texture, giving each carpet a refined, contemporary look while remaining warm and durable underfoot. Naturally hypoallergenic and sustainably sourced, every piece is individually handmade, ensuring no two carpets are ever the same. Quality: 9/45 Persian knot (100knt), 10-12mm pile length.',
  840.00, 'https://pacificalpacas.com/wp-content/uploads/2026/04/RUG09-01.jpg',
  '[{"url":"https://pacificalpacas.com/wp-content/uploads/2026/04/RUG09-01.jpg","alt":"Rotorua","is_primary":true}]'::jsonb,
  '["70cm x 140cm (0.98m2)","90cm x 160cm (1.44m2)","120cm x 180cm (2.16m2)","140cm x 200cm (2.80m2)","170cm x 240cm (4.08m2)","200cm x 200cm (4.00m2)","200cm x 250cm (5.00m2)","200cm x 300cm (6.00m2)","250cm x 300cm (7.50m2)","250cm x 350cm (8.75m2)","300cm x 400cm (12.00m2)"]'::jsonb,
  '100% New Zealand Suri Alpaca Fibre', 5, 5, true, false, 20, ARRAY['NZ Grown'], 'RUG09'
);

INSERT INTO public.products (name_zh, name_en, slug, category, description_zh, description_en, price_nzd, image, images, size_options, fill_material, stock, stock_quantity, is_active, is_featured, sort_order, certifications, sku) VALUES (
  'Naseby', 'Naseby', 'carpet-naseby', 'carpet',
  '匠心手工制作，选用新西兰苏利羊驼优质纤维，尽显自然优雅与卓越品质。苏利羊驼毛纤维细长丝滑，赋予每张地毯柔和光泽与顺滑触感，风格现代精致，脚感温暖持久。天然低敏、可持续采集，每件皆为纯手工制作，独一无二。是一件历久弥新、工艺考究的地毯艺术品，为空间带来低调奢华与舒适质感。',
  'Handcrafted from luxurious Suri alpaca fibre, these carpets are a celebration of natural elegance and exceptional quality. Suri alpaca fibre is prized for its long, silky strands that create a soft lustre and smooth texture, giving each carpet a refined, contemporary look while remaining warm and durable underfoot. Naturally hypoallergenic and sustainably sourced, every piece is individually handmade, ensuring no two carpets are ever the same. Quality: 9/45 Persian knot (100knt), 10-12mm pile length.',
  840.00, 'https://pacificalpacas.com/wp-content/uploads/2026/04/RUG08-01.jpg',
  '[{"url":"https://pacificalpacas.com/wp-content/uploads/2026/04/RUG08-01.jpg","alt":"Naseby","is_primary":true}]'::jsonb,
  '["70cm x 140cm (0.98m2)","90cm x 160cm (1.44m2)","120cm x 180cm (2.16m2)","140cm x 200cm (2.80m2)","170cm x 240cm (4.08m2)","200cm x 200cm (4.00m2)","200cm x 250cm (5.00m2)","200cm x 300cm (6.00m2)","250cm x 300cm (7.50m2)","250cm x 350cm (8.75m2)","300cm x 400cm (12.00m2)"]'::jsonb,
  '100% New Zealand Suri Alpaca Fibre', 5, 5, true, false, 21, ARRAY['NZ Grown'], 'RUG08'
);

INSERT INTO public.products (name_zh, name_en, slug, category, description_zh, description_en, price_nzd, image, images, size_options, fill_material, stock, stock_quantity, is_active, is_featured, sort_order, certifications, sku) VALUES (
  'Nelson', 'Nelson', 'carpet-nelson', 'carpet',
  '匠心手工制作，选用新西兰苏利羊驼优质纤维，尽显自然优雅与卓越品质。苏利羊驼毛纤维细长丝滑，赋予每张地毯柔和光泽与顺滑触感，风格现代精致，脚感温暖持久。天然低敏、可持续采集，每件皆为纯手工制作，独一无二。是一件历久弥新、工艺考究的地毯艺术品，为空间带来低调奢华与舒适质感。',
  'Handcrafted from luxurious Suri alpaca fibre, these carpets are a celebration of natural elegance and exceptional quality. Suri alpaca fibre is prized for its long, silky strands that create a soft lustre and smooth texture, giving each carpet a refined, contemporary look while remaining warm and durable underfoot. Naturally hypoallergenic and sustainably sourced, every piece is individually handmade, ensuring no two carpets are ever the same. Quality: 9/45 Persian knot (100knt), 10-12mm pile length.',
  840.00, 'https://pacificalpacas.com/wp-content/uploads/2026/04/RUG07-01.jpg',
  '[{"url":"https://pacificalpacas.com/wp-content/uploads/2026/04/RUG07-01.jpg","alt":"Nelson","is_primary":true}]'::jsonb,
  '["70cm x 140cm (0.98m2)","90cm x 160cm (1.44m2)","120cm x 180cm (2.16m2)","140cm x 200cm (2.80m2)","170cm x 240cm (4.08m2)","200cm x 200cm (4.00m2)","200cm x 250cm (5.00m2)","200cm x 300cm (6.00m2)","250cm x 300cm (7.50m2)","250cm x 350cm (8.75m2)","300cm x 400cm (12.00m2)"]'::jsonb,
  '100% New Zealand Suri Alpaca Fibre', 5, 5, true, false, 22, ARRAY['NZ Grown'], 'RUG07'
);

INSERT INTO public.products (name_zh, name_en, slug, category, description_zh, description_en, price_nzd, image, images, size_options, fill_material, stock, stock_quantity, is_active, is_featured, sort_order, certifications, sku) VALUES (
  'Balclutha', 'Balclutha', 'carpet-balclutha', 'carpet',
  '匠心手工制作，选用新西兰苏利羊驼优质纤维，尽显自然优雅与卓越品质。苏利羊驼毛纤维细长丝滑，赋予每张地毯柔和光泽与顺滑触感，风格现代精致，脚感温暖持久。天然低敏、可持续采集，每件皆为纯手工制作，独一无二。是一件历久弥新、工艺考究的地毯艺术品，为空间带来低调奢华与舒适质感。',
  'Handcrafted from luxurious Suri alpaca fibre, these carpets are a celebration of natural elegance and exceptional quality. Suri alpaca fibre is prized for its long, silky strands that create a soft lustre and smooth texture, giving each carpet a refined, contemporary look while remaining warm and durable underfoot. Naturally hypoallergenic and sustainably sourced, every piece is individually handmade, ensuring no two carpets are ever the same. Quality: 9/45 Persian knot (100knt), 10-12mm pile length.',
  840.00, 'https://pacificalpacas.com/wp-content/uploads/2026/04/RUG06-01.jpg',
  '[{"url":"https://pacificalpacas.com/wp-content/uploads/2026/04/RUG06-01.jpg","alt":"Balclutha","is_primary":true}]'::jsonb,
  '["70cm x 140cm (0.98m2)","90cm x 160cm (1.44m2)","120cm x 180cm (2.16m2)","140cm x 200cm (2.80m2)","170cm x 240cm (4.08m2)","200cm x 200cm (4.00m2)","200cm x 250cm (5.00m2)","200cm x 300cm (6.00m2)","250cm x 300cm (7.50m2)","250cm x 350cm (8.75m2)","300cm x 400cm (12.00m2)"]'::jsonb,
  '100% New Zealand Suri Alpaca Fibre', 5, 5, true, false, 23, ARRAY['NZ Grown'], 'RUG06'
);

INSERT INTO public.products (name_zh, name_en, slug, category, description_zh, description_en, price_nzd, image, images, size_options, fill_material, stock, stock_quantity, is_active, is_featured, sort_order, certifications, sku) VALUES (
  'Ophir', 'Ophir', 'carpet-ophir', 'carpet',
  '匠心手工制作，选用新西兰苏利羊驼优质纤维，尽显自然优雅与卓越品质。苏利羊驼毛纤维细长丝滑，赋予每张地毯柔和光泽与顺滑触感，风格现代精致，脚感温暖持久。天然低敏、可持续采集，每件皆为纯手工制作，独一无二。是一件历久弥新、工艺考究的地毯艺术品，为空间带来低调奢华与舒适质感。',
  'Handcrafted from luxurious Suri alpaca fibre, these carpets are a celebration of natural elegance and exceptional quality. Suri alpaca fibre is prized for its long, silky strands that create a soft lustre and smooth texture, giving each carpet a refined, contemporary look while remaining warm and durable underfoot. Naturally hypoallergenic and sustainably sourced, every piece is individually handmade, ensuring no two carpets are ever the same. Quality: 9/45 Persian knot (100knt), 10-12mm pile length.',
  840.00, 'https://pacificalpacas.com/wp-content/uploads/2026/04/RUG05-01.jpg',
  '[{"url":"https://pacificalpacas.com/wp-content/uploads/2026/04/RUG05-01.jpg","alt":"Ophir","is_primary":true}]'::jsonb,
  '["70cm x 140cm (0.98m2)","90cm x 160cm (1.44m2)","120cm x 180cm (2.16m2)","140cm x 200cm (2.80m2)","170cm x 240cm (4.08m2)","200cm x 200cm (4.00m2)","200cm x 250cm (5.00m2)","200cm x 300cm (6.00m2)","250cm x 300cm (7.50m2)","250cm x 350cm (8.75m2)","300cm x 400cm (12.00m2)"]'::jsonb,
  '100% New Zealand Suri Alpaca Fibre', 5, 5, true, false, 24, ARRAY['NZ Grown'], 'RUG05'
);

INSERT INTO public.products (name_zh, name_en, slug, category, description_zh, description_en, price_nzd, image, images, size_options, fill_material, stock, stock_quantity, is_active, is_featured, sort_order, certifications, sku) VALUES (
  'Akaroa', 'Akaroa', 'carpet-akaroa', 'carpet',
  '匠心手工制作，选用新西兰苏利羊驼优质纤维，尽显自然优雅与卓越品质。苏利羊驼毛纤维细长丝滑，赋予每张地毯柔和光泽与顺滑触感，风格现代精致，脚感温暖持久。天然低敏、可持续采集，每件皆为纯手工制作，独一无二。是一件历久弥新、工艺考究的地毯艺术品，为空间带来低调奢华与舒适质感。',
  'Handcrafted from luxurious Suri alpaca fibre, these carpets are a celebration of natural elegance and exceptional quality. Suri alpaca fibre is prized for its long, silky strands that create a soft lustre and smooth texture, giving each carpet a refined, contemporary look while remaining warm and durable underfoot. Naturally hypoallergenic and sustainably sourced, every piece is individually handmade, ensuring no two carpets are ever the same. Quality: 9/45 Persian knot (100knt), 10-12mm pile length.',
  840.00, 'https://pacificalpacas.com/wp-content/uploads/2026/04/RUG04-01.jpg',
  '[{"url":"https://pacificalpacas.com/wp-content/uploads/2026/04/RUG04-01.jpg","alt":"Akaroa","is_primary":true}]'::jsonb,
  '["70cm x 140cm (0.98m2)","90cm x 160cm (1.44m2)","120cm x 180cm (2.16m2)","140cm x 200cm (2.80m2)","170cm x 240cm (4.08m2)","200cm x 200cm (4.00m2)","200cm x 250cm (5.00m2)","200cm x 300cm (6.00m2)","250cm x 300cm (7.50m2)","250cm x 350cm (8.75m2)","300cm x 400cm (12.00m2)"]'::jsonb,
  '100% New Zealand Suri Alpaca Fibre', 5, 5, true, false, 25, ARRAY['NZ Grown'], 'RUG04'
);

INSERT INTO public.products (name_zh, name_en, slug, category, description_zh, description_en, price_nzd, image, images, size_options, fill_material, stock, stock_quantity, is_active, is_featured, sort_order, certifications, sku) VALUES (
  'Tongariro', 'Tongariro', 'carpet-tongariro', 'carpet',
  '匠心手工制作，选用新西兰苏利羊驼优质纤维，尽显自然优雅与卓越品质。苏利羊驼毛纤维细长丝滑，赋予每张地毯柔和光泽与顺滑触感，风格现代精致，脚感温暖持久。天然低敏、可持续采集，每件皆为纯手工制作，独一无二。是一件历久弥新、工艺考究的地毯艺术品，为空间带来低调奢华与舒适质感。',
  'Handcrafted from luxurious Suri alpaca fibre, these carpets are a celebration of natural elegance and exceptional quality. Suri alpaca fibre is prized for its long, silky strands that create a soft lustre and smooth texture, giving each carpet a refined, contemporary look while remaining warm and durable underfoot. Naturally hypoallergenic and sustainably sourced, every piece is individually handmade, ensuring no two carpets are ever the same. Quality: 9/45 Persian knot (100knt), 10-12mm pile length.',
  840.00, 'https://pacificalpacas.com/wp-content/uploads/2026/04/RUG03-01.jpg',
  '[{"url":"https://pacificalpacas.com/wp-content/uploads/2026/04/RUG03-01.jpg","alt":"Tongariro","is_primary":true}]'::jsonb,
  '["70cm x 140cm (0.98m2)","90cm x 160cm (1.44m2)","120cm x 180cm (2.16m2)","140cm x 200cm (2.80m2)","170cm x 240cm (4.08m2)","200cm x 200cm (4.00m2)","200cm x 250cm (5.00m2)","200cm x 300cm (6.00m2)","250cm x 300cm (7.50m2)","250cm x 350cm (8.75m2)","300cm x 400cm (12.00m2)"]'::jsonb,
  '100% New Zealand Suri Alpaca Fibre', 5, 5, true, false, 26, ARRAY['NZ Grown'], 'RUG03'
);

INSERT INTO public.products (name_zh, name_en, slug, category, description_zh, description_en, price_nzd, image, images, size_options, fill_material, stock, stock_quantity, is_active, is_featured, sort_order, certifications, sku) VALUES (
  'Manakau', 'Manakau', 'carpet-manakau', 'carpet',
  '匠心手工制作，选用新西兰苏利羊驼优质纤维，尽显自然优雅与卓越品质。苏利羊驼毛纤维细长丝滑，赋予每张地毯柔和光泽与顺滑触感，风格现代精致，脚感温暖持久。天然低敏、可持续采集，每件皆为纯手工制作，独一无二。是一件历久弥新、工艺考究的地毯艺术品，为空间带来低调奢华与舒适质感。',
  'Handcrafted from luxurious Suri alpaca fibre, these carpets are a celebration of natural elegance and exceptional quality. Suri alpaca fibre is prized for its long, silky strands that create a soft lustre and smooth texture, giving each carpet a refined, contemporary look while remaining warm and durable underfoot. Naturally hypoallergenic and sustainably sourced, every piece is individually handmade, ensuring no two carpets are ever the same. Quality: 9/45 Persian knot (100knt), 10-12mm pile length.',
  840.00, 'https://pacificalpacas.com/wp-content/uploads/2026/04/RUG02-01.jpg',
  '[{"url":"https://pacificalpacas.com/wp-content/uploads/2026/04/RUG02-01.jpg","alt":"Manakau","is_primary":true}]'::jsonb,
  '["70cm x 140cm (0.98m2)","90cm x 160cm (1.44m2)","120cm x 180cm (2.16m2)","140cm x 200cm (2.80m2)","170cm x 240cm (4.08m2)","200cm x 200cm (4.00m2)","200cm x 250cm (5.00m2)","200cm x 300cm (6.00m2)","250cm x 300cm (7.50m2)","250cm x 350cm (8.75m2)","300cm x 400cm (12.00m2)"]'::jsonb,
  '100% New Zealand Suri Alpaca Fibre', 5, 5, true, false, 27, ARRAY['NZ Grown'], 'RUG02'
);

INSERT INTO public.products (name_zh, name_en, slug, category, description_zh, description_en, price_nzd, image, images, size_options, fill_material, stock, stock_quantity, is_active, is_featured, sort_order, certifications, sku) VALUES (
  'Haast', 'Haast', 'carpet-haast', 'carpet',
  '匠心手工制作，选用新西兰苏利羊驼优质纤维，尽显自然优雅与卓越品质。苏利羊驼毛纤维细长丝滑，赋予每张地毯柔和光泽与顺滑触感，风格现代精致，脚感温暖持久。天然低敏、可持续采集，每件皆为纯手工制作，独一无二。是一件历久弥新、工艺考究的地毯艺术品，为空间带来低调奢华与舒适质感。',
  'Handcrafted from luxurious Suri alpaca fibre, these carpets are a celebration of natural elegance and exceptional quality. Suri alpaca fibre is prized for its long, silky strands that create a soft lustre and smooth texture, giving each carpet a refined, contemporary look while remaining warm and durable underfoot. Naturally hypoallergenic and sustainably sourced, every piece is individually handmade, ensuring no two carpets are ever the same. Quality: 9/45 Persian knot (100knt), 10-12mm pile length.',
  840.00, 'https://pacificalpacas.com/wp-content/uploads/2026/04/RUG01-01.jpg',
  '[{"url":"https://pacificalpacas.com/wp-content/uploads/2026/04/RUG01-01.jpg","alt":"Haast","is_primary":true}]'::jsonb,
  '["70cm x 140cm (0.98m2)","90cm x 160cm (1.44m2)","120cm x 180cm (2.16m2)","140cm x 200cm (2.80m2)","170cm x 240cm (4.08m2)","200cm x 200cm (4.00m2)","200cm x 250cm (5.00m2)","200cm x 300cm (6.00m2)","250cm x 300cm (7.50m2)","250cm x 350cm (8.75m2)","300cm x 400cm (12.00m2)"]'::jsonb,
  '100% New Zealand Suri Alpaca Fibre', 5, 5, true, false, 28, ARRAY['NZ Grown'], 'RUG01'
);


-- Adds SKU tracking to products, matching the real WooCommerce catalogue
-- on pacificalpacas.com (e.g. "PAD62" for All-Seasons Duvets). Nullable
-- because some real products (e.g. Spring/Autumn Duvets) have no SKU set
-- on the live site either. Partial unique index so multiple NULLs are
-- allowed but any two products can't share a real SKU.

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku text;
CREATE UNIQUE INDEX IF NOT EXISTS products_sku_key ON public.products (sku) WHERE sku IS NOT NULL;

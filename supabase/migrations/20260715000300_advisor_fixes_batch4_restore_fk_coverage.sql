-- Correction to batch1: growers_user_id_idx and product_certificates_product_id_idx
-- were flagged "unused" by the advisor and dropped, but they were each the *only*
-- covering index for a foreign key (growers.user_id -> auth.users, product_certificates.
-- product_id -> products). Dropping them turned an "unused index" finding into a new
-- "unindexed foreign key" finding. Re-add them under clearer names.

CREATE INDEX IF NOT EXISTS idx_growers_user_id ON public.growers(user_id);
CREATE INDEX IF NOT EXISTS idx_product_certificates_product_id ON public.product_certificates(product_id);

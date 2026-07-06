-- Addresses CLAUDE.md §20 tech debt: "Move promo code validation to DB
-- (promo_codes table) instead of the hardcoded constant in create-checkout."
--
-- Design: pricing a Stripe session (create-checkout) only needs a read-only
-- preview of the discount — the customer hasn't paid yet, so nothing should
-- be consumed there. The usage count must only be decremented once payment
-- is actually confirmed (stripe-webhook, on checkout.session.completed),
-- and that decrement must be atomic: two customers completing payment for
-- the same limited-usage code in the same instant must not both succeed if
-- only one use is left. SELECT-then-UPDATE from application code is a
-- classic TOCTOU race; FOR UPDATE row locking inside one function call is
-- not.
--
-- Returns the discount amount actually applied, or 0 if the code doesn't
-- exist, is inactive, expired, exhausted, or below the minimum order.

CREATE OR REPLACE FUNCTION public.claim_promo_code(_code text, _subtotal_nzd numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.promo_codes;
  discount numeric := 0;
BEGIN
  IF _code IS NULL THEN RETURN 0; END IF;

  SELECT * INTO rec FROM public.promo_codes
   WHERE code = upper(_code) AND is_active = true
   FOR UPDATE;

  IF rec.id IS NULL THEN RETURN 0; END IF;
  IF rec.expires_at IS NOT NULL AND rec.expires_at < now() THEN RETURN 0; END IF;
  IF rec.usage_limit IS NOT NULL AND COALESCE(rec.used_count, 0) >= rec.usage_limit THEN RETURN 0; END IF;
  IF rec.min_order_nzd IS NOT NULL AND _subtotal_nzd < rec.min_order_nzd THEN RETURN 0; END IF;

  discount := CASE
    WHEN rec.discount_type = 'percent' THEN round((_subtotal_nzd * rec.discount_value / 100)::numeric, 2)
    ELSE rec.discount_value
  END;

  UPDATE public.promo_codes SET used_count = COALESCE(used_count, 0) + 1 WHERE id = rec.id;

  RETURN discount;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_promo_code(text, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_promo_code(text, numeric) TO service_role;

-- Move order creation to the Stripe webhook handler so an order row only
-- exists after payment is confirmed. checkout_sessions stores cart + shipping
-- data while the user completes payment in Stripe; the webhook reads it and
-- creates the real orders row with status='paid'.

CREATE TABLE IF NOT EXISTS public.checkout_sessions (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id text        UNIQUE,
  user_id          uuid        NOT NULL REFERENCES auth.users(id),
  order_number     text        NOT NULL,
  items            jsonb       NOT NULL,
  shipping_name    text        NOT NULL,
  shipping_email   text        NOT NULL,
  shipping_phone   text,
  shipping_address jsonb,
  currency         text        NOT NULL DEFAULT 'NZD',
  subtotal         numeric(10,2) NOT NULL,
  discount         numeric(10,2) NOT NULL DEFAULT 0,
  shipping_cost    numeric(10,2) NOT NULL DEFAULT 0,
  total            numeric(10,2) NOT NULL,
  promo_code       text,
  status           text        NOT NULL DEFAULT 'pending_payment'
                     CHECK (status IN ('pending_payment', 'completed', 'abandoned')),
  created_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;
-- Service role key bypasses RLS; users never query this table directly.

-- Clean up old pending sessions after 24 hours (belt-and-suspenders for
-- checkout_session.expired webhook which sets status='abandoned').
CREATE INDEX IF NOT EXISTS checkout_sessions_created_at_idx
  ON public.checkout_sessions (created_at);

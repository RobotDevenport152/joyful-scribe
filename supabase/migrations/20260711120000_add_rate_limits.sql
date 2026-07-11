-- Rate limiting for public, unauthenticated edge functions (chat, recommend)
-- that call a paid third-party AI API. Without this, anyone with the public
-- anon key can hammer these endpoints and run up API cost.

CREATE TABLE public.rate_limits (
  key text PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 0
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies granted to anon/authenticated — only service_role (via the
-- RPC below, which runs as SECURITY DEFINER) may read or write this table.

CREATE OR REPLACE FUNCTION public.check_rate_limit(_key text, _limit integer, _window_seconds integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec public.rate_limits;
BEGIN
  SELECT * INTO rec FROM public.rate_limits WHERE key = _key FOR UPDATE;

  IF rec.key IS NULL THEN
    INSERT INTO public.rate_limits (key, window_start, request_count)
    VALUES (_key, now(), 1);
    RETURN true;
  END IF;

  IF rec.window_start < now() - make_interval(secs => _window_seconds) THEN
    UPDATE public.rate_limits SET window_start = now(), request_count = 1 WHERE key = _key;
    RETURN true;
  END IF;

  IF rec.request_count >= _limit THEN
    RETURN false;
  END IF;

  UPDATE public.rate_limits SET request_count = request_count + 1 WHERE key = _key;
  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO service_role;

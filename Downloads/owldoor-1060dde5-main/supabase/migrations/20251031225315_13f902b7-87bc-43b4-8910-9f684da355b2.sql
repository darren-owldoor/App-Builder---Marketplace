-- Fix the cleanup function to have immutable search_path
DROP FUNCTION IF EXISTS cleanup_expired_2fa_codes();

CREATE OR REPLACE FUNCTION cleanup_expired_2fa_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  DELETE FROM public.two_factor_verifications
  WHERE expires_at < now() - INTERVAL '24 hours';
END;
$$;
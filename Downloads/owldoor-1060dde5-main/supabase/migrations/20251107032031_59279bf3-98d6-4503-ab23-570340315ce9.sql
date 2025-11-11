-- Fix generate_package_access_token function to have fixed search_path
-- This prevents potential privilege escalation attacks

CREATE OR REPLACE FUNCTION public.generate_package_access_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$;
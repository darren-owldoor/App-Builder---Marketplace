-- Fix base64url encoding issue in generate_package_access_token function
-- PostgreSQL doesn't support base64url in older versions, use base64 instead
CREATE OR REPLACE FUNCTION generate_package_access_token()
RETURNS text AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
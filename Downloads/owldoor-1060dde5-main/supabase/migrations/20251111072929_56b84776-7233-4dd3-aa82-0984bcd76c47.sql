-- Fix security warning: Update find_redirect function with proper search_path
DROP FUNCTION IF EXISTS public.find_redirect(TEXT);

CREATE OR REPLACE FUNCTION public.find_redirect(p_path TEXT)
RETURNS TABLE(to_path TEXT, status_code INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Update hit count and return redirect if found
  RETURN QUERY
  UPDATE url_redirects
  SET 
    hit_count = hit_count + 1,
    last_hit_at = NOW()
  WHERE from_path = p_path 
    AND is_active = true
  RETURNING url_redirects.to_path, url_redirects.status_code;
END;
$$;
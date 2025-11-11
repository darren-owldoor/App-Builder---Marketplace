-- Fix security warning for generate_full_name function
CREATE OR REPLACE FUNCTION public.generate_full_name(first TEXT, last TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT TRIM(CONCAT(first, ' ', last))
$$;
-- Fix search_path security warnings for the three new trigger functions

-- Update update_full_name function with search_path
CREATE OR REPLACE FUNCTION public.update_full_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Auto-generate full_name when first_name or last_name changes
  NEW.full_name := TRIM(CONCAT(COALESCE(NEW.first_name, ''), ' ', COALESCE(NEW.last_name, '')));
  RETURN NEW;
END;
$$;

-- Update update_pros_full_name function with search_path
CREATE OR REPLACE FUNCTION public.update_pros_full_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Auto-generate full_name when first_name or last_name changes
  NEW.full_name := TRIM(CONCAT(COALESCE(NEW.first_name, ''), ' ', COALESCE(NEW.last_name, '')));
  RETURN NEW;
END;
$$;

-- Update update_clients_full_name function with search_path
CREATE OR REPLACE FUNCTION public.update_clients_full_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Auto-generate contact_name when first_name or last_name changes
  IF NEW.first_name IS NOT NULL OR NEW.last_name IS NOT NULL THEN
    NEW.contact_name := TRIM(CONCAT(COALESCE(NEW.first_name, ''), ' ', COALESCE(NEW.last_name, '')));
  END IF;
  RETURN NEW;
END;
$$;
-- Add first_name and last_name fields to key tables

-- Update leads table
ALTER TABLE public.leads
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Update clients table
ALTER TABLE public.clients
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Update profiles table  
ALTER TABLE public.profiles
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Create function to generate full_name from first and last
CREATE OR REPLACE FUNCTION public.generate_full_name(first TEXT, last TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT TRIM(CONCAT(first, ' ', last))
$$;

-- Update existing full_name values to populate first_name (temporary migration helper)
-- This splits existing full_name into first_name (first word) and last_name (rest)
UPDATE public.leads
SET 
  first_name = SPLIT_PART(full_name, ' ', 1),
  last_name = TRIM(SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1))
WHERE full_name IS NOT NULL AND full_name != '';

UPDATE public.profiles
SET 
  first_name = SPLIT_PART(full_name, ' ', 1),
  last_name = TRIM(SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1))
WHERE full_name IS NOT NULL AND full_name != '';

-- Update clients contact_name to first_name/last_name
UPDATE public.clients
SET 
  first_name = SPLIT_PART(contact_name, ' ', 1),
  last_name = TRIM(SUBSTRING(contact_name FROM POSITION(' ' IN contact_name) + 1))
WHERE contact_name IS NOT NULL AND contact_name != '';

-- Update handle_new_user trigger to use first_name and last_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$function$;
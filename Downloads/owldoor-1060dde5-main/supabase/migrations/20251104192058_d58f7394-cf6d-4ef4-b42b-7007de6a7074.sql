-- Update the handle_new_user function to auto-generate full_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
  v_full_name TEXT;
BEGIN
  -- Extract first and last names from metadata
  v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  
  -- Generate full_name by combining first_name and last_name
  v_full_name := TRIM(CONCAT(v_first_name, ' ', v_last_name));
  
  -- If full_name is empty, try to use the full_name from metadata directly
  IF v_full_name = '' THEN
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  END IF;
  
  -- Insert into profiles with auto-generated full_name
  INSERT INTO public.profiles (id, email, first_name, last_name, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    v_first_name,
    v_last_name,
    v_full_name
  );
  
  RETURN NEW;
END;
$$;

-- Create a trigger function for auto-updating full_name in profiles
CREATE OR REPLACE FUNCTION public.update_full_name()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Auto-generate full_name when first_name or last_name changes
  NEW.full_name := TRIM(CONCAT(COALESCE(NEW.first_name, ''), ' ', COALESCE(NEW.last_name, '')));
  RETURN NEW;
END;
$$;

-- Add trigger to profiles table to auto-update full_name
DROP TRIGGER IF EXISTS update_profiles_full_name ON public.profiles;
CREATE TRIGGER update_profiles_full_name
  BEFORE INSERT OR UPDATE OF first_name, last_name
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_full_name();

-- Create trigger function for pros table
CREATE OR REPLACE FUNCTION public.update_pros_full_name()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Auto-generate full_name when first_name or last_name changes
  NEW.full_name := TRIM(CONCAT(COALESCE(NEW.first_name, ''), ' ', COALESCE(NEW.last_name, '')));
  RETURN NEW;
END;
$$;

-- Add trigger to pros table to auto-update full_name
DROP TRIGGER IF EXISTS update_pros_full_name_trigger ON public.pros;
CREATE TRIGGER update_pros_full_name_trigger
  BEFORE INSERT OR UPDATE OF first_name, last_name
  ON public.pros
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pros_full_name();

-- Create trigger function for clients table
CREATE OR REPLACE FUNCTION public.update_clients_full_name()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Auto-generate contact_name when first_name or last_name changes
  IF NEW.first_name IS NOT NULL OR NEW.last_name IS NOT NULL THEN
    NEW.contact_name := TRIM(CONCAT(COALESCE(NEW.first_name, ''), ' ', COALESCE(NEW.last_name, '')));
  END IF;
  RETURN NEW;
END;
$$;

-- Add trigger to clients table to auto-update contact_name
DROP TRIGGER IF EXISTS update_clients_full_name_trigger ON public.clients;
CREATE TRIGGER update_clients_full_name_trigger
  BEFORE INSERT OR UPDATE OF first_name, last_name
  ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_clients_full_name();
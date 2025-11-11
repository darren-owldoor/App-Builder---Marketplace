-- Fix search_path on database functions for security hardening
-- This prevents search path manipulation attacks

-- Fix generate_full_name
CREATE OR REPLACE FUNCTION public.generate_full_name(first text, last text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT TRIM(CONCAT(first, ' ', last))
$function$;

-- Fix generate_ticket_number
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN 'TKT-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
END;
$function$;

-- Fix are_types_compatible
CREATE OR REPLACE FUNCTION public.are_types_compatible(p_pro_type character varying, p_client_type character varying)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN (
    (p_pro_type = 'real_estate_agent' AND p_client_type = 'real_estate') OR
    (p_pro_type = 'mortgage_officer' AND p_client_type = 'mortgage')
  );
END;
$function$;

-- Fix parse_full_address
CREATE OR REPLACE FUNCTION public.parse_full_address()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  address_parts text[];
  last_part text;
  state_zip text;
  extracted_state text;
  extracted_zip text;
  extracted_city text;
BEGIN
  -- Only parse if full_address is provided and has content
  IF NEW.full_address IS NOT NULL AND trim(NEW.full_address) != '' THEN
    -- Split by comma
    address_parts := string_to_array(NEW.full_address, ',');
    
    IF array_length(address_parts, 1) >= 2 THEN
      -- Get the last part which typically contains "State Zip"
      last_part := trim(address_parts[array_length(address_parts, 1)]);
      
      -- Try to extract State and Zip from last part (format: "CA 90210" or "CA  90210")
      -- Match 2-letter state code followed by optional spaces and 5-digit zip
      IF last_part ~ '^[A-Z]{2}\s+\d{5}(-\d{4})?$' THEN
        extracted_state := substring(last_part from '^([A-Z]{2})');
        extracted_zip := substring(last_part from '\d{5}(-\d{4})?$');
        
        -- Get city from second to last part
        IF array_length(address_parts, 1) >= 2 THEN
          extracted_city := trim(address_parts[array_length(address_parts, 1) - 1]);
        END IF;
      END IF;
      
      -- Update fields if we successfully extracted them
      IF extracted_city IS NOT NULL AND extracted_city != '' THEN
        NEW.cities := ARRAY[extracted_city];
      END IF;
      
      IF extracted_state IS NOT NULL AND extracted_state != '' THEN
        NEW.states := ARRAY[extracted_state];
      END IF;
      
      IF extracted_zip IS NOT NULL AND extracted_zip != '' THEN
        NEW.zip_codes := ARRAY[extracted_zip];
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix update_full_name
CREATE OR REPLACE FUNCTION public.update_full_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Auto-generate full_name when first_name or last_name changes
  NEW.full_name := TRIM(CONCAT(COALESCE(NEW.first_name, ''), ' ', COALESCE(NEW.last_name, '')));
  RETURN NEW;
END;
$function$;

-- Fix update_pros_full_name
CREATE OR REPLACE FUNCTION public.update_pros_full_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Auto-generate full_name when first_name or last_name changes
  NEW.full_name := TRIM(CONCAT(COALESCE(NEW.first_name, ''), ' ', COALESCE(NEW.last_name, '')));
  RETURN NEW;
END;
$function$;

-- Fix update_clients_full_name
CREATE OR REPLACE FUNCTION public.update_clients_full_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Auto-generate contact_name when first_name or last_name changes
  IF NEW.first_name IS NOT NULL OR NEW.last_name IS NOT NULL THEN
    NEW.contact_name := TRIM(CONCAT(COALESCE(NEW.first_name, ''), ' ', COALESCE(NEW.last_name, '')));
  END IF;
  RETURN NEW;
END;
$function$;
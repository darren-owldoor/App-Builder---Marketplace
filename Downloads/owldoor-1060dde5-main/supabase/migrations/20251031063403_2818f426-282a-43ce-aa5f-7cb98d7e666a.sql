-- Add full_address field to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS full_address text;

-- Function to parse full address and extract city, state, zip
CREATE OR REPLACE FUNCTION public.parse_full_address()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
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
$$;

-- Create trigger to automatically parse full_address on insert or update
DROP TRIGGER IF EXISTS parse_full_address_trigger ON leads;
CREATE TRIGGER parse_full_address_trigger
  BEFORE INSERT OR UPDATE OF full_address ON leads
  FOR EACH ROW
  EXECUTE FUNCTION parse_full_address();
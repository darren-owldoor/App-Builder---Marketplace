-- Fix search_path security issue for validate_bid_location function
DROP FUNCTION IF EXISTS validate_bid_location() CASCADE;

CREATE OR REPLACE FUNCTION validate_bid_location()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure at least one location field has data
  IF (NEW.zip_codes IS NULL OR array_length(NEW.zip_codes, 1) IS NULL)
     AND (NEW.cities IS NULL OR array_length(NEW.cities, 1) IS NULL)
     AND (NEW.states IS NULL OR array_length(NEW.states, 1) IS NULL) THEN
    RAISE EXCEPTION 'Bid must have at least one location (zip_codes, cities, or states)';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-apply validation trigger
DROP TRIGGER IF EXISTS ensure_bid_location ON bids;
CREATE TRIGGER ensure_bid_location
  BEFORE INSERT OR UPDATE ON bids
  FOR EACH ROW
  EXECUTE FUNCTION validate_bid_location();
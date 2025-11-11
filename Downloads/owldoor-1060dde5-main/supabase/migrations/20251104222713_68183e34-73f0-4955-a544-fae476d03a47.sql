-- Update bids table: Remove min_volume, ensure all numeric fields default to 0
-- Add motivation filter and ensure proper defaults

-- Drop min_volume column if it exists
ALTER TABLE bids DROP COLUMN IF EXISTS min_volume;

-- Ensure numeric fields have proper defaults
ALTER TABLE bids 
  ALTER COLUMN bid_amount SET DEFAULT 0,
  ALTER COLUMN max_leads_per_month SET DEFAULT 0,
  ALTER COLUMN min_experience SET DEFAULT 0,
  ALTER COLUMN min_transactions SET DEFAULT 0;

-- Add comment explaining location requirement
COMMENT ON TABLE bids IS 'Bids determine purchases. Matches MUST have at least one location overlap (zip, city, or state). Wants field is used for match scoring only.';

-- Create validation trigger to ensure at least one location field is set
CREATE OR REPLACE FUNCTION validate_bid_location()
RETURNS TRIGGER AS $$
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

-- Apply validation trigger
DROP TRIGGER IF EXISTS ensure_bid_location ON bids;
CREATE TRIGGER ensure_bid_location
  BEFORE INSERT OR UPDATE ON bids
  FOR EACH ROW
  EXECUTE FUNCTION validate_bid_location();

-- Update pros table to ensure motivation has a default
ALTER TABLE pros 
  ALTER COLUMN motivation SET DEFAULT 0;
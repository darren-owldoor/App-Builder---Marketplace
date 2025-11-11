-- Add coverage_areas column to pros and clients for geographic matching
ALTER TABLE pros ADD COLUMN IF NOT EXISTS coverage_areas JSONB DEFAULT '[]'::jsonb;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS coverage_areas JSONB DEFAULT '[]'::jsonb;

-- Add geographic coverage to bids table
ALTER TABLE bids ADD COLUMN IF NOT EXISTS coverage_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS min_experience INTEGER;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS min_transactions INTEGER;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS min_volume NUMERIC;
ALTER TABLE bids ADD COLUMN IF NOT EXISTS pro_type TEXT;

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_pros_coverage_areas ON pros USING gin(coverage_areas);
CREATE INDEX IF NOT EXISTS idx_clients_coverage_areas ON clients USING gin(coverage_areas);
CREATE INDEX IF NOT EXISTS idx_bids_coverage_data ON bids USING gin(coverage_data);
CREATE INDEX IF NOT EXISTS idx_bids_pro_type ON bids(pro_type);

-- Function to calculate coverage overlap score between bid and pro
CREATE OR REPLACE FUNCTION calculate_bid_match_score(
  bid_coverage JSONB,
  pro_coverage JSONB,
  bid_criteria JSONB,
  pro_data JSONB
) RETURNS INTEGER AS $$
DECLARE
  overlap_score INTEGER := 0;
  criteria_score INTEGER := 0;
  total_score INTEGER := 0;
BEGIN
  -- Geographic overlap scoring (40 points max)
  -- Count matching ZIP codes
  overlap_score := overlap_score + (
    SELECT COUNT(*)
    FROM jsonb_array_elements(pro_coverage) AS pro_area
    CROSS JOIN jsonb_array_elements(bid_coverage) AS bid_area
    WHERE pro_area->>'type' = 'zip' 
    AND bid_area->>'type' = 'zip'
    AND pro_area->>'name' = bid_area->>'name'
  ) * 5;
  
  -- Count matching cities
  overlap_score := overlap_score + (
    SELECT COUNT(*)
    FROM jsonb_array_elements(pro_coverage) AS pro_area
    CROSS JOIN jsonb_array_elements(bid_coverage) AS bid_area
    WHERE pro_area->>'type' = 'city' 
    AND bid_area->>'type' = 'city'
    AND pro_area->>'name' = bid_area->>'name'
  ) * 8;
  
  -- Radius overlap detection (simplified - checks if centers are within combined radii)
  overlap_score := overlap_score + (
    SELECT COUNT(*) * 10
    FROM jsonb_array_elements(pro_coverage) AS pro_area
    CROSS JOIN jsonb_array_elements(bid_coverage) AS bid_area
    WHERE pro_area->>'type' = 'radius' 
    AND bid_area->>'type' = 'radius'
    AND (
      -- Simple distance check (approximate)
      ABS((pro_area->'data'->'center'->>'lat')::float - (bid_area->'data'->'center'->>'lat')::float) < 1
      AND ABS((pro_area->'data'->'center'->>'lng')::float - (bid_area->'data'->'center'->>'lng')::float) < 1
    )
  );
  
  -- Cap geographic score at 40
  overlap_score := LEAST(overlap_score, 40);
  
  -- Criteria matching (60 points max)
  -- Experience matching (20 points)
  IF bid_criteria->>'minExperience' IS NOT NULL THEN
    IF (pro_data->>'experience')::integer >= (bid_criteria->>'minExperience')::integer THEN
      criteria_score := criteria_score + 20;
    END IF;
  ELSE
    criteria_score := criteria_score + 20; -- No requirement = full points
  END IF;
  
  -- Transaction volume matching (20 points)
  IF bid_criteria->>'minTransactions' IS NOT NULL THEN
    IF (pro_data->>'transactions')::integer >= (bid_criteria->>'minTransactions')::integer THEN
      criteria_score := criteria_score + 20;
    END IF;
  ELSE
    criteria_score := criteria_score + 20;
  END IF;
  
  -- Qualification score (20 points based on percentage)
  IF pro_data->>'qualification_score' IS NOT NULL THEN
    criteria_score := criteria_score + LEAST((pro_data->>'qualification_score')::integer / 5, 20);
  END IF;
  
  total_score := overlap_score + criteria_score;
  
  RETURN LEAST(total_score, 100);
END;
$$ LANGUAGE plpgsql;
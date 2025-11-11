-- Add pricing tier to matches table
ALTER TABLE matches ADD COLUMN IF NOT EXISTS pricing_tier TEXT CHECK (pricing_tier IN ('basic', 'qualified', 'premium'));
ALTER TABLE matches ADD COLUMN IF NOT EXISTS purchased BOOLEAN DEFAULT FALSE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_matches_client_purchased ON matches(client_id, purchased);

-- Create function to calculate pricing tier based on agent stats
CREATE OR REPLACE FUNCTION calculate_pricing_tier(
  p_transactions INTEGER,
  p_experience INTEGER,
  p_qualification_score INTEGER
) RETURNS TEXT AS $$
BEGIN
  -- Premium: High performers with proven track record
  IF p_transactions >= 30 AND p_experience >= 10 AND p_qualification_score >= 80 THEN
    RETURN 'premium';
  -- Qualified: Mid-level with good experience
  ELSIF p_transactions >= 15 AND p_experience >= 5 AND p_qualification_score >= 60 THEN
    RETURN 'qualified';
  -- Basic: Entry level or new leads
  ELSE
    RETURN 'basic';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
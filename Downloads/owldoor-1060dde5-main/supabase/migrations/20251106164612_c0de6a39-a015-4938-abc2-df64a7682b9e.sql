-- Add quality scoring fields to market_coverage table
ALTER TABLE market_coverage
ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completeness_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS coverage_breadth_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS demand_overlap_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS score_details JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS last_scored_at TIMESTAMP WITH TIME ZONE;

-- Create function to calculate coverage quality score
CREATE OR REPLACE FUNCTION calculate_coverage_quality_score(coverage_id UUID)
RETURNS TABLE(
  total_score INTEGER,
  completeness INTEGER,
  breadth INTEGER,
  demand_overlap INTEGER,
  details JSONB
) 
LANGUAGE plpgsql
AS $$
DECLARE
  coverage_record RECORD;
  v_completeness_score INTEGER := 0;
  v_breadth_score INTEGER := 0;
  v_demand_score INTEGER := 0;
  v_total_score INTEGER := 0;
  v_zip_count INTEGER := 0;
  v_city_count INTEGER := 0;
  v_state_count INTEGER := 0;
  v_county_count INTEGER := 0;
  v_coord_count INTEGER := 0;
  v_details JSONB;
  v_high_demand_overlap INTEGER := 0;
  v_total_pros_in_area INTEGER := 0;
BEGIN
  -- Get the coverage record
  SELECT * INTO coverage_record
  FROM market_coverage
  WHERE id = coverage_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Coverage area not found';
  END IF;
  
  -- Extract data counts from the data JSONB field
  v_zip_count := COALESCE(jsonb_array_length(coverage_record.data->'zipCodes'), 0);
  v_city_count := COALESCE(jsonb_array_length(coverage_record.data->'cities'), 0);
  v_state_count := COALESCE(jsonb_array_length(coverage_record.data->'states'), 0);
  v_county_count := COALESCE(jsonb_array_length(coverage_record.data->'counties'), 0);
  v_coord_count := COALESCE(jsonb_array_length(coverage_record.data->'coordinates'), 0);
  
  -- Calculate Completeness Score (0-40 points)
  -- Award points for having each type of geocoded data
  IF v_zip_count > 0 THEN v_completeness_score := v_completeness_score + 15; END IF;
  IF v_city_count > 0 THEN v_completeness_score := v_completeness_score + 10; END IF;
  IF v_state_count > 0 THEN v_completeness_score := v_completeness_score + 5; END IF;
  IF v_county_count > 0 THEN v_completeness_score := v_completeness_score + 5; END IF;
  IF v_coord_count > 0 THEN v_completeness_score := v_completeness_score + 5; END IF;
  
  -- Calculate Coverage Breadth Score (0-35 points)
  -- More locations = better coverage
  IF v_zip_count >= 50 THEN 
    v_breadth_score := 35;
  ELSIF v_zip_count >= 30 THEN 
    v_breadth_score := 28;
  ELSIF v_zip_count >= 15 THEN 
    v_breadth_score := 21;
  ELSIF v_zip_count >= 5 THEN 
    v_breadth_score := 14;
  ELSIF v_zip_count >= 1 THEN 
    v_breadth_score := 7;
  END IF;
  
  -- Bonus points for multi-city/county coverage
  IF v_city_count >= 5 THEN v_breadth_score := v_breadth_score + 5; END IF;
  IF v_county_count >= 3 THEN v_breadth_score := v_breadth_score + 3; END IF;
  
  -- Cap breadth score at 35
  v_breadth_score := LEAST(v_breadth_score, 35);
  
  -- Calculate Demand Overlap Score (0-25 points)
  -- Check how many pros/agents are already in this area (indicates demand)
  -- Extract zip codes as array
  IF v_zip_count > 0 THEN
    SELECT COUNT(DISTINCT p.id) INTO v_total_pros_in_area
    FROM pros p
    WHERE p.zip_codes && (
      SELECT array_agg(elem::text)
      FROM jsonb_array_elements_text(coverage_record.data->'zipCodes') elem
    );
    
    -- Higher pro count indicates high demand area
    IF v_total_pros_in_area >= 100 THEN 
      v_demand_score := 25;
    ELSIF v_total_pros_in_area >= 50 THEN 
      v_demand_score := 20;
    ELSIF v_total_pros_in_area >= 25 THEN 
      v_demand_score := 15;
    ELSIF v_total_pros_in_area >= 10 THEN 
      v_demand_score := 10;
    ELSIF v_total_pros_in_area >= 1 THEN 
      v_demand_score := 5;
    END IF;
  END IF;
  
  -- Calculate total score (out of 100)
  v_total_score := v_completeness_score + v_breadth_score + v_demand_score;
  
  -- Build details JSON
  v_details := jsonb_build_object(
    'zipCodeCount', v_zip_count,
    'cityCount', v_city_count,
    'stateCount', v_state_count,
    'countyCount', v_county_count,
    'coordinateCount', v_coord_count,
    'prosInArea', v_total_pros_in_area,
    'completenessBreakdown', jsonb_build_object(
      'hasZips', v_zip_count > 0,
      'hasCities', v_city_count > 0,
      'hasStates', v_state_count > 0,
      'hasCounties', v_county_count > 0,
      'hasCoordinates', v_coord_count > 0
    ),
    'qualityLevel', CASE
      WHEN v_total_score >= 80 THEN 'excellent'
      WHEN v_total_score >= 60 THEN 'good'
      WHEN v_total_score >= 40 THEN 'fair'
      ELSE 'needs_improvement'
    END
  );
  
  -- Return the scores
  RETURN QUERY SELECT 
    v_total_score,
    v_completeness_score,
    v_breadth_score,
    v_demand_score,
    v_details;
END;
$$;

-- Create function to update coverage scores
CREATE OR REPLACE FUNCTION update_coverage_scores()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  score_result RECORD;
BEGIN
  -- Calculate scores for the new/updated coverage
  SELECT * INTO score_result
  FROM calculate_coverage_quality_score(NEW.id);
  
  -- Update the coverage record with scores
  NEW.quality_score := score_result.total_score;
  NEW.completeness_score := score_result.completeness;
  NEW.coverage_breadth_score := score_result.breadth;
  NEW.demand_overlap_score := score_result.demand_overlap;
  NEW.score_details := score_result.details;
  NEW.last_scored_at := NOW();
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-calculate scores on insert/update
DROP TRIGGER IF EXISTS trigger_calculate_coverage_scores ON market_coverage;
CREATE TRIGGER trigger_calculate_coverage_scores
  BEFORE INSERT OR UPDATE ON market_coverage
  FOR EACH ROW
  EXECUTE FUNCTION update_coverage_scores();

-- Add index for quality score queries
CREATE INDEX IF NOT EXISTS idx_market_coverage_quality_score ON market_coverage(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_market_coverage_user_quality ON market_coverage(user_id, quality_score DESC);
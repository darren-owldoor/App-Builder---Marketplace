-- Update coverage quality scoring to start at baseline of 75 and rename terminology

-- Drop existing function and recreate with better defaults
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
  v_completeness_score INTEGER := 30;  -- Start at 75% of max (30/40)
  v_breadth_score INTEGER := 0;
  v_demand_score INTEGER := 10;  -- Start at 40% of max (10/25) 
  v_total_score INTEGER := 0;
  v_zip_count INTEGER := 0;
  v_city_count INTEGER := 0;
  v_state_count INTEGER := 0;
  v_county_count INTEGER := 0;
  v_coord_count INTEGER := 0;
  v_details JSONB;
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
  
  -- Calculate Completeness Score (30-40 points, starts at 30)
  -- Award bonus points for having each type of geocoded data
  IF v_zip_count > 0 THEN v_completeness_score := v_completeness_score + 4; END IF;
  IF v_city_count > 0 THEN v_completeness_score := v_completeness_score + 2; END IF;
  IF v_state_count > 0 THEN v_completeness_score := v_completeness_score + 1; END IF;
  IF v_county_count > 0 THEN v_completeness_score := v_completeness_score + 2; END IF;
  IF v_coord_count > 0 THEN v_completeness_score := v_completeness_score + 1; END IF;
  
  -- Cap at 40
  v_completeness_score := LEAST(v_completeness_score, 40);
  
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
  
  -- Calculate Competition Level Score (10-25 points, starts at 10 = 40%)
  -- Check how many teams are already in this area (indicates competition/demand)
  IF v_zip_count > 0 THEN
    SELECT COUNT(DISTINCT p.id) INTO v_total_pros_in_area
    FROM pros p
    WHERE p.zip_codes && (
      SELECT array_agg(elem::text)
      FROM jsonb_array_elements_text(coverage_record.data->'zipCodes') elem
    );
    
    -- Higher team count indicates high competition area
    IF v_total_pros_in_area >= 100 THEN 
      v_demand_score := 25;
    ELSIF v_total_pros_in_area >= 50 THEN 
      v_demand_score := 20;
    ELSIF v_total_pros_in_area >= 25 THEN 
      v_demand_score := 15;
    ELSIF v_total_pros_in_area >= 10 THEN 
      v_demand_score := 12;
    ELSIF v_total_pros_in_area >= 1 THEN 
      v_demand_score := 10;
    END IF;
  END IF;
  
  -- Calculate total score (out of 100)
  v_total_score := v_completeness_score + v_breadth_score + v_demand_score;
  
  -- Build details JSON with updated terminology
  v_details := jsonb_build_object(
    'zipCodeCount', v_zip_count,
    'cityCount', v_city_count,
    'stateCount', v_state_count,
    'countyCount', v_county_count,
    'coordinateCount', v_coord_count,
    'teamsInArea', v_total_pros_in_area,
    'completenessBreakdown', jsonb_build_object(
      'hasZips', v_zip_count > 0,
      'hasCities', v_city_count > 0,
      'hasStates', v_state_count > 0,
      'hasCounties', v_county_count > 0,
      'hasCoordinates', v_coord_count > 0
    ),
    'competitionLevel', CASE
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
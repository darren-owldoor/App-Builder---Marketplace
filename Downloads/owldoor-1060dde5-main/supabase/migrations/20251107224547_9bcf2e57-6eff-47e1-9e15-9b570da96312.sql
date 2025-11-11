-- Fix coverage quality trigger with proper error handling
-- The issue was using BEFORE INSERT which tried to access NEW.id before it existed
-- Solution: Use AFTER INSERT/UPDATE and handle records properly

-- Drop the old function and recreate with better error handling
CREATE OR REPLACE FUNCTION update_coverage_scores_after()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  score_result RECORD;
BEGIN
  -- Calculate scores for the new/updated coverage
  -- Use exception handling to prevent failures from blocking saves
  BEGIN
    SELECT * INTO score_result
    FROM calculate_coverage_quality_score(NEW.id);
    
    -- Update the coverage record with scores
    UPDATE market_coverage
    SET 
      quality_score = score_result.total_score,
      completeness_score = score_result.completeness,
      coverage_breadth_score = score_result.breadth,
      demand_overlap_score = score_result.demand_overlap,
      score_details = score_result.details,
      last_scored_at = NOW()
    WHERE id = NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't block the save
    RAISE WARNING 'Failed to calculate coverage quality score for %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- Create AFTER trigger instead of BEFORE trigger
DROP TRIGGER IF EXISTS trigger_calculate_coverage_quality ON market_coverage;
DROP TRIGGER IF EXISTS trigger_calculate_coverage_scores ON market_coverage;

CREATE TRIGGER trigger_calculate_coverage_scores
  AFTER INSERT OR UPDATE ON market_coverage
  FOR EACH ROW
  EXECUTE FUNCTION update_coverage_scores_after();

-- Add comment explaining the fix
COMMENT ON TRIGGER trigger_calculate_coverage_scores ON market_coverage IS 
'Automatically calculates coverage quality scores after insert/update. Uses AFTER trigger with error handling to prevent blocking saves.';
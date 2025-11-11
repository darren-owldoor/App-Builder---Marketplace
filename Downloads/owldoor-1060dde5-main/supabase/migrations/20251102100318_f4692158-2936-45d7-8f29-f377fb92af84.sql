-- Fix function search_path security warning by recreating with proper settings
DROP TRIGGER IF EXISTS trigger_auto_progress_qualified ON agents;
DROP FUNCTION IF EXISTS auto_progress_qualified_leads() CASCADE;

CREATE OR REPLACE FUNCTION auto_progress_qualified_leads()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If a lead becomes qualified, automatically set to match_ready
  IF NEW.pipeline_stage = 'qualified' AND OLD.pipeline_stage != 'match_ready' THEN
    NEW.pipeline_stage := 'match_ready';
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER trigger_auto_progress_qualified
  BEFORE UPDATE ON agents
  FOR EACH ROW
  WHEN (NEW.pipeline_stage = 'qualified')
  EXECUTE FUNCTION auto_progress_qualified_leads();
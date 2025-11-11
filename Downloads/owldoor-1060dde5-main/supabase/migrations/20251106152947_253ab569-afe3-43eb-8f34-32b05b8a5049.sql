-- Fix auto-progression trigger to automatically move pros to match_ready when they become qualified
-- Qualification criteria: motivation > 0 OR wants array has elements

CREATE OR REPLACE FUNCTION public.auto_progress_qualified_leads()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  has_motivation BOOLEAN;
  has_wants BOOLEAN;
  is_qualified BOOLEAN;
BEGIN
  -- Check if pro has motivation
  has_motivation := NEW.motivation IS NOT NULL AND NEW.motivation > 0;
  
  -- Check if pro has wants
  has_wants := NEW.wants IS NOT NULL AND array_length(NEW.wants, 1) > 0;
  
  -- Pro is qualified if they have motivation OR wants
  is_qualified := has_motivation OR has_wants;
  
  -- If qualified and not already in match_ready or later stage, automatically progress
  IF is_qualified AND NEW.pipeline_stage IN ('new', 'new_recruit', 'contacted', 'qualified', 'directory') THEN
    NEW.pipeline_stage := 'match_ready';
  END IF;
  
  RETURN NEW;
END;
$function$;
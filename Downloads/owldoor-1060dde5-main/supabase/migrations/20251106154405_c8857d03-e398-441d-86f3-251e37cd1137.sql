-- Remove the status filter constraint that's preventing matching
-- The constraint is checking status but status values aren't properly aligned with pipeline_stage

-- Option 1: Drop the constraint if it exists
ALTER TABLE public.pros DROP CONSTRAINT IF EXISTS leads_status_check;

-- Option 2: Update pros that are match_ready to have compatible status
UPDATE public.pros
SET status = 'qualified'
WHERE pipeline_stage = 'match_ready'
AND status IN ('new', 'qualifying')
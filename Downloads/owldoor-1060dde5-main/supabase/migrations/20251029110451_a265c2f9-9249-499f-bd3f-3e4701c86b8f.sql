-- Fix the pipeline_type check constraint to allow 'agent' value
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_pipeline_type_check;

-- Add updated check constraint that includes 'agent'
ALTER TABLE public.leads ADD CONSTRAINT leads_pipeline_type_check 
CHECK (pipeline_type IN ('staff', 'client', 'agent'));
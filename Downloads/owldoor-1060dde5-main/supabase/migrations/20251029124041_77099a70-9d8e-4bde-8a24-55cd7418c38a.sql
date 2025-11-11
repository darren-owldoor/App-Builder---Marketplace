-- Add match_to field to leads table for pre-matched leads from targeted ads
ALTER TABLE public.leads 
ADD COLUMN match_to text;

COMMENT ON COLUMN public.leads.match_to IS 'Client email for pre-matched leads from targeted advertising campaigns';
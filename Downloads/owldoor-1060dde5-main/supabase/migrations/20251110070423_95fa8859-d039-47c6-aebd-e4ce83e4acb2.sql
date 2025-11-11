-- Add stage and match_score fields to ai_leads table
ALTER TABLE public.ai_leads
ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'new_lead' 
  CHECK (stage IN ('new_lead', 'contacted', 'interested', 'appointment_set', 'hired', 'dead'));

ALTER TABLE public.ai_leads
ADD COLUMN IF NOT EXISTS match_score INTEGER DEFAULT 0 CHECK (match_score >= 0 AND match_score <= 100);

-- Create index for stage
CREATE INDEX IF NOT EXISTS idx_ai_leads_stage ON public.ai_leads(stage);

-- Update existing records to have default stage if null
UPDATE public.ai_leads SET stage = 'new_lead' WHERE stage IS NULL;
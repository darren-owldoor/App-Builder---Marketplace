-- Add columns to agents table for new flow tracking
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS specialization text CHECK (specialization IN ('real_estate', 'mortgage')),
ADD COLUMN IF NOT EXISTS matching_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS market_coverage_completed boolean DEFAULT false;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_agents_specialization ON public.agents(specialization);
CREATE INDEX IF NOT EXISTS idx_agents_matching_completed ON public.agents(matching_completed);
CREATE INDEX IF NOT EXISTS idx_agents_market_coverage_completed ON public.agents(market_coverage_completed);
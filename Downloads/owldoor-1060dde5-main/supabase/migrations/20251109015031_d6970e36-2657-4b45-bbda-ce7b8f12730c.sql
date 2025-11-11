-- Create table for AI research data on leads
CREATE TABLE IF NOT EXISTS public.lead_research (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pro_id UUID NOT NULL REFERENCES public.pros(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  research_data JSONB,
  ai_notes TEXT,
  sources JSONB,
  last_researched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(pro_id, client_id)
);

-- Enable RLS
ALTER TABLE public.lead_research ENABLE ROW LEVEL SECURITY;

-- Clients can view their own research
CREATE POLICY "Clients can view their own lead research"
  ON public.lead_research
  FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  );

-- Clients can insert their own research
CREATE POLICY "Clients can create lead research"
  ON public.lead_research
  FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  );

-- Clients can update their own research
CREATE POLICY "Clients can update their own lead research"
  ON public.lead_research
  FOR UPDATE
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  );

-- Add index for faster lookups
CREATE INDEX idx_lead_research_pro_client ON public.lead_research(pro_id, client_id);
CREATE INDEX idx_lead_research_client ON public.lead_research(client_id);
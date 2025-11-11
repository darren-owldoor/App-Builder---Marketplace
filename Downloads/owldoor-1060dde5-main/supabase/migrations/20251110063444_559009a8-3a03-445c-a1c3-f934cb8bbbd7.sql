-- Create ai_escalation_rules table for IF-THEN automation
CREATE TABLE IF NOT EXISTS public.ai_escalation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  condition_type TEXT NOT NULL, -- 'response_contains', 'no_response_after', 'response_is', etc.
  condition_values TEXT[], -- For phrase matching
  condition_time_value INTEGER, -- For time-based conditions
  condition_time_unit TEXT, -- 'minutes', 'hours', 'days'
  action_type TEXT NOT NULL, -- 'escalate_to_human', 'ai_respond', 'move_to_stage', 'send_notification'
  action_value TEXT, -- Stage name, message template, etc.
  order_index INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ai_escalation_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Clients can view their own escalation rules"
  ON public.ai_escalation_rules
  FOR SELECT
  USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

CREATE POLICY "Clients can insert their own escalation rules"
  ON public.ai_escalation_rules
  FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

CREATE POLICY "Clients can update their own escalation rules"
  ON public.ai_escalation_rules
  FOR UPDATE
  USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

CREATE POLICY "Clients can delete their own escalation rules"
  ON public.ai_escalation_rules
  FOR DELETE
  USING (client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid()));

-- Create index for performance
CREATE INDEX idx_ai_escalation_rules_client_id ON public.ai_escalation_rules(client_id);
CREATE INDEX idx_ai_escalation_rules_active ON public.ai_escalation_rules(active);
-- AI Recruiter CRM Tables

-- AI Leads table (can reference existing pros)
CREATE TABLE IF NOT EXISTS public.ai_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id UUID REFERENCES public.pros(id) ON DELETE SET NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  ai_active BOOLEAN DEFAULT true,
  last_message_at TIMESTAMPTZ,
  appointment_count INTEGER DEFAULT 0,
  message_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, phone)
);

-- AI Messages table
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.ai_leads(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  conversation_id TEXT NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('lead', 'ai', 'client')),
  content TEXT NOT NULL,
  twilio_sid TEXT,
  ai_action TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Appointments table
CREATE TABLE IF NOT EXISTS public.ai_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.ai_leads(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  title TEXT,
  calendly_event_id TEXT,
  booked_by TEXT NOT NULL CHECK (booked_by IN ('ai', 'client')),
  status TEXT NOT NULL DEFAULT 'scheduled',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Config table (per client)
CREATE TABLE IF NOT EXISTS public.ai_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE UNIQUE,
  ai_enabled BOOLEAN DEFAULT true,
  twilio_phone_number TEXT,
  calendly_link TEXT,
  ai_personality TEXT DEFAULT 'professional_friendly',
  escalate_after_messages INTEGER DEFAULT 5,
  escalate_on_commission_questions BOOLEAN DEFAULT true,
  escalate_on_objections BOOLEAN DEFAULT true,
  conversation_examples JSONB DEFAULT '[]'::jsonb,
  system_prompt TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_leads_client_id ON public.ai_leads(client_id);
CREATE INDEX IF NOT EXISTS idx_ai_leads_phone ON public.ai_leads(phone);
CREATE INDEX IF NOT EXISTS idx_ai_leads_status ON public.ai_leads(status);
CREATE INDEX IF NOT EXISTS idx_ai_messages_lead_id ON public.ai_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON public.ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON public.ai_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_appointments_lead_id ON public.ai_appointments(lead_id);
CREATE INDEX IF NOT EXISTS idx_ai_appointments_scheduled_at ON public.ai_appointments(scheduled_at);

-- Enable RLS
ALTER TABLE public.ai_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_leads
CREATE POLICY "Clients can view their own AI leads"
  ON public.ai_leads FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "Clients can insert their own AI leads"
  ON public.ai_leads FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "Clients can update their own AI leads"
  ON public.ai_leads FOR UPDATE
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "Staff can manage all AI leads"
  ON public.ai_leads FOR ALL
  USING (has_role(auth.uid(), 'staff'::app_role));

-- RLS Policies for ai_messages
CREATE POLICY "Clients can view their AI messages"
  ON public.ai_messages FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "Clients can insert AI messages"
  ON public.ai_messages FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "Staff can manage all AI messages"
  ON public.ai_messages FOR ALL
  USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Service role can insert AI messages"
  ON public.ai_messages FOR INSERT
  WITH CHECK (true);

-- RLS Policies for ai_appointments
CREATE POLICY "Clients can view their AI appointments"
  ON public.ai_appointments FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "Clients can manage their AI appointments"
  ON public.ai_appointments FOR ALL
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "Staff can manage all AI appointments"
  ON public.ai_appointments FOR ALL
  USING (has_role(auth.uid(), 'staff'::app_role));

-- RLS Policies for ai_config
CREATE POLICY "Clients can view their own AI config"
  ON public.ai_config FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "Clients can manage their own AI config"
  ON public.ai_config FOR ALL
  USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "Staff can manage all AI configs"
  ON public.ai_config FOR ALL
  USING (has_role(auth.uid(), 'staff'::app_role));

-- Trigger to update updated_at
CREATE TRIGGER update_ai_leads_updated_at
  BEFORE UPDATE ON public.ai_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_appointments_updated_at
  BEFORE UPDATE ON public.ai_appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_config_updated_at
  BEFORE UPDATE ON public.ai_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_messages;
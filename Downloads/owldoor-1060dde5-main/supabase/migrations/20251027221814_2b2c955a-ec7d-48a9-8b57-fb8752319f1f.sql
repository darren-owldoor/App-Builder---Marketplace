-- Create campaign templates table
CREATE TABLE public.campaign_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_staff BOOLEAN DEFAULT false,
  shared_with_clients BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaign steps table (drip sequence)
CREATE TABLE public.campaign_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_template_id UUID NOT NULL REFERENCES public.campaign_templates(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_type TEXT NOT NULL CHECK (step_type IN ('sms', 'email', 'both')),
  delay_days INTEGER NOT NULL DEFAULT 0 CHECK (delay_days >= 0 AND delay_days <= 180),
  delay_hours INTEGER NOT NULL DEFAULT 0 CHECK (delay_hours >= 0 AND delay_hours <= 24),
  delay_minutes INTEGER NOT NULL DEFAULT 0 CHECK (delay_minutes >= 0 AND delay_minutes <= 60),
  sms_template TEXT,
  email_subject TEXT,
  email_template TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_step_order CHECK (step_order >= 0 AND step_order <= 30)
);

-- Create campaign assignments (which leads are in which campaigns)
CREATE TABLE public.campaign_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_template_id UUID NOT NULL REFERENCES public.campaign_templates(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  current_step INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  next_send_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_template_id, lead_id)
);

-- Create client phone numbers table
CREATE TABLE public.client_phone_numbers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaign execution log
CREATE TABLE public.campaign_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.campaign_assignments(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.campaign_steps(id) ON DELETE CASCADE,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  type TEXT NOT NULL CHECK (type IN ('sms', 'email')),
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.campaign_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaign_templates
CREATE POLICY "Staff can manage all campaign templates"
  ON public.campaign_templates
  FOR ALL
  USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Clients can view templates shared with them"
  ON public.campaign_templates
  FOR SELECT
  USING (
    has_role(auth.uid(), 'client'::app_role) 
    AND shared_with_clients = true 
    AND active = true
  );

-- RLS Policies for campaign_steps
CREATE POLICY "Staff can manage all campaign steps"
  ON public.campaign_steps
  FOR ALL
  USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Users can view steps of accessible templates"
  ON public.campaign_steps
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaign_templates ct
      WHERE ct.id = campaign_steps.campaign_template_id
      AND (
        has_role(auth.uid(), 'staff'::app_role)
        OR (has_role(auth.uid(), 'client'::app_role) AND ct.shared_with_clients = true)
      )
    )
  );

-- RLS Policies for campaign_assignments
CREATE POLICY "Staff can manage all assignments"
  ON public.campaign_assignments
  FOR ALL
  USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Clients can view their assignments"
  ON public.campaign_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can create assignments for shared templates"
  ON public.campaign_assignments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.campaign_templates ct
      WHERE ct.id = campaign_template_id
      AND ct.shared_with_clients = true
      AND ct.active = true
    )
  );

-- RLS Policies for client_phone_numbers
CREATE POLICY "Staff can manage all phone numbers"
  ON public.client_phone_numbers
  FOR ALL
  USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Clients can view their phone numbers"
  ON public.client_phone_numbers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = client_id AND c.user_id = auth.uid()
    )
  );

-- RLS Policies for campaign_logs
CREATE POLICY "Staff can view all campaign logs"
  ON public.campaign_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Clients can view logs for their campaigns"
  ON public.campaign_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaign_assignments ca
      JOIN public.clients c ON c.user_id = auth.uid()
      WHERE ca.id = assignment_id
    )
  );

-- Add triggers for updated_at
CREATE TRIGGER update_campaign_templates_updated_at
  BEFORE UPDATE ON public.campaign_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_steps_updated_at
  BEFORE UPDATE ON public.campaign_steps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_assignments_updated_at
  BEFORE UPDATE ON public.campaign_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_phone_numbers_updated_at
  BEFORE UPDATE ON public.client_phone_numbers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_campaign_steps_template ON public.campaign_steps(campaign_template_id);
CREATE INDEX idx_campaign_assignments_template ON public.campaign_assignments(campaign_template_id);
CREATE INDEX idx_campaign_assignments_lead ON public.campaign_assignments(lead_id);
CREATE INDEX idx_campaign_assignments_next_send ON public.campaign_assignments(next_send_at) WHERE status = 'active';
CREATE INDEX idx_client_phone_numbers_client ON public.client_phone_numbers(client_id);
CREATE INDEX idx_campaign_logs_assignment ON public.campaign_logs(assignment_id);
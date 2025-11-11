-- Create table for storing Zapier webhook configurations
CREATE TABLE public.zapier_webhooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  webhook_type TEXT NOT NULL CHECK (webhook_type IN ('import', 'export')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('users', 'leads', 'staff', 'clients')),
  webhook_url TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.zapier_webhooks ENABLE ROW LEVEL SECURITY;

-- Staff can manage all webhooks
CREATE POLICY "Staff can manage all zapier webhooks"
ON public.zapier_webhooks
FOR ALL
USING (has_role(auth.uid(), 'staff'::app_role));

-- Clients can manage their own webhooks
CREATE POLICY "Clients can manage their own zapier webhooks"
ON public.zapier_webhooks
FOR ALL
USING (auth.uid() = user_id AND has_role(auth.uid(), 'client'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_zapier_webhooks_updated_at
BEFORE UPDATE ON public.zapier_webhooks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for logging Zapier activity
CREATE TABLE public.zapier_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_id UUID REFERENCES public.zapier_webhooks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_count INTEGER DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.zapier_logs ENABLE ROW LEVEL SECURITY;

-- Staff can view all logs
CREATE POLICY "Staff can view all zapier logs"
ON public.zapier_logs
FOR SELECT
USING (has_role(auth.uid(), 'staff'::app_role));

-- Clients can view their own logs
CREATE POLICY "Clients can view their own zapier logs"
ON public.zapier_logs
FOR SELECT
USING (auth.uid() = user_id);
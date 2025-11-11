-- Create SMS provider configurations table
CREATE TABLE public.sms_provider_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('twilio_primary', 'twilio_backup', 'messagebird')),
  provider_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false,
  priority INTEGER NOT NULL DEFAULT 0,
  config_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  UNIQUE(provider_type)
);

-- Enable RLS
ALTER TABLE public.sms_provider_configs ENABLE ROW LEVEL SECURITY;

-- Only staff can manage SMS provider configs
CREATE POLICY "Staff can manage all SMS provider configs"
  ON public.sms_provider_configs
  FOR ALL
  USING (has_role(auth.uid(), 'staff'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_sms_provider_configs_updated_at
  BEFORE UPDATE ON public.sms_provider_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create SMS logs table for tracking
CREATE TABLE public.sms_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_type TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  to_number TEXT NOT NULL,
  from_number TEXT,
  message_body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  external_id TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_by UUID REFERENCES auth.users(id)
);

-- Enable RLS for SMS logs
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

-- Staff can view all SMS logs
CREATE POLICY "Staff can view all SMS logs"
  ON public.sms_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'staff'::app_role));

-- Insert default Twilio primary config
INSERT INTO public.sms_provider_configs (provider_type, provider_name, is_active, is_default, priority, config_data, created_by)
SELECT 
  'twilio_primary',
  'Twilio Primary',
  true,
  true,
  1,
  '{"description": "Primary Twilio account for client messaging"}'::jsonb,
  id
FROM auth.users
WHERE EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.users.id AND role = 'staff')
LIMIT 1;
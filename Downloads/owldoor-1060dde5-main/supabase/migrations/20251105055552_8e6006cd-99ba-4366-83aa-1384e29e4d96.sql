-- Create SMS consent log table
CREATE TABLE public.sms_consent_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  consent_given BOOLEAN NOT NULL,
  consent_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  consent_method TEXT NOT NULL,
  consent_text TEXT NOT NULL,
  ip_address INET,
  double_opt_in_confirmed BOOLEAN DEFAULT FALSE,
  opt_out_timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.sms_consent_log ENABLE ROW LEVEL SECURITY;

-- Only staff/admin can view consent logs (for compliance)
CREATE POLICY "Staff can view all consent logs"
  ON public.sms_consent_log
  FOR SELECT
  USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Index for quick phone number lookups
CREATE INDEX idx_sms_consent_phone ON public.sms_consent_log(phone_number);
CREATE INDEX idx_sms_consent_timestamp ON public.sms_consent_log(consent_timestamp DESC);
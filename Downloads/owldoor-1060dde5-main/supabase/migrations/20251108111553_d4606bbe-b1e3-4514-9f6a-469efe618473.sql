-- Create comprehensive audit and monitoring tables

-- System health monitoring
CREATE TABLE IF NOT EXISTS public.system_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('operational', 'degraded', 'down')),
  last_check_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  response_time_ms INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_system_health_service ON public.system_health(service_name, last_check_at DESC);
CREATE INDEX idx_system_health_status ON public.system_health(status, created_at DESC);

-- Security events log
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  endpoint TEXT,
  request_method TEXT,
  request_payload JSONB,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_security_events_type ON public.security_events(event_type, created_at DESC);
CREATE INDEX idx_security_events_user ON public.security_events(user_id, created_at DESC);
CREATE INDEX idx_security_events_severity ON public.security_events(severity, created_at DESC);
CREATE INDEX idx_security_events_ip ON public.security_events(ip_address, created_at DESC);

-- SMS activity log
CREATE TABLE IF NOT EXISTS public.sms_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  direction TEXT NOT NULL CHECK (direction IN ('sent', 'received')),
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  message_body TEXT,
  status TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'twilio',
  account_sid TEXT,
  message_sid TEXT,
  cost_cents INTEGER,
  error_code TEXT,
  error_message TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  campaign_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sms_direction ON public.sms_activity_log(direction, created_at DESC);
CREATE INDEX idx_sms_status ON public.sms_activity_log(status, created_at DESC);
CREATE INDEX idx_sms_user ON public.sms_activity_log(user_id, created_at DESC);
CREATE INDEX idx_sms_from ON public.sms_activity_log(from_number, created_at DESC);
CREATE INDEX idx_sms_to ON public.sms_activity_log(to_number, created_at DESC);

-- Email activity log
CREATE TABLE IF NOT EXISTS public.email_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  direction TEXT NOT NULL CHECK (direction IN ('sent', 'received')),
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT,
  status TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'sendgrid',
  message_id TEXT,
  error_message TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_direction ON public.email_activity_log(direction, created_at DESC);
CREATE INDEX idx_email_status ON public.email_activity_log(status, created_at DESC);
CREATE INDEX idx_email_user ON public.email_activity_log(user_id, created_at DESC);

-- Payment activity log
CREATE TABLE IF NOT EXISTS public.payment_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending', 'refunded')),
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  payment_method TEXT,
  provider TEXT NOT NULL DEFAULT 'stripe',
  transaction_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_id UUID,
  error_code TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_status ON public.payment_activity_log(status, created_at DESC);
CREATE INDEX idx_payment_user ON public.payment_activity_log(user_id, created_at DESC);
CREATE INDEX idx_payment_type ON public.payment_activity_log(event_type, created_at DESC);

-- CAPTCHA activity log
CREATE TABLE IF NOT EXISTS public.captcha_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  success BOOLEAN NOT NULL,
  provider TEXT NOT NULL DEFAULT 'hcaptcha',
  ip_address INET,
  user_agent TEXT,
  form_type TEXT,
  score NUMERIC(3,2),
  error_codes TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_captcha_success ON public.captcha_activity_log(success, created_at DESC);
CREATE INDEX idx_captcha_ip ON public.captcha_activity_log(ip_address, created_at DESC);

-- API endpoint monitoring
CREATE TABLE IF NOT EXISTS public.api_endpoint_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_api_endpoint ON public.api_endpoint_metrics(endpoint, created_at DESC);
CREATE INDEX idx_api_status ON public.api_endpoint_metrics(status_code, created_at DESC);
CREATE INDEX idx_api_user ON public.api_endpoint_metrics(user_id, created_at DESC);

-- Enable RLS on all monitoring tables
ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.captcha_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_endpoint_metrics ENABLE ROW LEVEL SECURITY;

-- Admin-only policies for all monitoring tables
CREATE POLICY "Admins can view system health"
  ON public.system_health FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage system health"
  ON public.system_health FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view security events"
  ON public.security_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert security events"
  ON public.security_events FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Admins can view SMS logs"
  ON public.sms_activity_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert SMS logs"
  ON public.sms_activity_log FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Admins can view email logs"
  ON public.email_activity_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert email logs"
  ON public.email_activity_log FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Admins can view payment logs"
  ON public.payment_activity_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert payment logs"
  ON public.payment_activity_log FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Admins can view CAPTCHA logs"
  ON public.captcha_activity_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert CAPTCHA logs"
  ON public.captcha_activity_log FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Admins can view API metrics"
  ON public.api_endpoint_metrics FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert API metrics"
  ON public.api_endpoint_metrics FOR INSERT
  TO service_role
  WITH CHECK (true);
-- Create email_configs table for storing email provider configurations
CREATE TABLE IF NOT EXISTS public.email_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT UNIQUE NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_configured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on email_configs
ALTER TABLE public.email_configs ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage email configs
CREATE POLICY "Admins can manage email configs"
  ON public.email_configs
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create email_logs table for tracking sent emails
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL,
  provider TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on email_logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view all email logs
CREATE POLICY "Admins can view all email logs"
  ON public.email_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create policy for users to view their own email logs
CREATE POLICY "Users can view their own email logs"
  ON public.email_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index on email_logs for better performance
CREATE INDEX idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX idx_email_logs_created_at ON public.email_logs(created_at DESC);
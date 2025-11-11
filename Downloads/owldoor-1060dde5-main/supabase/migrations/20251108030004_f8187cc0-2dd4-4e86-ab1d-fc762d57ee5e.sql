-- Create admin settings table for controlling system limits
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  setting_type TEXT NOT NULL CHECK (setting_type IN ('number', 'boolean', 'text', 'json')),
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('database', 'api', 'features', 'billing', 'security')),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Admin read policy
CREATE POLICY "Admins can read all settings"
  ON public.admin_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Admin write policy
CREATE POLICY "Admins can manage settings"
  ON public.admin_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Insert default settings
INSERT INTO public.admin_settings (setting_key, setting_value, setting_type, description, category) VALUES
  ('max_api_requests_per_minute', '100'::jsonb, 'number', 'Maximum API requests per minute per user', 'api'),
  ('max_database_connections', '50'::jsonb, 'number', 'Maximum concurrent database connections', 'database'),
  ('max_file_upload_size_mb', '10'::jsonb, 'number', 'Maximum file upload size in MB', 'features'),
  ('max_edge_function_timeout_seconds', '30'::jsonb, 'number', 'Maximum edge function execution time', 'api'),
  ('max_pros_per_client', '1000'::jsonb, 'number', 'Maximum professionals a client can have', 'features'),
  ('max_matches_per_day', '50'::jsonb, 'number', 'Maximum matches generated per day', 'features'),
  ('max_sms_per_month', '10000'::jsonb, 'number', 'Maximum SMS messages per month', 'billing'),
  ('max_email_per_month', '50000'::jsonb, 'number', 'Maximum emails per month', 'billing'),
  ('enable_auto_matching', 'true'::jsonb, 'boolean', 'Enable automatic lead matching', 'features'),
  ('enable_geocoding', 'true'::jsonb, 'boolean', 'Enable geocoding services', 'features'),
  ('max_payment_amount', '10000'::jsonb, 'number', 'Maximum single payment amount in dollars', 'billing'),
  ('max_credits_per_purchase', '5000'::jsonb, 'number', 'Maximum credits per purchase', 'billing')
ON CONFLICT (setting_key) DO NOTHING;

-- Trigger to update updated_at
CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
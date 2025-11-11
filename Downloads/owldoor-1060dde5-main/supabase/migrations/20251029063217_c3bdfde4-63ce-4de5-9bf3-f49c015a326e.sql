-- Create payment_configs table
CREATE TABLE IF NOT EXISTS public.payment_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL UNIQUE,
  config JSONB NOT NULL,
  configured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_configs ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage payment configs
CREATE POLICY "Admins can view payment configs"
  ON public.payment_configs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert payment configs"
  ON public.payment_configs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update payment configs"
  ON public.payment_configs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_payment_configs_updated_at
  BEFORE UPDATE ON public.payment_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

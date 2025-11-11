-- Create payment_setup_tokens table for secure payment links
CREATE TABLE IF NOT EXISTS public.payment_setup_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_setup_tokens ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read tokens (needed for public payment setup page)
CREATE POLICY "Anyone can read payment setup tokens"
  ON public.payment_setup_tokens
  FOR SELECT
  USING (true);

-- Only admins can create tokens
CREATE POLICY "Admins can create payment setup tokens"
  ON public.payment_setup_tokens
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create index for faster lookups
CREATE INDEX idx_payment_setup_tokens_expires ON public.payment_setup_tokens(expires_at);
CREATE INDEX idx_payment_setup_tokens_used ON public.payment_setup_tokens(used);
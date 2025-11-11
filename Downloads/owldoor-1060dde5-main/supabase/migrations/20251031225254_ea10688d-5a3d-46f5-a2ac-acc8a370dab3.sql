-- Create table to track trusted IP addresses for users
CREATE TABLE public.user_trusted_ips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_agent TEXT,
  location_info JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for faster lookups
CREATE INDEX idx_user_trusted_ips_user_id ON public.user_trusted_ips(user_id);
CREATE INDEX idx_user_trusted_ips_ip_address ON public.user_trusted_ips(ip_address);
CREATE UNIQUE INDEX idx_user_trusted_ips_user_ip ON public.user_trusted_ips(user_id, ip_address) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.user_trusted_ips ENABLE ROW LEVEL SECURITY;

-- Users can view their own trusted IPs
CREATE POLICY "Users can view their own trusted IPs"
  ON public.user_trusted_ips
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all trusted IPs
CREATE POLICY "Admins can view all trusted IPs"
  ON public.user_trusted_ips
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can manage trusted IPs
CREATE POLICY "Admins can manage all trusted IPs"
  ON public.user_trusted_ips
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_user_trusted_ips_updated_at
  BEFORE UPDATE ON public.user_trusted_ips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for 2FA verification attempts
CREATE TABLE public.two_factor_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  is_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for faster lookups
CREATE INDEX idx_two_factor_verifications_user_id ON public.two_factor_verifications(user_id);
CREATE INDEX idx_two_factor_verifications_expires_at ON public.two_factor_verifications(expires_at);

-- Enable RLS
ALTER TABLE public.two_factor_verifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own 2FA attempts
CREATE POLICY "Users can view their own 2FA verifications"
  ON public.two_factor_verifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all 2FA attempts
CREATE POLICY "Admins can view all 2FA verifications"
  ON public.two_factor_verifications
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Auto-cleanup expired verifications (runs daily)
CREATE OR REPLACE FUNCTION cleanup_expired_2fa_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.two_factor_verifications
  WHERE expires_at < now() - INTERVAL '24 hours';
END;
$$;
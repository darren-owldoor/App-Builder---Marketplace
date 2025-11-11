-- Add usage context columns to SMS and Email provider configs

-- Add columns to sms_provider_configs
ALTER TABLE public.sms_provider_configs 
ADD COLUMN IF NOT EXISTS use_for_clients boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS use_for_admin boolean DEFAULT true;

-- Add columns to email_configs
ALTER TABLE public.email_configs 
ADD COLUMN IF NOT EXISTS use_for_clients boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS use_for_admin boolean DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN public.sms_provider_configs.use_for_clients IS 'Whether this provider can be used for client-initiated messages';
COMMENT ON COLUMN public.sms_provider_configs.use_for_admin IS 'Whether this provider can be used for admin-initiated messages';
COMMENT ON COLUMN public.email_configs.use_for_clients IS 'Whether this provider can be used for client-initiated emails';
COMMENT ON COLUMN public.email_configs.use_for_admin IS 'Whether this provider can be used for admin-initiated emails';
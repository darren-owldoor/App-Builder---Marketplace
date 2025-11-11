-- Remove restrictive count limits for pros/agents/clients
UPDATE public.admin_settings 
SET setting_value = '999999'::jsonb 
WHERE setting_key = 'max_pros_per_client';

-- Also increase other limits that might be restrictive
UPDATE public.admin_settings 
SET setting_value = '99999'::jsonb 
WHERE setting_key = 'max_matches_per_day';

UPDATE public.admin_settings 
SET setting_value = '999999'::jsonb 
WHERE setting_key = 'max_sms_per_month';

UPDATE public.admin_settings 
SET setting_value = '999999'::jsonb 
WHERE setting_key = 'max_email_per_month';

-- Add comment
COMMENT ON TABLE public.admin_settings IS 'System-wide settings with effectively unlimited capacity for scale';
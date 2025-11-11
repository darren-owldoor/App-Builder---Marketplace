-- Update leads table: make phone required, email optional, lead_type required
ALTER TABLE public.leads
ALTER COLUMN phone SET NOT NULL,
ALTER COLUMN email DROP NOT NULL,
ALTER COLUMN lead_type SET NOT NULL,
ALTER COLUMN lead_type DROP DEFAULT;

-- Update clients table: make client_type required
ALTER TABLE public.clients
ALTER COLUMN client_type SET NOT NULL,
ALTER COLUMN client_type DROP DEFAULT;

-- Add comments for clarity
COMMENT ON COLUMN public.leads.phone IS 'Phone number - REQUIRED for all leads';
COMMENT ON COLUMN public.leads.email IS 'Email address - optional';
COMMENT ON COLUMN public.leads.lead_type IS 'Lead profession type - REQUIRED';
COMMENT ON COLUMN public.clients.client_type IS 'Client business type - REQUIRED';
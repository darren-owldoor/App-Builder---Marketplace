-- Create enums for client and lead types
CREATE TYPE public.client_type AS ENUM ('real_estate', 'mortgage');
CREATE TYPE public.lead_type AS ENUM ('real_estate_agent', 'mortgage_officer');

-- Add type fields to clients and leads
ALTER TABLE public.clients
ADD COLUMN client_type public.client_type DEFAULT 'real_estate',
ADD COLUMN tags TEXT[] DEFAULT '{}';

ALTER TABLE public.leads
ADD COLUMN lead_type public.lead_type DEFAULT 'real_estate_agent',
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Add helpful comments
COMMENT ON COLUMN public.clients.client_type IS 'Primary business type: real estate brokerage or mortgage company';
COMMENT ON COLUMN public.clients.tags IS 'Optional tags for specializations like residential, commercial, VA loans, etc.';
COMMENT ON COLUMN public.leads.lead_type IS 'Primary profession: real estate agent or mortgage officer';
COMMENT ON COLUMN public.leads.tags IS 'Optional tags for specializations like licensed, experienced, bilingual, etc.';
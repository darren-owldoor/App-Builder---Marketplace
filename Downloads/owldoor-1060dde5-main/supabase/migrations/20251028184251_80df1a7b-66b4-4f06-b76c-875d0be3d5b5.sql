-- Make lead_type optional for leads
ALTER TABLE public.leads
ALTER COLUMN lead_type DROP NOT NULL,
ALTER COLUMN lead_type DROP DEFAULT;

COMMENT ON COLUMN public.leads.lead_type IS 'Type of lead - set by admin, used for matching (e.g., only mortgage clients get mortgage leads)';

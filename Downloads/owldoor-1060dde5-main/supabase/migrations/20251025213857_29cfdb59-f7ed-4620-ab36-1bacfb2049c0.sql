-- Add client profile fields for detailed information
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS years_experience integer,
ADD COLUMN IF NOT EXISTS yearly_sales numeric,
ADD COLUMN IF NOT EXISTS avg_sale numeric,
ADD COLUMN IF NOT EXISTS designations text[],
ADD COLUMN IF NOT EXISTS languages text[],
ADD COLUMN IF NOT EXISTS skills text[],
ADD COLUMN IF NOT EXISTS wants text,
ADD COLUMN IF NOT EXISTS needs text,
ADD COLUMN IF NOT EXISTS brokerage text,
ADD COLUMN IF NOT EXISTS license_type text CHECK (license_type IN ('agent', 'broker')),
ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.clients.years_experience IS 'Years of experience in real estate';
COMMENT ON COLUMN public.clients.yearly_sales IS 'Annual sales volume';
COMMENT ON COLUMN public.clients.avg_sale IS 'Average sale amount';
COMMENT ON COLUMN public.clients.designations IS 'Professional designations (e.g., CRS, GRI)';
COMMENT ON COLUMN public.clients.languages IS 'Languages spoken';
COMMENT ON COLUMN public.clients.skills IS 'Special skills and expertise';
COMMENT ON COLUMN public.clients.wants IS 'What the client is looking for';
COMMENT ON COLUMN public.clients.needs IS 'Client specific needs';
COMMENT ON COLUMN public.clients.brokerage IS 'Brokerage affiliation';
COMMENT ON COLUMN public.clients.license_type IS 'License type: agent or broker';
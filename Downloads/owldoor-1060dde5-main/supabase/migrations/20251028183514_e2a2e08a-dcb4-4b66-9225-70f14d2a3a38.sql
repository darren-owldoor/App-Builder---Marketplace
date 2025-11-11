-- Add county field and convert zip_code to array for leads and clients

-- Add county field to leads
ALTER TABLE public.leads
ADD COLUMN county TEXT;

-- Add county field to clients
ALTER TABLE public.clients
ADD COLUMN county TEXT;

-- Rename existing zip_code columns to backup
ALTER TABLE public.leads
RENAME COLUMN zip_code TO zip_code_old;

ALTER TABLE public.clients
RENAME COLUMN zip_codes TO zip_codes_old;

-- Add new zip_codes array columns
ALTER TABLE public.leads
ADD COLUMN zip_codes TEXT[] DEFAULT '{}';

ALTER TABLE public.clients
ADD COLUMN zip_codes_new TEXT[] DEFAULT '{}';

-- Migrate existing data
UPDATE public.leads
SET zip_codes = ARRAY[zip_code_old]
WHERE zip_code_old IS NOT NULL AND zip_code_old != '';

UPDATE public.clients
SET zip_codes_new = zip_codes_old
WHERE zip_codes_old IS NOT NULL AND array_length(zip_codes_old, 1) > 0;

-- Drop old columns
ALTER TABLE public.leads
DROP COLUMN zip_code_old;

ALTER TABLE public.clients
DROP COLUMN zip_codes_old,
ADD COLUMN zip_codes TEXT[] DEFAULT '{}';

UPDATE public.clients
SET zip_codes = zip_codes_new;

ALTER TABLE public.clients
DROP COLUMN zip_codes_new;

-- Add comments
COMMENT ON COLUMN public.leads.county IS 'County location (optional)';
COMMENT ON COLUMN public.leads.zip_codes IS 'Array of zip codes - can be one or more';
COMMENT ON COLUMN public.clients.county IS 'County location (optional)';
COMMENT ON COLUMN public.clients.zip_codes IS 'Array of zip codes - can be one or more';
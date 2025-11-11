-- Add radius_data and is_exclusive columns to bids table
ALTER TABLE public.bids 
ADD COLUMN IF NOT EXISTS radius_data JSONB,
ADD COLUMN IF NOT EXISTS is_exclusive BOOLEAN DEFAULT false;

-- Add index for querying exclusive bids
CREATE INDEX IF NOT EXISTS idx_bids_exclusive ON public.bids(is_exclusive, active) WHERE is_exclusive = true AND active = true;

-- Add comment
COMMENT ON COLUMN public.bids.radius_data IS 'Stores ZIP + radius information for geographic targeting';
COMMENT ON COLUMN public.bids.is_exclusive IS 'Marks bids competing for exclusive territory rights';
-- Add new statuses to leads
ALTER TABLE public.leads 
DROP CONSTRAINT IF EXISTS leads_status_check;

ALTER TABLE public.leads 
ADD CONSTRAINT leads_status_check 
CHECK (status IN ('new', 'qualifying', 'qualified', 'match_ready', 'matched', 'purchased'));

-- Add purchase tracking to matches table
ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS purchased_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS purchase_amount numeric;

-- Update match status constraint
ALTER TABLE public.matches
DROP CONSTRAINT IF EXISTS matches_status_check;

ALTER TABLE public.matches
ADD CONSTRAINT matches_status_check
CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'purchased'));

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_matches_purchased_at ON public.matches(purchased_at) WHERE purchased_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_matches_client_purchased ON public.matches(client_id, purchased_at) WHERE purchased_at IS NOT NULL;
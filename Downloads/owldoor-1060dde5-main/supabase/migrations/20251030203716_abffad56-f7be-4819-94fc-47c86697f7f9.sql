-- Add Model Match performance fields to leads table
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS total_volume numeric,
ADD COLUMN IF NOT EXISTS total_units integer,
ADD COLUMN IF NOT EXISTS buyer_volume numeric,
ADD COLUMN IF NOT EXISTS buyer_units integer,
ADD COLUMN IF NOT EXISTS buyer_percentage numeric,
ADD COLUMN IF NOT EXISTS seller_volume numeric,
ADD COLUMN IF NOT EXISTS seller_units integer,
ADD COLUMN IF NOT EXISTS seller_percentage numeric,
ADD COLUMN IF NOT EXISTS dual_volume numeric,
ADD COLUMN IF NOT EXISTS dual_units integer;

-- Add index for filtering by volume
CREATE INDEX IF NOT EXISTS idx_leads_total_volume ON public.leads(total_volume);
CREATE INDEX IF NOT EXISTS idx_leads_total_units ON public.leads(total_units);
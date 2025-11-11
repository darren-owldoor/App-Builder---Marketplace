-- Add all missing Model Match fields to leads table
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS facebook_url TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS twitter_url TEXT,
  ADD COLUMN IF NOT EXISTS youtube_url TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS buyer_financed NUMERIC,
  ADD COLUMN IF NOT EXISTS seller_financed NUMERIC,
  ADD COLUMN IF NOT EXISTS percent_financed NUMERIC,
  ADD COLUMN IF NOT EXISTS seller_side_percentage NUMERIC,
  ADD COLUMN IF NOT EXISTS purchase_percentage NUMERIC,
  ADD COLUMN IF NOT EXISTS conventional_percentage NUMERIC,
  ADD COLUMN IF NOT EXISTS top_lender TEXT,
  ADD COLUMN IF NOT EXISTS top_lender_share NUMERIC,
  ADD COLUMN IF NOT EXISTS top_lender_volume NUMERIC,
  ADD COLUMN IF NOT EXISTS top_originator TEXT,
  ADD COLUMN IF NOT EXISTS top_originator_share NUMERIC,
  ADD COLUMN IF NOT EXISTS top_originator_volume NUMERIC,
  ADD COLUMN IF NOT EXISTS transactions_per_year INTEGER,
  ADD COLUMN IF NOT EXISTS date TIMESTAMP WITH TIME ZONE;

-- Add indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_leads_linkedin_url ON public.leads(linkedin_url) WHERE linkedin_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_top_lender ON public.leads(top_lender) WHERE top_lender IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_top_originator ON public.leads(top_originator) WHERE top_originator IS NOT NULL;
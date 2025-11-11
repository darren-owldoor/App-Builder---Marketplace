-- Add new fields to agents table
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS average_deal numeric,
  ADD COLUMN IF NOT EXISTS low_price_point numeric,
  ADD COLUMN IF NOT EXISTS high_price_point numeric,
  ADD COLUMN IF NOT EXISTS price_range text,
  ADD COLUMN IF NOT EXISTS phone2 text,
  ADD COLUMN IF NOT EXISTS email2 text,
  ADD COLUMN IF NOT EXISTS tiktok_url text,
  ADD COLUMN IF NOT EXISTS homes_com_url text,
  ADD COLUMN IF NOT EXISTS realtor_com_url text;
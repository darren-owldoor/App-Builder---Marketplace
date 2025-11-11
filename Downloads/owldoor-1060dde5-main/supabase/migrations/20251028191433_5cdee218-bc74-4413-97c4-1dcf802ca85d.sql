-- Add new fields to leads table
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS transactions integer,
ADD COLUMN IF NOT EXISTS experience integer,
ADD COLUMN IF NOT EXISTS total_sales numeric,
ADD COLUMN IF NOT EXISTS motivation integer,
ADD COLUMN IF NOT EXISTS wants text[],
ADD COLUMN IF NOT EXISTS skills text[],
ADD COLUMN IF NOT EXISTS profile_url text,
ADD COLUMN IF NOT EXISTS image_url text;
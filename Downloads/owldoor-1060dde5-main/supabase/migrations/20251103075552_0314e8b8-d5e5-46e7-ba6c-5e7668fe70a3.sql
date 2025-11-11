-- Clean up existing magic_links and modify structure
DELETE FROM public.magic_links;

-- Drop old token column and add new code column
ALTER TABLE public.magic_links 
  DROP COLUMN IF EXISTS token;

ALTER TABLE public.magic_links
  ADD COLUMN code TEXT NOT NULL;

-- Add attempts column to track verification attempts
ALTER TABLE public.magic_links
  ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 0;

-- Add index for faster code lookups
CREATE INDEX IF NOT EXISTS idx_magic_links_code ON public.magic_links(code);

-- Add constraint to ensure code is 4-5 digits
ALTER TABLE public.magic_links 
  ADD CONSTRAINT check_code_format CHECK (code ~ '^[0-9]{4,5}$');
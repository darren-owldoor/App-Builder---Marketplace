-- Add missing score_breakdown column to matches table
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS score_breakdown JSONB DEFAULT '{}'::jsonb;
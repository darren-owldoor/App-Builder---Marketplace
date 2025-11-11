-- Add motivation_score and star_rating to ai_leads table
ALTER TABLE public.ai_leads 
ADD COLUMN IF NOT EXISTS motivation_score INTEGER DEFAULT 10 CHECK (motivation_score >= 1 AND motivation_score <= 10),
ADD COLUMN IF NOT EXISTS star_rating DECIMAL(2,1) DEFAULT NULL CHECK (star_rating >= 0 AND star_rating <= 5.0);
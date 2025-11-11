-- Add hashing function for API keys
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add hash column to zapier_api_keys table
ALTER TABLE public.zapier_api_keys 
ADD COLUMN IF NOT EXISTS api_key_hash text;

-- Create index on hash for performance
CREATE INDEX IF NOT EXISTS idx_zapier_api_keys_hash ON public.zapier_api_keys(api_key_hash);

-- Hash existing API keys (one-time migration)
UPDATE public.zapier_api_keys 
SET api_key_hash = encode(digest(api_key, 'sha256'), 'hex')
WHERE api_key_hash IS NULL AND api_key IS NOT NULL;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Staff can manage all support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Staff can view training data" ON public.ai_training_data;

-- Add RLS policies for support_tickets
CREATE POLICY "Staff can manage all support tickets"
ON public.support_tickets
FOR ALL
USING (public.has_role(auth.uid(), 'staff'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'staff'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own tickets"
ON public.support_tickets
FOR SELECT
USING (
  (user_id IS NOT NULL AND user_id = auth.uid()) 
  OR public.has_role(auth.uid(), 'staff'::app_role) 
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- Add RLS policy for ai_training_data (staff read access)
CREATE POLICY "Staff can view training data"
ON public.ai_training_data
FOR SELECT
USING (public.has_role(auth.uid(), 'staff'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

-- Add rate limiting table for 2FA
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  endpoint text NOT NULL,
  attempt_count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(identifier, endpoint)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Drop existing rate limit policy if it exists
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rate_limits;

-- Allow edge functions to manage rate limits
CREATE POLICY "Service role can manage rate limits"
ON public.rate_limits
FOR ALL
USING (true)
WITH CHECK (true);
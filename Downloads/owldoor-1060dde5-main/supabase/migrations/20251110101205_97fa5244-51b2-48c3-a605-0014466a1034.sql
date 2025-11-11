-- Drop the problematic function entirely
DROP FUNCTION IF EXISTS public.trigger_auto_charge_on_match() CASCADE;

-- Allow service role (edge functions) to insert matches
DROP POLICY IF EXISTS "Service role can insert matches" ON public.matches;
CREATE POLICY "Service role can insert matches"
ON public.matches
FOR INSERT
TO service_role
WITH CHECK (true);

-- Create the missing match for Jason Bishop
INSERT INTO public.matches (client_id, pro_id, purchased, cost, pricing_tier, match_score)
VALUES (
  '15c15a9c-df7a-45e7-aa9e-88b6a7b9da11',
  'a2b2625f-5aea-4bd3-af2d-a600ee0f6130',
  false,
  50,
  'basic',
  95
);
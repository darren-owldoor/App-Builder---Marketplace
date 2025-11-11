-- Fix critical security issue: Remove overly permissive RLS policy on pros table
-- This prevents direct client access to PII fields

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Public can view limited pro data" ON public.pros;

-- Create new strict policy: Only allow owners and admins to view full records
CREATE POLICY "Pros can view their own full data"
ON public.pros
FOR SELECT
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'staff'::app_role)
);

-- Note: Client access to agent data will now go through the get-agents edge function
-- which enforces unlock checks and returns only non-PII for locked agents
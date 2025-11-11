
-- Fix critical magic_links RLS policy vulnerability
-- Remove the insecure policy with 'OR true' and replace with proper email filtering

-- Drop the existing insecure policy that has 'OR true'
DROP POLICY IF EXISTS "Users can read their own magic links" ON public.magic_links;

-- Create secure policy that only allows users to read their own magic links
-- Removed the dangerous 'OR true' clause
CREATE POLICY "Users can read their own magic links" ON public.magic_links
FOR SELECT 
USING (
  email = (current_setting('request.jwt.claims', true)::json ->> 'email')
);

-- Add comment explaining the security fix
COMMENT ON POLICY "Users can read their own magic links" ON public.magic_links IS 
'Allows users to read only magic links sent to their email address. Fixed critical vulnerability by removing OR true clause.';

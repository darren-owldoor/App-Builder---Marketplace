
-- Fix payment_setup_tokens RLS policy
-- Drop the insecure policy that allows anyone to read payment tokens
DROP POLICY IF EXISTS "Anyone can read payment setup tokens" ON payment_setup_tokens;

-- Create secure policy restricting access to admins and token owners
CREATE POLICY "Admins and token owners can read payment tokens" ON payment_setup_tokens
FOR SELECT USING (
  -- Allow admins to read all tokens
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Allow client owners to read their own tokens
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
);

-- Add expiration check for additional security
-- This ensures expired tokens can't be accessed even if found
CREATE POLICY "Cannot access expired payment tokens" ON payment_setup_tokens
FOR SELECT USING (
  expires_at > NOW()
);

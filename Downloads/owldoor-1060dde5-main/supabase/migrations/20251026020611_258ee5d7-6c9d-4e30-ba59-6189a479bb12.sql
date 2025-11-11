-- Drop the restrictive policy that blocks all inserts
DROP POLICY IF EXISTS "Prevent direct role insertion" ON user_roles;

-- Create a new policy that allows staff AND the system to insert roles
CREATE POLICY "Staff and system can insert roles" 
ON user_roles 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'staff'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR auth.uid() IS NULL -- Allow service role/system operations
);

-- Update existing users who should be clients (have valid email domains, not placeholder emails)
-- First, we need to identify which leads should be clients
-- We'll look for users with company-style emails or specific brokerages

-- Update user_roles: change 'lead' to 'client' for users with brokerage-style emails
UPDATE user_roles
SET role = 'client'
WHERE role = 'lead'
AND user_id IN (
  SELECT id FROM profiles 
  WHERE email LIKE '%@%.com' 
  AND email NOT LIKE '%@placeholder.com'
  AND email NOT LIKE '%@agentzip.com'
  AND email NOT LIKE '%@owldoor.com'
);
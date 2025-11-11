-- Fix critical RLS vulnerability on pros table
-- Remove overly permissive policies that allow any authenticated user to view/insert all pros data

DROP POLICY IF EXISTS "Allow authenticated users to view leads" ON pros;
DROP POLICY IF EXISTS "Allow authenticated users to insert leads" ON pros;

-- Add proper role-based and owner-based access control

-- Pros can view and update their own record
CREATE POLICY "Pros can view own record"
ON pros FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Pros can update own record"
ON pros FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Clients can view pros they have matches with
CREATE POLICY "Clients can view matched pros"
ON pros FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM matches m
    JOIN clients c ON c.id = m.client_id
    WHERE m.pro_id = pros.id
    AND c.user_id = auth.uid()
  )
);

-- Staff and admin can view and manage all pros
CREATE POLICY "Staff and admin can view all pros"
ON pros FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'staff') OR
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "Staff and admin can insert pros"
ON pros FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'staff') OR
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "Staff and admin can update all pros"
ON pros FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'staff') OR
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admin can delete pros"
ON pros FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));
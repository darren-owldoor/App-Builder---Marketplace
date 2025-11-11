-- Remove staff write permissions on pricing_packages
DROP POLICY IF EXISTS "Staff can insert packages" ON pricing_packages;
DROP POLICY IF EXISTS "Staff can update packages" ON pricing_packages;
DROP POLICY IF EXISTS "Staff can delete packages" ON pricing_packages;

-- Clean up duplicate SELECT policies for staff
DROP POLICY IF EXISTS "Staff can view pricing packages" ON pricing_packages;
DROP POLICY IF EXISTS "Staff can view all packages" ON pricing_packages;

-- Create single clean policy for staff to view packages
CREATE POLICY "staff_view_packages" ON pricing_packages
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
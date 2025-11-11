-- Drop existing restrictive policies and create comprehensive ones for leads table
DROP POLICY IF EXISTS "Block anonymous access to leads" ON public.leads;
DROP POLICY IF EXISTS "Leads can view their own record" ON public.leads;
DROP POLICY IF EXISTS "Staff can manage all leads" ON public.leads;

-- Allow staff to perform all operations on leads (including inserts with null user_id)
CREATE POLICY "Staff can manage all leads"
ON public.leads
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'staff'::app_role))
WITH CHECK (has_role(auth.uid(), 'staff'::app_role));

-- Allow leads to view their own records
CREATE POLICY "Leads can view their own record"
ON public.leads
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Block completely anonymous (not logged in) access
CREATE POLICY "Block anonymous access to leads"
ON public.leads
FOR ALL
TO anon
USING (false);
-- Temporarily allow authenticated users to insert into leads table
DROP POLICY IF EXISTS "Users can insert their own lead profile" ON public.leads;
DROP POLICY IF EXISTS "Users can view their own lead profile" ON public.leads;

CREATE POLICY "Allow authenticated users to insert leads"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view leads"
ON public.leads
FOR SELECT
TO authenticated
USING (true);
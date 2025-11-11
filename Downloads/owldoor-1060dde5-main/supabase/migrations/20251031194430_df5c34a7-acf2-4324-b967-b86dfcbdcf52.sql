-- Add INSERT policy for clients to create their own record during sign-up
CREATE POLICY "Clients can create their own record"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
-- Remove client INSERT policy for phone numbers
DROP POLICY IF EXISTS "Clients can insert their own phone numbers" ON public.client_phone_numbers;

-- Update client SELECT policy to only view their own numbers
DROP POLICY IF EXISTS "Clients can view their phone numbers" ON public.client_phone_numbers;

CREATE POLICY "Clients can view their phone numbers" 
ON public.client_phone_numbers 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM clients c
    WHERE c.id = client_phone_numbers.client_id 
    AND c.user_id = auth.uid()
  )
);

-- Update client UPDATE/DELETE policies
DROP POLICY IF EXISTS "Clients can update their phone numbers" ON public.client_phone_numbers;
DROP POLICY IF EXISTS "Clients can delete their phone numbers" ON public.client_phone_numbers;
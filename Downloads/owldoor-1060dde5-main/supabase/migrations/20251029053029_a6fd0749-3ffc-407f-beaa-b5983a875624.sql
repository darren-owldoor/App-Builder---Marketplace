-- Add RLS policy for clients to insert their own phone numbers
CREATE POLICY "Clients can insert their own phone numbers"
ON public.client_phone_numbers
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM clients c
    WHERE c.id = client_phone_numbers.client_id
    AND c.user_id = auth.uid()
  )
);
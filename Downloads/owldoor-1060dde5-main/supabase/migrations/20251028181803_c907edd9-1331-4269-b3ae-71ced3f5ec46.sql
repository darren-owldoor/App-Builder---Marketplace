-- Allow clients to manage their own Zapier API keys

-- Add policy for clients to view their own API keys
CREATE POLICY "Clients can view their own API keys"
ON public.zapier_api_keys
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Add policy for clients to create their own API keys
CREATE POLICY "Clients can create their own API keys"
ON public.zapier_api_keys
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add policy for clients to update their own API keys
CREATE POLICY "Clients can update their own API keys"
ON public.zapier_api_keys
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Add policy for clients to delete their own API keys
CREATE POLICY "Clients can delete their own API keys"
ON public.zapier_api_keys
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
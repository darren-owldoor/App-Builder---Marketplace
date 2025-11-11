-- Update RLS policies on zapier_api_keys to be admin-only for creation

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own API keys" ON public.zapier_api_keys;
DROP POLICY IF EXISTS "Users can create their own API keys" ON public.zapier_api_keys;
DROP POLICY IF EXISTS "Users can update their own API keys" ON public.zapier_api_keys;
DROP POLICY IF EXISTS "Users can delete their own API keys" ON public.zapier_api_keys;

-- Only admins can view all API keys
CREATE POLICY "Admins can view all API keys"
ON public.zapier_api_keys
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can create API keys for any user
CREATE POLICY "Admins can create API keys"
ON public.zapier_api_keys
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update API keys
CREATE POLICY "Admins can update API keys"
ON public.zapier_api_keys
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete API keys
CREATE POLICY "Admins can delete API keys"
ON public.zapier_api_keys
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
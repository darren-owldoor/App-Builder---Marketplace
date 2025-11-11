-- Restrict staff access to admin-only tables

-- Remove staff access to pricing packages (admin only)
DROP POLICY IF EXISTS "Staff can manage pricing packages" ON public.pricing_packages;

-- Remove staff access to payment configs (admin only)
DROP POLICY IF EXISTS "Staff can manage payment configs" ON public.payment_configs;

-- Remove staff access to email configs (admin only)  
DROP POLICY IF EXISTS "Staff can manage email configs" ON public.email_configs;

-- Remove staff access to sms provider configs (admin only)
DROP POLICY IF EXISTS "Staff can manage sms provider configs" ON public.sms_provider_configs;

-- Remove staff access to Zapier API keys (admin only)
DROP POLICY IF EXISTS "Staff can manage zapier api keys" ON public.zapier_api_keys;

-- Remove staff access to Zapier webhooks (admin only)
DROP POLICY IF EXISTS "Staff can manage zapier webhooks" ON public.zapier_webhooks;

-- Staff can only VIEW pricing packages (for client assignment)
CREATE POLICY "Staff can view pricing packages"
ON public.pricing_packages
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'staff'));

-- Admin-only policies for sensitive tables
CREATE POLICY "Only admins can manage pricing packages"
ON public.pricing_packages
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can manage payment configs"
ON public.payment_configs
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can manage email configs"
ON public.email_configs
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can manage sms provider configs"
ON public.sms_provider_configs
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can manage zapier api keys"
ON public.zapier_api_keys
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can manage zapier webhooks"
ON public.zapier_webhooks
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));
-- Create signup_links table for tracking custom sign-up forms
CREATE TABLE public.signup_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES public.pricing_packages(id) ON DELETE CASCADE,
  link_slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  custom_verbiage JSONB DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0
);

-- Add RLS policies
ALTER TABLE public.signup_links ENABLE ROW LEVEL SECURITY;

-- Staff can manage all signup links
CREATE POLICY "Staff can manage all signup links"
ON public.signup_links
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'staff'::app_role))
WITH CHECK (has_role(auth.uid(), 'staff'::app_role));

-- Anyone can view active signup links (needed for public signup)
CREATE POLICY "Anyone can view active signup links"
ON public.signup_links
FOR SELECT
TO anon, authenticated
USING (active = true);

-- Add trigger for updated_at
CREATE TRIGGER update_signup_links_updated_at
BEFORE UPDATE ON public.signup_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster slug lookups
CREATE INDEX idx_signup_links_slug ON public.signup_links(link_slug);
CREATE INDEX idx_signup_links_package ON public.signup_links(package_id);
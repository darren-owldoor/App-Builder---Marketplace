-- Create table for magic links
CREATE TABLE public.admin_magic_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  target_user_id UUID NOT NULL REFERENCES auth.users(id),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_magic_links ENABLE ROW LEVEL SECURITY;

-- Admins can create magic links
CREATE POLICY "Admins can create magic links"
  ON public.admin_magic_links
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can view magic links they created
CREATE POLICY "Admins can view their magic links"
  ON public.admin_magic_links
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) AND created_by = auth.uid());

-- Create index for faster token lookups
CREATE INDEX idx_admin_magic_links_token ON public.admin_magic_links(token);
CREATE INDEX idx_admin_magic_links_expires_at ON public.admin_magic_links(expires_at);
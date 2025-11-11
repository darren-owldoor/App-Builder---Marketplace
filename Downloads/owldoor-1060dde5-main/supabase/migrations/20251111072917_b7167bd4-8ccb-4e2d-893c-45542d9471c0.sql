-- Create URL redirects table for managing 404 forwarding
CREATE TABLE public.url_redirects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_path TEXT NOT NULL UNIQUE,
  to_path TEXT NOT NULL,
  redirect_type TEXT NOT NULL DEFAULT 'permanent' CHECK (redirect_type IN ('permanent', 'temporary')),
  status_code INTEGER NOT NULL DEFAULT 301 CHECK (status_code IN (301, 302, 307, 308)),
  is_active BOOLEAN NOT NULL DEFAULT true,
  hit_count INTEGER NOT NULL DEFAULT 0,
  last_hit_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for fast lookups
CREATE INDEX idx_url_redirects_from_path ON public.url_redirects(from_path) WHERE is_active = true;
CREATE INDEX idx_url_redirects_active ON public.url_redirects(is_active);

-- Enable RLS
ALTER TABLE public.url_redirects ENABLE ROW LEVEL SECURITY;

-- Admins can view all redirects
CREATE POLICY "Admins can view all redirects"
  ON public.url_redirects
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can create redirects
CREATE POLICY "Admins can create redirects"
  ON public.url_redirects
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update redirects
CREATE POLICY "Admins can update redirects"
  ON public.url_redirects
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete redirects
CREATE POLICY "Admins can delete redirects"
  ON public.url_redirects
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to update updated_at
CREATE TRIGGER update_url_redirects_updated_at
  BEFORE UPDATE ON public.url_redirects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to find redirect for a path (public access for checking redirects)
CREATE OR REPLACE FUNCTION public.find_redirect(p_path TEXT)
RETURNS TABLE(to_path TEXT, status_code INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update hit count and return redirect if found
  RETURN QUERY
  UPDATE url_redirects
  SET 
    hit_count = hit_count + 1,
    last_hit_at = NOW()
  WHERE from_path = p_path 
    AND is_active = true
  RETURNING url_redirects.to_path, url_redirects.status_code;
END;
$$;
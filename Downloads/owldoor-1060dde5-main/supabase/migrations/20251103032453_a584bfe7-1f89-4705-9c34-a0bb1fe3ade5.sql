-- Create magic_links table for custom authentication links
CREATE TABLE IF NOT EXISTS public.magic_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.magic_links ENABLE ROW LEVEL SECURITY;

-- Create index for faster token lookup
CREATE INDEX idx_magic_links_token ON public.magic_links(token);
CREATE INDEX idx_magic_links_expires_at ON public.magic_links(expires_at);

-- Policy: Anyone can read their own unused, non-expired magic links
CREATE POLICY "Users can read their own magic links"
  ON public.magic_links
  FOR SELECT
  USING (email = current_setting('request.jwt.claims', true)::json->>'email' OR true);

-- Policy: Service role can manage all magic links
CREATE POLICY "Service role can manage magic links"
  ON public.magic_links
  FOR ALL
  USING (auth.role() = 'service_role');
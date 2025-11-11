-- Create table to store user-specific Calendly OAuth tokens
CREATE TABLE public.calendly_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ,
  calendly_user_uri TEXT,
  calendly_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.calendly_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only view their own tokens
CREATE POLICY "Users can view own tokens"
ON public.calendly_tokens
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own tokens
CREATE POLICY "Users can insert own tokens"
ON public.calendly_tokens
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own tokens
CREATE POLICY "Users can update own tokens"
ON public.calendly_tokens
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own tokens
CREATE POLICY "Users can delete own tokens"
ON public.calendly_tokens
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_calendly_tokens_updated_at
BEFORE UPDATE ON public.calendly_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
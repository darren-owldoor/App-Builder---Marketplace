-- Create ai_chat_logs table for rate limiting and tracking
CREATE TABLE IF NOT EXISTS public.ai_chat_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_chat_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own chat logs
CREATE POLICY "Users can view their own chat logs"
ON public.ai_chat_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: System can insert chat logs
CREATE POLICY "System can insert chat logs"
ON public.ai_chat_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for rate limiting queries
CREATE INDEX idx_ai_chat_logs_user_created ON public.ai_chat_logs(user_id, created_at DESC);

-- Add admin setting for AI chat toggle
ALTER TABLE public.admin_settings 
ADD COLUMN IF NOT EXISTS ai_chat_enabled BOOLEAN DEFAULT true;

COMMENT ON COLUMN public.admin_settings.ai_chat_enabled IS 'Enable/disable AI chat for clients';

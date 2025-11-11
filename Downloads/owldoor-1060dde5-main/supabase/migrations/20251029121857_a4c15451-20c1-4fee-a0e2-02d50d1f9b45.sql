-- Create table for AI training data
CREATE TABLE IF NOT EXISTS public.ai_training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT,
  category TEXT DEFAULT 'general',
  is_answered BOOLEAN DEFAULT false,
  agent_conversation_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_training_data ENABLE ROW LEVEL SECURITY;

-- Allow admins to read and write
CREATE POLICY "Admins can manage training data"
ON public.ai_training_data
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Create index for faster queries
CREATE INDEX idx_ai_training_unanswered ON public.ai_training_data(is_answered, created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_ai_training_updated_at
BEFORE UPDATE ON public.ai_training_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
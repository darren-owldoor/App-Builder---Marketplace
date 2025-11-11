-- Create market_coverage table to store user service areas
CREATE TABLE public.market_coverage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coverage_type TEXT NOT NULL CHECK (coverage_type IN ('cities', 'radius', 'polygon')),
  name TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.market_coverage ENABLE ROW LEVEL SECURITY;

-- Users can view their own coverage areas
CREATE POLICY "Users can view their own market coverage"
ON public.market_coverage
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own coverage areas
CREATE POLICY "Users can create their own market coverage"
ON public.market_coverage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own coverage areas
CREATE POLICY "Users can update their own market coverage"
ON public.market_coverage
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own coverage areas
CREATE POLICY "Users can delete their own market coverage"
ON public.market_coverage
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_market_coverage_updated_at
BEFORE UPDATE ON public.market_coverage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
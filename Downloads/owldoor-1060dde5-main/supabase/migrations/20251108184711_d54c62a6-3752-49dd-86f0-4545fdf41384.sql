-- Add unique constraint for rate_limits table to fix ON CONFLICT issue
ALTER TABLE public.rate_limits 
ADD CONSTRAINT rate_limits_identifier_endpoint_window_unique 
UNIQUE (identifier, endpoint, window_start);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_window 
ON public.rate_limits (identifier, endpoint, window_start DESC);
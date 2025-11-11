-- Step 1: Ensure rate_limits table has correct structure
-- The table already exists with columns: identifier, endpoint, attempt_count, window_start
-- This is fine, we'll use it as-is

-- Step 2: Secure Zapier API keys - remove plaintext storage
-- First, ensure api_key_hash exists for all records
UPDATE public.zapier_api_keys
SET api_key_hash = encode(digest(api_key, 'sha256'), 'hex')
WHERE api_key_hash IS NULL AND api_key IS NOT NULL;

-- Make api_key_hash NOT NULL
ALTER TABLE public.zapier_api_keys
ALTER COLUMN api_key_hash SET NOT NULL;

-- Now drop the plaintext api_key column (SECURITY: no more plaintext keys!)
ALTER TABLE public.zapier_api_keys
DROP COLUMN IF EXISTS api_key;

-- Add comment explaining security
COMMENT ON COLUMN public.zapier_api_keys.api_key_hash IS 'SHA-256 hash of API key for secure verification. Plaintext keys are never stored.';

-- Add function to check rate limit (using existing table structure)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER,
  p_window_minutes INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_current_count INTEGER;
BEGIN
  -- Calculate window start time
  v_window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  -- Get current request count in window
  SELECT COALESCE(SUM(attempt_count), 0)
  INTO v_current_count
  FROM public.rate_limits
  WHERE identifier = p_identifier
    AND endpoint = p_endpoint
    AND window_start >= v_window_start;
  
  -- Check if limit exceeded
  IF v_current_count >= p_max_requests THEN
    RETURN FALSE;
  END IF;
  
  -- Insert or update rate limit record
  INSERT INTO public.rate_limits (identifier, endpoint, attempt_count, window_start)
  VALUES (p_identifier, p_endpoint, 1, NOW())
  ON CONFLICT (identifier, endpoint, window_start)
  DO UPDATE SET attempt_count = rate_limits.attempt_count + 1;
  
  RETURN TRUE;
END;
$$;
-- Add onboarding and user type fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS user_type TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_data JSONB;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON public.profiles(onboarding_completed);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.user_type IS 'User type: broker, agent, lender, etc.';
COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Whether user has completed AI-powered onboarding flow';
COMMENT ON COLUMN public.profiles.onboarding_data IS 'AI-generated onboarding answers stored as JSON for intelligent matching';
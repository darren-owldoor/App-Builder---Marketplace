-- Add active column to profiles table if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- Create a function to check if user is active
CREATE OR REPLACE FUNCTION public.is_user_active(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(active, true)
  FROM public.profiles
  WHERE id = _user_id
$$;

-- Create a trigger to prevent inactive users from creating sessions
CREATE OR REPLACE FUNCTION public.check_user_active()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow if user is active or if they're an admin
  IF NOT public.is_user_active(NEW.user_id) AND NOT public.has_role(NEW.user_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Your Account Is Not Active at This Time. Email Hello@OwlDoor.com if you think this is a mistake';
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.sessions to check active status
DROP TRIGGER IF EXISTS check_user_active_on_login ON auth.sessions;
CREATE TRIGGER check_user_active_on_login
  BEFORE INSERT ON auth.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_user_active();
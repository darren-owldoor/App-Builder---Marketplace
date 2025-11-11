-- Fix search_path for has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Fix other functions that might need search_path
-- Update increment_profile_views (already has it but ensure it's correct)
CREATE OR REPLACE FUNCTION public.increment_profile_views(profile_id UUID)
RETURNS TABLE(view_count BIGINT) 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Increment view count
  UPDATE pros
  SET 
    profile_views = COALESCE(profile_views, 0) + 1,
    last_viewed_at = NOW()
  WHERE id = profile_id;
  
  -- Return new count
  RETURN QUERY
  SELECT profile_views::BIGINT
  FROM pros
  WHERE id = profile_id;
END;
$$;

-- Ensure update_updated_at_column has correct search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
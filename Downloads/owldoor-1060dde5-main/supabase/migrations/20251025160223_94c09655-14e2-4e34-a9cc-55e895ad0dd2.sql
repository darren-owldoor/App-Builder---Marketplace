-- Fix 1: Block anonymous access to sensitive tables
-- Add policies to prevent unauthenticated users from accessing PII data

-- Block anonymous access to profiles table
CREATE POLICY "Block anonymous access to profiles" 
ON profiles FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Block anonymous access to leads table
CREATE POLICY "Block anonymous access to leads" 
ON leads FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Block anonymous access to bids table
CREATE POLICY "Block anonymous access to bids" 
ON bids FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Block anonymous access to clients table
CREATE POLICY "Block anonymous access to clients" 
ON clients FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Block anonymous access to matches table
CREATE POLICY "Block anonymous access to matches" 
ON matches FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Block anonymous access to lead_answers table
CREATE POLICY "Block anonymous access to lead_answers" 
ON lead_answers FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Fix 2: Prevent privilege escalation by securing role assignment
-- Create trigger to automatically assign default role on user signup

CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Assign default 'lead' role to new users (least privilege principle)
  INSERT INTO public.user_roles (user_id, role) 
  VALUES (NEW.id, 'lead');
  RETURN NEW;
END;
$$;

-- Create trigger that fires after user creation
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.assign_default_role();

-- Block direct role insertion from client-side to prevent privilege escalation
CREATE POLICY "Prevent direct role insertion"
ON user_roles FOR INSERT
WITH CHECK (false);
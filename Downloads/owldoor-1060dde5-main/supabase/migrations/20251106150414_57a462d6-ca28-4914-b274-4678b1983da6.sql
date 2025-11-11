-- Fix infinite recursion in matches table RLS and clients table data exposure

-- Step 1: Create SECURITY DEFINER functions to check ownership without triggering RLS
CREATE OR REPLACE FUNCTION public.is_client_owner(_client_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.clients
    WHERE id = _client_id
      AND user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_pro_owner(_pro_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.pros
    WHERE id = _pro_id
      AND user_id = _user_id
  )
$$;

-- Step 2: Fix matches table policies to use SECURITY DEFINER functions (prevents infinite recursion)
DROP POLICY IF EXISTS "Clients can view their matches" ON matches;
CREATE POLICY "Clients can view their matches"
ON matches FOR SELECT
USING (public.is_client_owner(client_id, auth.uid()));

DROP POLICY IF EXISTS "Leads can view their matches" ON matches;
CREATE POLICY "Leads can view their matches"
ON matches FOR SELECT
USING (public.is_pro_owner(pro_id, auth.uid()));

-- Step 3: Fix clients table RLS policy - CRITICAL SECURITY FIX
-- The "Block anonymous access to clients" policy currently GRANTS access to all authenticated users
-- This is the SAME vulnerability we fixed on the pros table
DROP POLICY IF EXISTS "Block anonymous access to clients" ON clients;
CREATE POLICY "Block anonymous access to clients"
ON clients FOR ALL
USING (false);  -- Actually block anonymous access

-- The existing secure policies will now properly control access:
-- - "Clients can view their own record" (auth.uid() = user_id)
-- - "Staff can manage all clients" (has_role staff)
-- - "Admins have full access to clients" (has_role admin)
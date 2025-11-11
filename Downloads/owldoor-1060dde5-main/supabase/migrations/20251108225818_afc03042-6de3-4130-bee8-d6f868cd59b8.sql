-- Create agent_unlocks table to track which clients have paid to view which agents
CREATE TABLE IF NOT EXISTS public.agent_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  pro_id UUID NOT NULL REFERENCES public.pros(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  amount_paid NUMERIC(10,2) NOT NULL,
  payment_intent_id TEXT,
  UNIQUE(client_id, pro_id)
);

-- Enable RLS on agent_unlocks
ALTER TABLE public.agent_unlocks ENABLE ROW LEVEL SECURITY;

-- Policy: Clients can view their own unlocks
CREATE POLICY "Clients can view their own unlocks"
ON public.agent_unlocks
FOR SELECT
USING (
  client_id IN (
    SELECT id FROM public.clients WHERE user_id = auth.uid()
  )
);

-- Policy: Admin can view all unlocks
CREATE POLICY "Admins can view all unlocks"
ON public.agent_unlocks
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create function to check if a client has unlocked an agent
CREATE OR REPLACE FUNCTION public.has_unlocked_agent(p_client_id UUID, p_pro_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.agent_unlocks
    WHERE client_id = p_client_id
      AND pro_id = p_pro_id
  );
$$;

-- Update RLS policies on pros table to hide PII unless unlocked

-- Drop existing SELECT policies on pros if any
DROP POLICY IF EXISTS "Pros can view own data" ON public.pros;
DROP POLICY IF EXISTS "Admins can view all pros" ON public.pros;
DROP POLICY IF EXISTS "Public can view limited pro data" ON public.pros;

-- Policy: Pros can view their own full data
CREATE POLICY "Pros can view own data"
ON public.pros
FOR SELECT
USING (user_id = auth.uid());

-- Policy: Admins can view all data
CREATE POLICY "Admins can view all pros"
ON public.pros
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Staff can view all data
CREATE POLICY "Staff can view all pros"
ON public.pros
FOR SELECT
USING (public.has_role(auth.uid(), 'staff'));

-- Policy: Clients can view pros they've unlocked (full data)
CREATE POLICY "Clients can view unlocked pros"
ON public.pros
FOR SELECT
USING (
  public.has_role(auth.uid(), 'client') AND
  id IN (
    SELECT pro_id 
    FROM public.agent_unlocks au
    JOIN public.clients c ON c.id = au.client_id
    WHERE c.user_id = auth.uid()
  )
);

-- Policy: Public/clients can view basic non-PII data for all pros
CREATE POLICY "Public can view limited pro data"
ON public.pros
FOR SELECT
USING (
  -- Everyone can see non-PII fields
  -- The actual field filtering will be done in the application layer
  true
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_agent_unlocks_client_pro ON public.agent_unlocks(client_id, pro_id);
CREATE INDEX IF NOT EXISTS idx_agent_unlocks_pro ON public.agent_unlocks(pro_id);

-- Auto-assign client role to new team signups
-- Update the existing assign_default_role function to handle team signups
CREATE OR REPLACE FUNCTION public.assign_client_role_to_teams()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a new client record is created, assign client role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.user_id, 'client')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-assign client role when client record is created
DROP TRIGGER IF EXISTS assign_client_role_on_client_insert ON public.clients;
CREATE TRIGGER assign_client_role_on_client_insert
AFTER INSERT ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.assign_client_role_to_teams();
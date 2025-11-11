-- Add active user validation to sensitive tables using existing is_user_active function

-- Clients table: Ensure only active users can access their client records
DROP POLICY IF EXISTS "Clients can view their own data" ON public.clients;
CREATE POLICY "Clients can view their own data" 
ON public.clients 
FOR SELECT 
USING (
  user_id = auth.uid() 
  AND is_user_active(auth.uid())
);

DROP POLICY IF EXISTS "Clients can update their own data" ON public.clients;
CREATE POLICY "Clients can update their own data" 
ON public.clients 
FOR UPDATE 
USING (
  user_id = auth.uid() 
  AND is_user_active(auth.uid())
);

DROP POLICY IF EXISTS "Clients can insert their own data" ON public.clients;
CREATE POLICY "Clients can insert their own data" 
ON public.clients 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() 
  AND is_user_active(auth.uid())
);

-- Pros table: Ensure only active users can access their pro records
DROP POLICY IF EXISTS "Pros can view their own data" ON public.pros;
CREATE POLICY "Pros can view their own data" 
ON public.pros 
FOR SELECT 
USING (
  user_id = auth.uid() 
  AND is_user_active(auth.uid())
);

DROP POLICY IF EXISTS "Pros can update their own data" ON public.pros;
CREATE POLICY "Pros can update their own data" 
ON public.pros 
FOR UPDATE 
USING (
  user_id = auth.uid() 
  AND is_user_active(auth.uid())
);

-- Matches table: Ensure only active users can access matches
DROP POLICY IF EXISTS "Clients can view their matches" ON public.matches;
CREATE POLICY "Clients can view their matches" 
ON public.matches 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = matches.client_id 
    AND clients.user_id = auth.uid()
  )
  AND is_user_active(auth.uid())
);

DROP POLICY IF EXISTS "Clients can update their matches" ON public.matches;
CREATE POLICY "Clients can update their matches" 
ON public.matches 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM clients 
    WHERE clients.id = matches.client_id 
    AND clients.user_id = auth.uid()
  )
  AND is_user_active(auth.uid())
);

-- AI Leads table: Active user validation
DROP POLICY IF EXISTS "Clients can view their own AI leads" ON public.ai_leads;
CREATE POLICY "Clients can view their own AI leads" 
ON public.ai_leads 
FOR SELECT 
USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
  AND is_user_active(auth.uid())
);

DROP POLICY IF EXISTS "Clients can update their own AI leads" ON public.ai_leads;
CREATE POLICY "Clients can update their own AI leads" 
ON public.ai_leads 
FOR UPDATE 
USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
  AND is_user_active(auth.uid())
);

DROP POLICY IF EXISTS "Clients can insert their own AI leads" ON public.ai_leads;
CREATE POLICY "Clients can insert their own AI leads" 
ON public.ai_leads 
FOR INSERT 
WITH CHECK (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
  AND is_user_active(auth.uid())
);
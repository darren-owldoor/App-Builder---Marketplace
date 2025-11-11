-- Fix critical RLS vulnerability on agent_sessions table
-- Remove overly permissive policy that allows anyone to read/write verification codes

DROP POLICY IF EXISTS "Allow public access to agent_sessions" ON agent_sessions;

-- Only service role (used by edge functions) can manage sessions
-- This prevents regular users from accessing verification codes
CREATE POLICY "Service role can manage sessions"
ON agent_sessions FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- No additional policies needed for regular users
-- Edge functions automatically use service_role key
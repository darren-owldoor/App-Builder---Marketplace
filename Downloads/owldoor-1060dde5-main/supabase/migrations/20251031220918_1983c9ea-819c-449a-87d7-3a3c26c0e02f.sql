-- Create agent_sessions table for tracking chat sessions and verification
CREATE TABLE IF NOT EXISTS agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  question_count INTEGER DEFAULT 0,
  requires_signup BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  verification_code TEXT,
  verification_phone TEXT,
  verification_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;

-- Allow public access since these are anonymous chat sessions
CREATE POLICY "Allow public access to agent_sessions" ON agent_sessions
  FOR ALL USING (true) WITH CHECK (true);
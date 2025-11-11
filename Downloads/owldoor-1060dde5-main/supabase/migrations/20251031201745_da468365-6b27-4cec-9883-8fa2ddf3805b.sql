-- Fix pricing_packages RLS policies to allow staff/admin to insert
DROP POLICY IF EXISTS "Staff can manage all packages" ON pricing_packages;

-- Separate policies for better control
CREATE POLICY "Staff can view all packages"
ON pricing_packages
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can insert packages"
ON pricing_packages
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can update packages"
ON pricing_packages
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can delete packages"
ON pricing_packages
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Fix user_roles INSERT policy for client signup
DROP POLICY IF EXISTS "Users can create their own role during signup" ON user_roles;

CREATE POLICY "Users can create their own role during signup"
ON user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create AI chat IP tracking table
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  user_agent text,
  question_count integer DEFAULT 0,
  requires_signup boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can create a session but only view their own
CREATE POLICY "Anyone can create chat sessions"
ON ai_chat_sessions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can update their sessions"
ON ai_chat_sessions
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Staff can view all sessions
CREATE POLICY "Staff can view all chat sessions"
ON ai_chat_sessions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
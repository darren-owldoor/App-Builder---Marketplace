-- Add password change tracking to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS password_change_required BOOLEAN DEFAULT false;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_clients_password_change 
ON public.clients(password_change_required) 
WHERE password_change_required = true;

-- Add temporary password tracking table
CREATE TABLE IF NOT EXISTS public.temporary_passwords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  used_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id)
);

-- Enable RLS on temporary_passwords
ALTER TABLE public.temporary_passwords ENABLE ROW LEVEL SECURITY;

-- Only admins can view temporary passwords
CREATE POLICY "Admins can view temporary passwords"
ON public.temporary_passwords
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'staff')
  )
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_temp_passwords_user_id 
ON public.temporary_passwords(user_id);

CREATE INDEX IF NOT EXISTS idx_temp_passwords_expires_at 
ON public.temporary_passwords(expires_at)
WHERE used_at IS NULL;
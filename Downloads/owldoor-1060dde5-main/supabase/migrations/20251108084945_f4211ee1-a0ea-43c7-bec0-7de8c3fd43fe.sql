-- Fix phone numbers foreign key relationship
ALTER TABLE phone_numbers 
DROP CONSTRAINT IF EXISTS phone_numbers_assigned_to_user_id_fkey;

-- Add proper foreign key with nullable constraint
ALTER TABLE phone_numbers
ADD CONSTRAINT phone_numbers_assigned_to_user_id_fkey 
FOREIGN KEY (assigned_to_user_id) 
REFERENCES profiles(id) 
ON DELETE SET NULL;

-- Create payment_providers table for managing active payment provider
CREATE TABLE IF NOT EXISTS payment_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default providers
INSERT INTO payment_providers (provider_name, is_active, config) VALUES
  ('stripe', true, '{}'::jsonb),
  ('paddle', false, '{}'::jsonb)
ON CONFLICT (provider_name) DO NOTHING;

-- Enable RLS
ALTER TABLE payment_providers ENABLE ROW LEVEL SECURITY;

-- Admin can manage providers
CREATE POLICY "Admins can manage payment providers"
ON payment_providers
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Everyone can view active provider
CREATE POLICY "Anyone can view active payment provider"
ON payment_providers
FOR SELECT
USING (is_active = true);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_providers_active 
ON payment_providers(is_active) 
WHERE is_active = true;
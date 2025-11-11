-- Add custom package fields to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS custom_package_id uuid REFERENCES pricing_packages(id),
ADD COLUMN IF NOT EXISTS package_access_token text UNIQUE,
ADD COLUMN IF NOT EXISTS setup_fee numeric DEFAULT 0;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_package_access_token ON clients(package_access_token);

-- Add client_id to pricing_packages for custom packages
ALTER TABLE pricing_packages
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id),
ADD COLUMN IF NOT EXISTS is_custom boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS setup_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS location_filter jsonb,
ADD COLUMN IF NOT EXISTS transaction_minimum integer;

-- Function to generate unique access token
CREATE OR REPLACE FUNCTION generate_package_access_token()
RETURNS text AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
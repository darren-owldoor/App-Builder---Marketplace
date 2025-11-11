-- Add admin setting for bidding feature
INSERT INTO admin_settings (setting_key, setting_type, category, setting_value, description)
VALUES (
  'bidding_enabled',
  'boolean',
  'features',
  'false'::jsonb,
  'Enable/disable the bidding feature for clients'
)
ON CONFLICT (setting_key) DO NOTHING;

-- Set auto_charge_enabled default to true for new clients
ALTER TABLE clients 
ALTER COLUMN auto_charge_enabled SET DEFAULT true;
-- Add support for direct lead assignment with client_email/phone and lead_price
-- These fields allow leads from Zapier/webhooks/uploads to be automatically assigned and charged

ALTER TABLE pros 
  ADD COLUMN IF NOT EXISTS client_email text,
  ADD COLUMN IF NOT EXISTS client_phone text,
  ADD COLUMN IF NOT EXISTS lead_price numeric DEFAULT 0;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_pros_client_email ON pros(client_email) WHERE client_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pros_client_phone ON pros(client_phone) WHERE client_phone IS NOT NULL;

COMMENT ON COLUMN pros.client_email IS 'Optional: Email of client who purchased this lead. When set, lead is automatically assigned to this client.';
COMMENT ON COLUMN pros.client_phone IS 'Optional: Phone of client who purchased this lead. When set, lead is automatically assigned to this client.';
COMMENT ON COLUMN pros.lead_price IS 'Optional: Custom price for this specific lead. Overrides standard pricing when set.';
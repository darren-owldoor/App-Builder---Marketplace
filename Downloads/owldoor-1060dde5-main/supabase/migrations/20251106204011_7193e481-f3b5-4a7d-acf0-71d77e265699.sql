-- Add additional_data column to store unmapped Zapier fields
ALTER TABLE pros ADD COLUMN IF NOT EXISTS additional_data JSONB DEFAULT '{}'::jsonb;

-- Add index for better query performance on additional_data
CREATE INDEX IF NOT EXISTS idx_pros_additional_data ON pros USING GIN (additional_data);

-- Add comment
COMMENT ON COLUMN pros.additional_data IS 'Stores unmapped fields from Zapier and other integrations as JSONB';
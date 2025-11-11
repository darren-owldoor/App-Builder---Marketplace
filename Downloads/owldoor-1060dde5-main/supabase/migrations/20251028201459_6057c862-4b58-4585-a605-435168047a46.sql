-- Add new fields to leads table for enhanced lead data
ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS radius integer,
  ADD COLUMN IF NOT EXISTS company text,
  ADD COLUMN IF NOT EXISTS brokerage text,
  ADD COLUMN IF NOT EXISTS license_type text,
  ADD COLUMN IF NOT EXISTS state_license text,
  ADD COLUMN IF NOT EXISTS license text;

-- Convert single-value location fields to arrays to support multiple values
-- First, create temporary columns with array type
ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS cities_temp text[],
  ADD COLUMN IF NOT EXISTS states_temp text[],
  ADD COLUMN IF NOT EXISTS counties_temp text[];

-- Migrate existing data to array format (wrap single values in arrays)
UPDATE leads 
  SET cities_temp = CASE WHEN city IS NOT NULL THEN ARRAY[city] ELSE NULL END,
      states_temp = CASE WHEN state IS NOT NULL THEN ARRAY[state] ELSE NULL END,
      counties_temp = CASE WHEN county IS NOT NULL THEN ARRAY[county] ELSE NULL END;

-- Drop old columns
ALTER TABLE leads 
  DROP COLUMN IF EXISTS city,
  DROP COLUMN IF EXISTS state,
  DROP COLUMN IF EXISTS county;

-- Rename new columns to original names
ALTER TABLE leads 
  RENAME COLUMN cities_temp TO cities;
  
ALTER TABLE leads 
  RENAME COLUMN states_temp TO states;
  
ALTER TABLE leads 
  RENAME COLUMN counties_temp TO counties;
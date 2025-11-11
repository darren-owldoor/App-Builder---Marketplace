-- Add onboarding_completed flag to pros table
ALTER TABLE pros 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Add onboarding_completed flag to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Set existing users with profile_completed = true as having completed onboarding
UPDATE pros 
SET onboarding_completed = true 
WHERE profile_completed = true;

UPDATE clients 
SET onboarding_completed = true 
WHERE profile_completed = true;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pros_onboarding_completed ON pros(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_clients_onboarding_completed ON clients(onboarding_completed);
-- Add profile_completed column to pros and clients if not exists
ALTER TABLE pros ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;
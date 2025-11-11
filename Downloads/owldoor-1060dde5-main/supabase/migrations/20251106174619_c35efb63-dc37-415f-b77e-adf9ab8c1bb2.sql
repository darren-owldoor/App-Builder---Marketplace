-- Add provides field to clients table (what teams/companies provide)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS provides text[] DEFAULT '{}';

COMMENT ON COLUMN clients.provides IS 'What the team/company provides to agents (matches against agent wants)';

-- Rename leads table to agents and add all missing fields
ALTER TABLE leads RENAME TO agents;

-- Add new identity fields
ALTER TABLE agents ADD COLUMN IF NOT EXISTS photo_url text;

-- Add new professional information fields
ALTER TABLE agents ADD COLUMN IF NOT EXISTS license_number text;

-- Add new volume metrics fields (most already exist)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS average_sale_price numeric(12,2);

-- Add new percentage metrics fields (most already exist)

-- Add new relationship data fields (all already exist)

-- Add new calculated metrics fields
-- transactions_per_year already exists

-- Add new location data fields (cities and states already exist as arrays)

-- Add new metadata fields
ALTER TABLE agents ADD COLUMN IF NOT EXISTS date_scraped timestamp with time zone;
-- source and lead_type already exist

-- Add future/extended fields
ALTER TABLE agents ADD COLUMN IF NOT EXISTS years_experience numeric(4,1);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS specializations jsonb;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS languages jsonb;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS certifications jsonb;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS awards jsonb;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS team_size integer;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS dom numeric(5,1);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS list_to_sell_ratio numeric(5,2);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS price_reductions numeric(5,2);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS off_market_deals integer;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS luxury_volume numeric(14,2);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS commercial_volume numeric(14,2);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS rental_volume numeric(14,2);

-- Update all foreign key references from other tables
ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_lead_id_fkey;
ALTER TABLE matches ADD CONSTRAINT matches_agent_id_fkey FOREIGN KEY (lead_id) REFERENCES agents(id) ON DELETE CASCADE;

ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_lead_id_fkey;
ALTER TABLE conversations ADD CONSTRAINT conversations_agent_id_fkey FOREIGN KEY (lead_id) REFERENCES agents(id) ON DELETE CASCADE;

ALTER TABLE campaign_assignments DROP CONSTRAINT IF EXISTS campaign_assignments_lead_id_fkey;
ALTER TABLE campaign_assignments ADD CONSTRAINT campaign_assignments_agent_id_fkey FOREIGN KEY (lead_id) REFERENCES agents(id) ON DELETE CASCADE;

ALTER TABLE campaign_responses DROP CONSTRAINT IF EXISTS campaign_responses_lead_id_fkey;
ALTER TABLE campaign_responses ADD CONSTRAINT campaign_responses_agent_id_fkey FOREIGN KEY (lead_id) REFERENCES agents(id) ON DELETE CASCADE;

ALTER TABLE ai_conversation_logs DROP CONSTRAINT IF EXISTS ai_conversation_logs_lead_id_fkey;
ALTER TABLE ai_conversation_logs ADD CONSTRAINT ai_conversation_logs_agent_id_fkey FOREIGN KEY (lead_id) REFERENCES agents(id) ON DELETE CASCADE;

ALTER TABLE lead_answers DROP CONSTRAINT IF EXISTS lead_answers_lead_id_fkey;
ALTER TABLE lead_answers ADD CONSTRAINT lead_answers_agent_id_fkey FOREIGN KEY (lead_id) REFERENCES agents(id) ON DELETE CASCADE;

ALTER TABLE custom_field_values DROP CONSTRAINT IF EXISTS custom_field_values_record_id_fkey;
-- Re-create this constraint if needed after verifying the relationship

-- Update triggers to reference agents table
DROP TRIGGER IF EXISTS parse_full_address_trigger ON agents;
CREATE TRIGGER parse_full_address_trigger
  BEFORE INSERT OR UPDATE OF full_address ON agents
  FOR EACH ROW
  EXECUTE FUNCTION parse_full_address();

-- Update merge function to reference agents table
CREATE OR REPLACE FUNCTION public.merge_agents(primary_agent_id uuid, duplicate_agent_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  primary_agent agents%ROWTYPE;
  duplicate_agent agents%ROWTYPE;
BEGIN
  SELECT * INTO primary_agent FROM agents WHERE id = primary_agent_id;
  SELECT * INTO duplicate_agent FROM agents WHERE id = duplicate_agent_id;
  
  IF primary_agent.id IS NULL OR duplicate_agent.id IS NULL THEN
    RAISE EXCEPTION 'One or both agent IDs not found';
  END IF;
  
  UPDATE agents SET
    email = COALESCE(primary_agent.email, duplicate_agent.email),
    first_name = COALESCE(primary_agent.first_name, duplicate_agent.first_name),
    last_name = COALESCE(primary_agent.last_name, duplicate_agent.last_name),
    brokerage = COALESCE(primary_agent.brokerage, duplicate_agent.brokerage),
    company = COALESCE(primary_agent.company, duplicate_agent.company),
    license_type = COALESCE(primary_agent.license_type, duplicate_agent.license_type),
    transactions = GREATEST(COALESCE(primary_agent.transactions, 0), COALESCE(duplicate_agent.transactions, 0)),
    experience = GREATEST(COALESCE(primary_agent.experience, 0), COALESCE(duplicate_agent.experience, 0)),
    motivation = GREATEST(COALESCE(primary_agent.motivation, 0), COALESCE(duplicate_agent.motivation, 0)),
    total_sales = GREATEST(COALESCE(primary_agent.total_sales, 0), COALESCE(duplicate_agent.total_sales, 0)),
    image_url = COALESCE(primary_agent.image_url, duplicate_agent.image_url),
    profile_url = COALESCE(primary_agent.profile_url, duplicate_agent.profile_url),
    linkedin_url = COALESCE(primary_agent.linkedin_url, duplicate_agent.linkedin_url),
    facebook_url = COALESCE(primary_agent.facebook_url, duplicate_agent.facebook_url),
    twitter_url = COALESCE(primary_agent.twitter_url, duplicate_agent.twitter_url),
    instagram_url = COALESCE(primary_agent.instagram_url, duplicate_agent.instagram_url),
    website_url = COALESCE(primary_agent.website_url, duplicate_agent.website_url),
    address = COALESCE(primary_agent.address, duplicate_agent.address),
    cities = COALESCE(primary_agent.cities, duplicate_agent.cities),
    states = COALESCE(primary_agent.states, duplicate_agent.states),
    counties = COALESCE(primary_agent.counties, duplicate_agent.counties),
    zip_codes = COALESCE(primary_agent.zip_codes, duplicate_agent.zip_codes),
    wants = COALESCE(primary_agent.wants, duplicate_agent.wants),
    skills = COALESCE(primary_agent.skills, duplicate_agent.skills),
    tags = ARRAY(SELECT DISTINCT unnest(COALESCE(primary_agent.tags, ARRAY[]::text[]) || COALESCE(duplicate_agent.tags, ARRAY[]::text[]))),
    notes = CASE 
      WHEN primary_agent.notes IS NOT NULL AND duplicate_agent.notes IS NOT NULL 
      THEN primary_agent.notes || E'\n--- Merged from duplicate ---\n' || duplicate_agent.notes
      ELSE COALESCE(primary_agent.notes, duplicate_agent.notes)
    END,
    source = CASE 
      WHEN primary_agent.source IS NOT NULL AND duplicate_agent.source IS NOT NULL AND primary_agent.source != duplicate_agent.source
      THEN primary_agent.source || ', ' || duplicate_agent.source
      ELSE COALESCE(primary_agent.source, duplicate_agent.source)
    END,
    qualification_score = GREATEST(COALESCE(primary_agent.qualification_score, 0), COALESCE(duplicate_agent.qualification_score, 0)),
    updated_at = now()
  WHERE id = primary_agent_id;
  
  UPDATE matches SET lead_id = primary_agent_id WHERE lead_id = duplicate_agent_id;
  UPDATE conversations SET lead_id = primary_agent_id WHERE lead_id = duplicate_agent_id;
  UPDATE campaign_assignments SET lead_id = primary_agent_id WHERE lead_id = duplicate_agent_id;
  UPDATE campaign_responses SET lead_id = primary_agent_id WHERE lead_id = duplicate_agent_id;
  UPDATE ai_conversation_logs SET lead_id = primary_agent_id WHERE lead_id = duplicate_agent_id;
  UPDATE lead_answers SET lead_id = primary_agent_id WHERE lead_id = duplicate_agent_id;
  UPDATE custom_field_values SET record_id = primary_agent_id WHERE record_id = duplicate_agent_id;
  
  DELETE FROM agents WHERE id = duplicate_agent_id;
END;
$function$;

-- Update find duplicate functions
CREATE OR REPLACE FUNCTION public.find_duplicate_agents_by_phone(phone_number text)
RETURNS TABLE(id uuid, full_name text, phone text, email text, created_at timestamp with time zone, source text)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT id, full_name, phone, email, created_at, source
  FROM agents
  WHERE phone = phone_number
  ORDER BY created_at ASC;
$function$;

CREATE OR REPLACE FUNCTION public.find_all_duplicate_agents()
RETURNS TABLE(phone text, duplicate_count bigint, agent_ids uuid[])
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT 
    phone,
    COUNT(*) as duplicate_count,
    ARRAY_AGG(id ORDER BY created_at ASC) as agent_ids
  FROM agents
  GROUP BY phone
  HAVING COUNT(*) > 1
  ORDER BY COUNT(*) DESC;
$function$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agents_email ON agents(email);
CREATE INDEX IF NOT EXISTS idx_agents_license_number ON agents(license_number);
CREATE INDEX IF NOT EXISTS idx_agents_source ON agents(source);
CREATE INDEX IF NOT EXISTS idx_agents_date_scraped ON agents(date_scraped);
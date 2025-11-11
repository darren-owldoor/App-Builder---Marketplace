-- Function to find duplicate leads by phone
CREATE OR REPLACE FUNCTION public.find_duplicate_leads_by_phone(phone_number text)
RETURNS TABLE (
  id uuid,
  full_name text,
  phone text,
  email text,
  created_at timestamp with time zone,
  source text
) 
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT id, full_name, phone, email, created_at, source
  FROM leads
  WHERE phone = phone_number
  ORDER BY created_at ASC;
$$;

-- Function to find all duplicate phone numbers
CREATE OR REPLACE FUNCTION public.find_all_duplicate_leads()
RETURNS TABLE (
  phone text,
  duplicate_count bigint,
  lead_ids uuid[]
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT 
    phone,
    COUNT(*) as duplicate_count,
    ARRAY_AGG(id ORDER BY created_at ASC) as lead_ids
  FROM leads
  GROUP BY phone
  HAVING COUNT(*) > 1
  ORDER BY COUNT(*) DESC;
$$;

-- Function to merge two leads (keeps primary_lead_id, merges data from duplicate_lead_id)
CREATE OR REPLACE FUNCTION public.merge_leads(
  primary_lead_id uuid,
  duplicate_lead_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  primary_lead leads%ROWTYPE;
  duplicate_lead leads%ROWTYPE;
BEGIN
  -- Get both lead records
  SELECT * INTO primary_lead FROM leads WHERE id = primary_lead_id;
  SELECT * INTO duplicate_lead FROM leads WHERE id = duplicate_lead_id;
  
  IF primary_lead.id IS NULL OR duplicate_lead.id IS NULL THEN
    RAISE EXCEPTION 'One or both lead IDs not found';
  END IF;
  
  -- Merge data: update primary lead with non-null values from duplicate
  UPDATE leads SET
    email = COALESCE(primary_lead.email, duplicate_lead.email),
    first_name = COALESCE(primary_lead.first_name, duplicate_lead.first_name),
    last_name = COALESCE(primary_lead.last_name, duplicate_lead.last_name),
    brokerage = COALESCE(primary_lead.brokerage, duplicate_lead.brokerage),
    company = COALESCE(primary_lead.company, duplicate_lead.company),
    license_type = COALESCE(primary_lead.license_type, duplicate_lead.license_type),
    transactions = GREATEST(COALESCE(primary_lead.transactions, 0), COALESCE(duplicate_lead.transactions, 0)),
    experience = GREATEST(COALESCE(primary_lead.experience, 0), COALESCE(duplicate_lead.experience, 0)),
    motivation = GREATEST(COALESCE(primary_lead.motivation, 0), COALESCE(duplicate_lead.motivation, 0)),
    total_sales = GREATEST(COALESCE(primary_lead.total_sales, 0), COALESCE(duplicate_lead.total_sales, 0)),
    image_url = COALESCE(primary_lead.image_url, duplicate_lead.image_url),
    profile_url = COALESCE(primary_lead.profile_url, duplicate_lead.profile_url),
    linkedin_url = COALESCE(primary_lead.linkedin_url, duplicate_lead.linkedin_url),
    facebook_url = COALESCE(primary_lead.facebook_url, duplicate_lead.facebook_url),
    twitter_url = COALESCE(primary_lead.twitter_url, duplicate_lead.twitter_url),
    instagram_url = COALESCE(primary_lead.instagram_url, duplicate_lead.instagram_url),
    website_url = COALESCE(primary_lead.website_url, duplicate_lead.website_url),
    address = COALESCE(primary_lead.address, duplicate_lead.address),
    cities = COALESCE(primary_lead.cities, duplicate_lead.cities),
    states = COALESCE(primary_lead.states, duplicate_lead.states),
    counties = COALESCE(primary_lead.counties, duplicate_lead.counties),
    zip_codes = COALESCE(primary_lead.zip_codes, duplicate_lead.zip_codes),
    wants = COALESCE(primary_lead.wants, duplicate_lead.wants),
    skills = COALESCE(primary_lead.skills, duplicate_lead.skills),
    tags = ARRAY(SELECT DISTINCT unnest(COALESCE(primary_lead.tags, ARRAY[]::text[]) || COALESCE(duplicate_lead.tags, ARRAY[]::text[]))),
    notes = CASE 
      WHEN primary_lead.notes IS NOT NULL AND duplicate_lead.notes IS NOT NULL 
      THEN primary_lead.notes || E'\n--- Merged from duplicate ---\n' || duplicate_lead.notes
      ELSE COALESCE(primary_lead.notes, duplicate_lead.notes)
    END,
    source = CASE 
      WHEN primary_lead.source IS NOT NULL AND duplicate_lead.source IS NOT NULL AND primary_lead.source != duplicate_lead.source
      THEN primary_lead.source || ', ' || duplicate_lead.source
      ELSE COALESCE(primary_lead.source, duplicate_lead.source)
    END,
    qualification_score = GREATEST(COALESCE(primary_lead.qualification_score, 0), COALESCE(duplicate_lead.qualification_score, 0)),
    updated_at = now()
  WHERE id = primary_lead_id;
  
  -- Update all foreign key references to point to primary lead
  UPDATE matches SET lead_id = primary_lead_id WHERE lead_id = duplicate_lead_id;
  UPDATE conversations SET lead_id = primary_lead_id WHERE lead_id = duplicate_lead_id;
  UPDATE campaign_assignments SET lead_id = primary_lead_id WHERE lead_id = duplicate_lead_id;
  UPDATE campaign_responses SET lead_id = primary_lead_id WHERE lead_id = duplicate_lead_id;
  UPDATE ai_conversation_logs SET lead_id = primary_lead_id WHERE lead_id = duplicate_lead_id;
  UPDATE lead_answers SET lead_id = primary_lead_id WHERE lead_id = duplicate_lead_id;
  UPDATE custom_field_values SET record_id = primary_lead_id WHERE record_id = duplicate_lead_id;
  
  -- Delete the duplicate lead
  DELETE FROM leads WHERE id = duplicate_lead_id;
  
END;
$$;
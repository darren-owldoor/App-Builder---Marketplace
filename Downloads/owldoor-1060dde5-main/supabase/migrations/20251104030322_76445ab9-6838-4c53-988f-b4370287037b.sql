-- Rename agents table to pros
ALTER TABLE public.agents RENAME TO pros;

-- Update foreign key columns to use pro_id instead of lead_id
ALTER TABLE public.matches RENAME COLUMN lead_id TO pro_id;
ALTER TABLE public.conversations RENAME COLUMN lead_id TO pro_id;
ALTER TABLE public.campaign_assignments RENAME COLUMN lead_id TO pro_id;
ALTER TABLE public.campaign_responses RENAME COLUMN lead_id TO pro_id;
ALTER TABLE public.ai_conversation_logs RENAME COLUMN lead_id TO pro_id;

-- Rename lead_type column to pro_type for clarity
ALTER TABLE public.pros RENAME COLUMN lead_type TO pro_type;

-- Update indexes
ALTER INDEX IF EXISTS idx_agents_phone RENAME TO idx_pros_phone;
ALTER INDEX IF EXISTS idx_agents_email RENAME TO idx_pros_email;
ALTER INDEX IF EXISTS idx_agents_pipeline_stage RENAME TO idx_pros_pipeline_stage;

-- Update function references from agents to pros
CREATE OR REPLACE FUNCTION public.find_duplicate_pros_by_phone(phone_number text)
RETURNS TABLE(id uuid, full_name text, phone text, email text, created_at timestamp with time zone, source text)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT id, full_name, phone, email, created_at, source
  FROM pros
  WHERE phone = phone_number
  ORDER BY created_at ASC;
$function$;

CREATE OR REPLACE FUNCTION public.find_all_duplicate_pros()
RETURNS TABLE(phone text, duplicate_count bigint, pro_ids uuid[])
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $function$
  SELECT 
    phone,
    COUNT(*) as duplicate_count,
    ARRAY_AGG(id ORDER BY created_at ASC) as pro_ids
  FROM pros
  GROUP BY phone
  HAVING COUNT(*) > 1
  ORDER BY COUNT(*) DESC;
$function$;

CREATE OR REPLACE FUNCTION public.merge_pros(primary_pro_id uuid, duplicate_pro_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  primary_pro pros%ROWTYPE;
  duplicate_pro pros%ROWTYPE;
BEGIN
  SELECT * INTO primary_pro FROM pros WHERE id = primary_pro_id;
  SELECT * INTO duplicate_pro FROM pros WHERE id = duplicate_pro_id;
  
  IF primary_pro.id IS NULL OR duplicate_pro.id IS NULL THEN
    RAISE EXCEPTION 'One or both pro IDs not found';
  END IF;
  
  UPDATE pros SET
    email = COALESCE(primary_pro.email, duplicate_pro.email),
    first_name = COALESCE(primary_pro.first_name, duplicate_pro.first_name),
    last_name = COALESCE(primary_pro.last_name, duplicate_pro.last_name),
    brokerage = COALESCE(primary_pro.brokerage, duplicate_pro.brokerage),
    company = COALESCE(primary_pro.company, duplicate_pro.company),
    license_type = COALESCE(primary_pro.license_type, duplicate_pro.license_type),
    transactions = GREATEST(COALESCE(primary_pro.transactions, 0), COALESCE(duplicate_pro.transactions, 0)),
    experience = GREATEST(COALESCE(primary_pro.experience, 0), COALESCE(duplicate_pro.experience, 0)),
    motivation = GREATEST(COALESCE(primary_pro.motivation, 0), COALESCE(duplicate_pro.motivation, 0)),
    total_sales = GREATEST(COALESCE(primary_pro.total_sales, 0), COALESCE(duplicate_pro.total_sales, 0)),
    updated_at = now()
  WHERE id = primary_pro_id;
  
  UPDATE matches SET pro_id = primary_pro_id WHERE pro_id = duplicate_pro_id;
  UPDATE conversations SET pro_id = primary_pro_id WHERE pro_id = duplicate_pro_id;
  UPDATE campaign_assignments SET pro_id = primary_pro_id WHERE pro_id = duplicate_pro_id;
  UPDATE campaign_responses SET pro_id = primary_pro_id WHERE pro_id = duplicate_pro_id;
  UPDATE ai_conversation_logs SET pro_id = primary_pro_id WHERE pro_id = duplicate_pro_id;
  
  DELETE FROM pros WHERE id = duplicate_pro_id;
END;
$function$;

-- Drop old agent functions
DROP FUNCTION IF EXISTS public.find_duplicate_agents_by_phone(text);
DROP FUNCTION IF EXISTS public.find_all_duplicate_agents();
DROP FUNCTION IF EXISTS public.merge_agents(uuid, uuid);
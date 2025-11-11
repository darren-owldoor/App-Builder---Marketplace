-- Fix 1: Add INSERT/UPDATE/DELETE policies for agent_unlocks table
CREATE POLICY "Service role can insert unlocks"
ON public.agent_unlocks FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "No updates allowed on unlocks"
ON public.agent_unlocks FOR UPDATE
USING (false);

CREATE POLICY "Admins can delete unlocks"
ON public.agent_unlocks FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Fix 2: Restrict pricing data visibility to authenticated users only
DROP POLICY IF EXISTS "Anyone can view pricing config" ON public.pricing_config;

CREATE POLICY "Authenticated users can view pricing"
ON public.pricing_config FOR SELECT
USING (auth.uid() IS NOT NULL AND active = true);

DROP POLICY IF EXISTS "Service role can read discount codes" ON public.discount_codes;

CREATE POLICY "Authenticated users can validate discount codes"
ON public.discount_codes FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Fix 3: Add search_path to all vulnerable functions
CREATE OR REPLACE FUNCTION public.calculate_coverage_quality_score(coverage_id uuid)
RETURNS TABLE(total_score integer, completeness integer, breadth integer, demand_overlap integer, details jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  coverage_record RECORD;
  v_completeness_score INTEGER := 30;
  v_breadth_score INTEGER := 0;
  v_demand_score INTEGER := 10;
  v_total_score INTEGER := 0;
  v_zip_count INTEGER := 0;
  v_city_count INTEGER := 0;
  v_state_count INTEGER := 0;
  v_county_count INTEGER := 0;
  v_coord_count INTEGER := 0;
  v_details JSONB;
  v_total_pros_in_area INTEGER := 0;
BEGIN
  SELECT * INTO coverage_record FROM market_coverage WHERE id = coverage_id;
  
  IF NOT FOUND THEN RAISE EXCEPTION 'Coverage area not found'; END IF;
  
  v_zip_count := COALESCE(jsonb_array_length(coverage_record.data->'zipCodes'), 0);
  v_city_count := COALESCE(jsonb_array_length(coverage_record.data->'cities'), 0);
  v_state_count := COALESCE(jsonb_array_length(coverage_record.data->'states'), 0);
  v_county_count := COALESCE(jsonb_array_length(coverage_record.data->'counties'), 0);
  v_coord_count := COALESCE(jsonb_array_length(coverage_record.data->'coordinates'), 0);
  
  IF v_zip_count > 0 THEN v_completeness_score := v_completeness_score + 4; END IF;
  IF v_city_count > 0 THEN v_completeness_score := v_completeness_score + 2; END IF;
  IF v_state_count > 0 THEN v_completeness_score := v_completeness_score + 1; END IF;
  IF v_county_count > 0 THEN v_completeness_score := v_completeness_score + 2; END IF;
  IF v_coord_count > 0 THEN v_completeness_score := v_completeness_score + 1; END IF;
  v_completeness_score := LEAST(v_completeness_score, 40);
  
  IF v_zip_count >= 50 THEN v_breadth_score := 35;
  ELSIF v_zip_count >= 30 THEN v_breadth_score := 28;
  ELSIF v_zip_count >= 15 THEN v_breadth_score := 21;
  ELSIF v_zip_count >= 5 THEN v_breadth_score := 14;
  ELSIF v_zip_count >= 1 THEN v_breadth_score := 7;
  END IF;
  
  IF v_city_count >= 5 THEN v_breadth_score := v_breadth_score + 5; END IF;
  IF v_county_count >= 3 THEN v_breadth_score := v_breadth_score + 3; END IF;
  v_breadth_score := LEAST(v_breadth_score, 35);
  
  IF v_zip_count > 0 THEN
    SELECT COUNT(DISTINCT p.id) INTO v_total_pros_in_area
    FROM pros p
    WHERE p.zip_codes && (SELECT array_agg(elem::text) FROM jsonb_array_elements_text(coverage_record.data->'zipCodes') elem);
    
    IF v_total_pros_in_area >= 100 THEN v_demand_score := 25;
    ELSIF v_total_pros_in_area >= 50 THEN v_demand_score := 20;
    ELSIF v_total_pros_in_area >= 25 THEN v_demand_score := 15;
    ELSIF v_total_pros_in_area >= 10 THEN v_demand_score := 12;
    ELSIF v_total_pros_in_area >= 1 THEN v_demand_score := 10;
    END IF;
  END IF;
  
  v_total_score := v_completeness_score + v_breadth_score + v_demand_score;
  
  v_details := jsonb_build_object(
    'zipCodeCount', v_zip_count, 'cityCount', v_city_count, 'stateCount', v_state_count,
    'countyCount', v_county_count, 'coordinateCount', v_coord_count, 'teamsInArea', v_total_pros_in_area,
    'completenessBreakdown', jsonb_build_object(
      'hasZips', v_zip_count > 0, 'hasCities', v_city_count > 0, 'hasStates', v_state_count > 0,
      'hasCounties', v_county_count > 0, 'hasCoordinates', v_coord_count > 0
    ),
    'competitionLevel', CASE
      WHEN v_total_score >= 80 THEN 'excellent'
      WHEN v_total_score >= 60 THEN 'good'
      WHEN v_total_score >= 40 THEN 'fair'
      ELSE 'needs_improvement'
    END
  );
  
  RETURN QUERY SELECT v_total_score, v_completeness_score, v_breadth_score, v_demand_score, v_details;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_pricing_tier(p_transactions integer, p_experience integer, p_qualification_score integer)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF p_transactions >= 30 AND p_experience >= 10 AND p_qualification_score >= 80 THEN
    RETURN 'premium';
  ELSIF p_transactions >= 15 AND p_experience >= 5 AND p_qualification_score >= 60 THEN
    RETURN 'qualified';
  ELSE
    RETURN 'basic';
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.are_types_compatible(p_pro_type character varying, p_client_type character varying)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN (
    (p_pro_type = 'real_estate_agent' AND p_client_type = 'real_estate') OR
    (p_pro_type = 'mortgage_officer' AND p_client_type = 'mortgage')
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_bid_match_score(bid_coverage jsonb, pro_coverage jsonb, bid_criteria jsonb, pro_data jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  overlap_score INTEGER := 0;
  criteria_score INTEGER := 0;
  total_score INTEGER := 0;
BEGIN
  overlap_score := overlap_score + (
    SELECT COUNT(*)
    FROM jsonb_array_elements(pro_coverage) AS pro_area
    CROSS JOIN jsonb_array_elements(bid_coverage) AS bid_area
    WHERE pro_area->>'type' = 'zip' AND bid_area->>'type' = 'zip'
    AND pro_area->>'name' = bid_area->>'name'
  ) * 5;
  
  overlap_score := overlap_score + (
    SELECT COUNT(*)
    FROM jsonb_array_elements(pro_coverage) AS pro_area
    CROSS JOIN jsonb_array_elements(bid_coverage) AS bid_area
    WHERE pro_area->>'type' = 'city' AND bid_area->>'type' = 'city'
    AND pro_area->>'name' = bid_area->>'name'
  ) * 8;
  
  overlap_score := overlap_score + (
    SELECT COUNT(*) * 10
    FROM jsonb_array_elements(pro_coverage) AS pro_area
    CROSS JOIN jsonb_array_elements(bid_coverage) AS bid_area
    WHERE pro_area->>'type' = 'radius' AND bid_area->>'type' = 'radius'
    AND (
      ABS((pro_area->'data'->'center'->>'lat')::float - (bid_area->'data'->'center'->>'lat')::float) < 1
      AND ABS((pro_area->'data'->'center'->>'lng')::float - (bid_area->'data'->'center'->>'lng')::float) < 1
    )
  );
  
  overlap_score := LEAST(overlap_score, 40);
  
  IF bid_criteria->>'minExperience' IS NOT NULL THEN
    IF (pro_data->>'experience')::integer >= (bid_criteria->>'minExperience')::integer THEN
      criteria_score := criteria_score + 20;
    END IF;
  ELSE
    criteria_score := criteria_score + 20;
  END IF;
  
  IF bid_criteria->>'minTransactions' IS NOT NULL THEN
    IF (pro_data->>'transactions')::integer >= (bid_criteria->>'minTransactions')::integer THEN
      criteria_score := criteria_score + 20;
    END IF;
  ELSE
    criteria_score := criteria_score + 20;
  END IF;
  
  IF pro_data->>'qualification_score' IS NOT NULL THEN
    criteria_score := criteria_score + LEAST((pro_data->>'qualification_score')::integer / 5, 20);
  END IF;
  
  total_score := overlap_score + criteria_score;
  
  RETURN LEAST(total_score, 100);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_profile_completeness()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.profile_completeness := calculate_profile_completeness(NEW.id);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.parse_full_address()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  address_parts text[];
  last_part text;
  extracted_state text;
  extracted_zip text;
  extracted_city text;
BEGIN
  IF NEW.full_address IS NOT NULL AND trim(NEW.full_address) != '' THEN
    address_parts := string_to_array(NEW.full_address, ',');
    
    IF array_length(address_parts, 1) >= 2 THEN
      last_part := trim(address_parts[array_length(address_parts, 1)]);
      
      IF last_part ~ '^[A-Z]{2}\s+\d{5}(-\d{4})?$' THEN
        extracted_state := substring(last_part from '^([A-Z]{2})');
        extracted_zip := substring(last_part from '\d{5}(-\d{4})?$');
        
        IF array_length(address_parts, 1) >= 2 THEN
          extracted_city := trim(address_parts[array_length(address_parts, 1) - 1]);
        END IF;
      END IF;
      
      IF extracted_city IS NOT NULL AND extracted_city != '' THEN
        NEW.cities := ARRAY[extracted_city];
      END IF;
      
      IF extracted_state IS NOT NULL AND extracted_state != '' THEN
        NEW.states := ARRAY[extracted_state];
      END IF;
      
      IF extracted_zip IS NOT NULL AND extracted_zip != '' THEN
        NEW.zip_codes := ARRAY[extracted_zip];
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix 4: Create admin alert system for rate limit violations
CREATE TABLE IF NOT EXISTS public.rate_limit_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  endpoint text NOT NULL,
  attempts_blocked integer NOT NULL DEFAULT 1,
  first_blocked_at timestamptz NOT NULL DEFAULT now(),
  last_blocked_at timestamptz NOT NULL DEFAULT now(),
  alert_sent boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rate_limit_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view rate limit alerts"
ON public.rate_limit_alerts FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can manage alerts"
ON public.rate_limit_alerts FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Trigger to send alerts when rate limits are hit
CREATE OR REPLACE FUNCTION public.notify_admin_on_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Insert or update alert record
  INSERT INTO public.rate_limit_alerts (identifier, endpoint, attempts_blocked, first_blocked_at, last_blocked_at)
  VALUES (NEW.identifier, NEW.endpoint, 1, now(), now())
  ON CONFLICT (identifier, endpoint) 
  DO UPDATE SET 
    attempts_blocked = rate_limit_alerts.attempts_blocked + 1,
    last_blocked_at = now(),
    alert_sent = false;
  
  RETURN NEW;
END;
$function$;

-- Add unique constraint for alerts
ALTER TABLE public.rate_limit_alerts ADD CONSTRAINT rate_limit_alerts_identifier_endpoint_key UNIQUE (identifier, endpoint);

DROP TRIGGER IF EXISTS on_rate_limit_exceeded ON public.rate_limits;
CREATE TRIGGER on_rate_limit_exceeded
  AFTER INSERT ON public.rate_limits
  FOR EACH ROW
  WHEN (NEW.attempt_count >= 90) -- Alert when 90% of limit reached
  EXECUTE FUNCTION public.notify_admin_on_rate_limit();
-- Drop and recreate the calculate_profile_completeness function with correct field names
DROP FUNCTION IF EXISTS calculate_profile_completeness(uuid);

CREATE OR REPLACE FUNCTION calculate_profile_completeness(p_pro_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_record RECORD;
  v_completeness INTEGER := 0;
  v_field_count INTEGER := 15;
BEGIN
  SELECT * INTO v_record FROM pros WHERE id = p_pro_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Check each important field (using cities array, not city)
  IF v_record.full_name IS NOT NULL AND LENGTH(v_record.full_name) > 0 THEN
    v_completeness := v_completeness + 1;
  END IF;
  
  IF v_record.email IS NOT NULL AND LENGTH(v_record.email) > 0 THEN
    v_completeness := v_completeness + 1;
  END IF;
  
  IF v_record.phone IS NOT NULL AND LENGTH(v_record.phone) > 0 THEN
    v_completeness := v_completeness + 1;
  END IF;
  
  IF v_record.cities IS NOT NULL AND array_length(v_record.cities, 1) > 0 THEN
    v_completeness := v_completeness + 1;
  END IF;
  
  IF v_record.states IS NOT NULL AND array_length(v_record.states, 1) > 0 THEN
    v_completeness := v_completeness + 1;
  END IF;
  
  IF v_record.brokerage IS NOT NULL AND LENGTH(v_record.brokerage) > 0 THEN
    v_completeness := v_completeness + 1;
  END IF;
  
  IF v_record.years_experience IS NOT NULL THEN
    v_completeness := v_completeness + 1;
  END IF;
  
  IF v_record.transactions IS NOT NULL THEN
    v_completeness := v_completeness + 1;
  END IF;
  
  IF v_record.skills IS NOT NULL AND array_length(v_record.skills, 1) > 0 THEN
    v_completeness := v_completeness + 1;
  END IF;
  
  IF v_record.wants IS NOT NULL AND array_length(v_record.wants, 1) > 0 THEN
    v_completeness := v_completeness + 1;
  END IF;
  
  IF v_record.image_url IS NOT NULL AND LENGTH(v_record.image_url) > 0 THEN
    v_completeness := v_completeness + 1;
  END IF;
  
  IF v_record.linkedin_url IS NOT NULL AND LENGTH(v_record.linkedin_url) > 0 THEN
    v_completeness := v_completeness + 1;
  END IF;
  
  IF v_record.facebook_url IS NOT NULL AND LENGTH(v_record.facebook_url) > 0 THEN
    v_completeness := v_completeness + 1;
  END IF;
  
  IF v_record.license_type IS NOT NULL AND LENGTH(v_record.license_type) > 0 THEN
    v_completeness := v_completeness + 1;
  END IF;
  
  IF v_record.total_sales IS NOT NULL THEN
    v_completeness := v_completeness + 1;
  END IF;
  
  -- Calculate percentage
  RETURN ROUND((v_completeness::NUMERIC / v_field_count) * 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
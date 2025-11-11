-- ============================================
-- MIGRATION: Add Pro/Client Types + Directory Tracking
-- Purpose: Support both RE Agents & Mortgage Officers
-- ============================================

BEGIN;

-- ============================================
-- STEP 1: ADD TYPE FIELDS
-- ============================================

-- Add pro_type to pros table
ALTER TABLE pros 
  ADD COLUMN IF NOT EXISTS pro_type VARCHAR(50) DEFAULT 'real_estate_agent';

-- Add client_type to clients table
ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS client_type VARCHAR(50) DEFAULT 'real_estate';

-- Create indexes for type filtering
CREATE INDEX IF NOT EXISTS idx_pros_type ON pros(pro_type);
CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(client_type);
CREATE INDEX IF NOT EXISTS idx_pros_type_stage ON pros(pro_type, pipeline_stage);

-- ============================================
-- STEP 2: ADD DIRECTORY/RECRUITMENT FIELDS
-- ============================================

ALTER TABLE pros ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN DEFAULT false;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS open_to_company_offers BOOLEAN;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS interested_in_opportunities BOOLEAN DEFAULT false;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS best_time_to_contact VARCHAR(50);
ALTER TABLE pros ADD COLUMN IF NOT EXISTS preferred_contact_method VARCHAR(50);
ALTER TABLE pros ADD COLUMN IF NOT EXISTS original_status VARCHAR(50) DEFAULT 'new';
ALTER TABLE pros ADD COLUMN IF NOT EXISTS became_lead_at TIMESTAMP;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS last_form_submission_at TIMESTAMP;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS form_submission_count INT DEFAULT 0;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS lead_source VARCHAR(100);
ALTER TABLE pros ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100);
ALTER TABLE pros ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100);
ALTER TABLE pros ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100);
ALTER TABLE pros ADD COLUMN IF NOT EXISTS engagement_score INT DEFAULT 0;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMP;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS last_responded_at TIMESTAMP;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS contact_attempts INT DEFAULT 0;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS response_rate NUMERIC(5,2);
ALTER TABLE pros ADD COLUMN IF NOT EXISTS ip_address VARCHAR(50);
ALTER TABLE pros ADD COLUMN IF NOT EXISTS signup_ip VARCHAR(50);
ALTER TABLE pros ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS referrer_url TEXT;

-- ============================================
-- STEP 3: ADD MORTGAGE OFFICER FIELDS
-- ============================================

ALTER TABLE pros ADD COLUMN IF NOT EXISTS nmls_id VARCHAR(50);
ALTER TABLE pros ADD COLUMN IF NOT EXISTS nmls_verified BOOLEAN DEFAULT false;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS nmls_verified_at TIMESTAMP;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS license_states JSONB;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS state_licenses JSONB;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS loan_types_specialized JSONB;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS loan_purposes JSONB;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS client_types_served JSONB;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS purchase_percentage INT;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS refinance_percentage INT;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS avg_close_time_days INT;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS on_time_close_rate NUMERIC(5,2);
ALTER TABLE pros ADD COLUMN IF NOT EXISTS monthly_loan_volume NUMERIC(15,2);
ALTER TABLE pros ADD COLUMN IF NOT EXISTS annual_loan_volume NUMERIC(15,2);
ALTER TABLE pros ADD COLUMN IF NOT EXISTS avg_loan_size NUMERIC(15,2);
ALTER TABLE pros ADD COLUMN IF NOT EXISTS loans_closed_12mo INT;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS provides_leads_to_agents BOOLEAN DEFAULT false;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS co_marketing_available BOOLEAN DEFAULT false;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS partnership_fee_structure VARCHAR(200);
ALTER TABLE pros ADD COLUMN IF NOT EXISTS accepts_agent_partnerships BOOLEAN DEFAULT true;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS max_loans_per_month INT;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS accepting_new_partners BOOLEAN DEFAULT true;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS lender_name VARCHAR(200);
ALTER TABLE pros ADD COLUMN IF NOT EXISTS lender_company_nmls VARCHAR(50);

-- ============================================
-- STEP 4: ADD REAL ESTATE AGENT FIELDS
-- ============================================

ALTER TABLE pros ADD COLUMN IF NOT EXISTS total_volume_12mo NUMERIC(15,2);
ALTER TABLE pros ADD COLUMN IF NOT EXISTS transactions_12mo INT;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS avg_sale_price NUMERIC(15,2);
ALTER TABLE pros ADD COLUMN IF NOT EXISTS price_range_min NUMERIC(15,2);
ALTER TABLE pros ADD COLUMN IF NOT EXISTS price_range_max NUMERIC(15,2);
ALTER TABLE pros ADD COLUMN IF NOT EXISTS buyer_percentage INT;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS seller_percentage INT;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS specializations JSONB;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS property_types JSONB;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS designations JSONB;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS primary_neighborhoods JSONB;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS farm_areas JSONB;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS service_radius_miles INT;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS has_photo BOOLEAN DEFAULT false;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS has_bio BOOLEAN DEFAULT false;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS profile_completeness INT DEFAULT 0;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS last_sale_date DATE;

-- ============================================
-- STEP 5: ADD INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_pros_claimed ON pros(is_claimed) WHERE is_claimed = false;
CREATE INDEX IF NOT EXISTS idx_pros_open_to_offers ON pros(open_to_company_offers) WHERE open_to_company_offers = true;
CREATE INDEX IF NOT EXISTS idx_pros_lead_source ON pros(lead_source);
CREATE INDEX IF NOT EXISTS idx_pros_became_lead ON pros(became_lead_at) WHERE became_lead_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pros_nmls ON pros(nmls_id) WHERE nmls_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pros_purchase_pct ON pros(purchase_percentage) WHERE pro_type = 'mortgage_officer';
CREATE INDEX IF NOT EXISTS idx_pros_close_time ON pros(avg_close_time_days) WHERE pro_type = 'mortgage_officer';
CREATE INDEX IF NOT EXISTS idx_pros_licensed_states ON pros USING GIN(state_licenses) WHERE pro_type = 'mortgage_officer';
CREATE INDEX IF NOT EXISTS idx_pros_volume ON pros(total_volume_12mo) WHERE pro_type = 'real_estate_agent';
CREATE INDEX IF NOT EXISTS idx_pros_transactions ON pros(transactions_12mo) WHERE pro_type = 'real_estate_agent';
CREATE INDEX IF NOT EXISTS idx_pros_specializations ON pros USING GIN(specializations) WHERE pro_type = 'real_estate_agent';

-- ============================================
-- STEP 6: ADD MATCH_TYPE TO MATCHES TABLE
-- ============================================

ALTER TABLE matches 
  ADD COLUMN IF NOT EXISTS match_type VARCHAR(50) DEFAULT 'lead_purchase';

CREATE INDEX IF NOT EXISTS idx_matches_type ON matches(match_type);
CREATE INDEX IF NOT EXISTS idx_matches_pro_client_type ON matches(pro_id, client_id, match_type);

-- ============================================
-- STEP 7: ADD CONSTRAINTS
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_pro_type') THEN
    ALTER TABLE pros ADD CONSTRAINT valid_pro_type CHECK (pro_type IN ('real_estate_agent', 'mortgage_officer'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_client_type') THEN
    ALTER TABLE clients ADD CONSTRAINT valid_client_type CHECK (client_type IN ('real_estate', 'mortgage'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_refi_total') THEN
    ALTER TABLE pros ADD CONSTRAINT purchase_refi_total CHECK (
      purchase_percentage IS NULL 
      OR refinance_percentage IS NULL 
      OR (purchase_percentage + refinance_percentage = 100)
    );
  END IF;
END $$;

-- ============================================
-- STEP 8: UPDATE EXISTING DATA
-- ============================================

UPDATE pros SET pro_type = 'real_estate_agent' WHERE pro_type IS NULL;
UPDATE clients SET client_type = 'real_estate' WHERE client_type IS NULL;
UPDATE pros SET original_status = pipeline_stage WHERE original_status IS NULL OR original_status = 'new';
UPDATE pros SET is_claimed = true, open_to_company_offers = true WHERE pipeline_stage NOT IN ('directory', 'new');

-- ============================================
-- STEP 9: CREATE HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION are_types_compatible(p_pro_type VARCHAR, p_client_type VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    (p_pro_type = 'real_estate_agent' AND p_client_type = 'real_estate') OR
    (p_pro_type = 'mortgage_officer' AND p_client_type = 'mortgage')
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION calculate_profile_completeness(p_pro_id UUID)
RETURNS INT AS $$
DECLARE
  v_completeness INT := 0;
  v_pro_type VARCHAR;
  v_record RECORD;
BEGIN
  SELECT * INTO v_record FROM pros WHERE id = p_pro_id;
  v_pro_type := v_record.pro_type;
  
  IF v_record.first_name IS NOT NULL THEN v_completeness := v_completeness + 5; END IF;
  IF v_record.last_name IS NOT NULL THEN v_completeness := v_completeness + 5; END IF;
  IF v_record.email IS NOT NULL THEN v_completeness := v_completeness + 5; END IF;
  IF v_record.phone IS NOT NULL THEN v_completeness := v_completeness + 5; END IF;
  IF v_record.city IS NOT NULL THEN v_completeness := v_completeness + 5; END IF;
  IF v_record.state IS NOT NULL THEN v_completeness := v_completeness + 5; END IF;
  IF v_record.has_photo THEN v_completeness := v_completeness + 10; END IF;
  IF v_record.has_bio THEN v_completeness := v_completeness + 10; END IF;
  
  IF v_pro_type = 'real_estate_agent' THEN
    IF v_record.experience IS NOT NULL THEN v_completeness := v_completeness + 10; END IF;
    IF v_record.transactions IS NOT NULL THEN v_completeness := v_completeness + 10; END IF;
    IF v_record.total_volume_12mo IS NOT NULL THEN v_completeness := v_completeness + 10; END IF;
    IF v_record.specializations IS NOT NULL THEN v_completeness := v_completeness + 10; END IF;
    IF v_record.wants IS NOT NULL THEN v_completeness := v_completeness + 10; END IF;
  ELSE
    IF v_record.nmls_id IS NOT NULL THEN v_completeness := v_completeness + 15; END IF;
    IF v_record.loan_types_specialized IS NOT NULL THEN v_completeness := v_completeness + 10; END IF;
    IF v_record.avg_close_time_days IS NOT NULL THEN v_completeness := v_completeness + 10; END IF;
    IF v_record.purchase_percentage IS NOT NULL THEN v_completeness := v_completeness + 10; END IF;
    IF v_record.state_licenses IS NOT NULL THEN v_completeness := v_completeness + 5; END IF;
  END IF;
  
  RETURN LEAST(v_completeness, 100);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION convert_directory_to_lead(p_pro_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE pros SET
    pipeline_stage = CASE WHEN pipeline_stage = 'directory' THEN 'new' ELSE pipeline_stage END,
    open_to_company_offers = true,
    interested_in_opportunities = true,
    became_lead_at = COALESCE(became_lead_at, NOW()),
    form_submission_count = form_submission_count + 1,
    last_form_submission_at = NOW(),
    engagement_score = LEAST(engagement_score + 20, 100),
    original_status = COALESCE(original_status, pipeline_stage)
  WHERE id = p_pro_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 10: CREATE TRIGGER FOR AUTO-COMPLETENESS
-- ============================================

CREATE OR REPLACE FUNCTION update_profile_completeness()
RETURNS TRIGGER AS $$
BEGIN
  NEW.profile_completeness := calculate_profile_completeness(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_completeness_on_update ON pros;
CREATE TRIGGER calculate_completeness_on_update
  BEFORE UPDATE ON pros
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_completeness();

-- ============================================
-- STEP 11: ADD COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN pros.pro_type IS 'Type of professional: real_estate_agent or mortgage_officer';
COMMENT ON COLUMN pros.is_claimed IS 'Has the professional claimed their directory profile?';
COMMENT ON COLUMN pros.open_to_company_offers IS 'NULL = unknown, TRUE = yes to offers, FALSE = not interested';
COMMENT ON COLUMN pros.original_status IS 'Original pipeline_stage when record was created';
COMMENT ON COLUMN pros.became_lead_at IS 'When directory profile converted to recruiting lead';
COMMENT ON COLUMN pros.nmls_id IS 'Required for mortgage officers - Nationwide Multistate Licensing System ID';
COMMENT ON COLUMN pros.purchase_percentage IS 'Percentage of business that is purchases (vs refinances)';
COMMENT ON COLUMN clients.client_type IS 'Type of client: real_estate (brokerage) or mortgage (lender)';

COMMIT;
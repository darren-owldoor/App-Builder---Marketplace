-- Create field_definitions table to manage all system fields
CREATE TABLE IF NOT EXISTS public.field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  field_type TEXT NOT NULL, -- text, number, array, boolean, date, etc.
  entity_types TEXT[] NOT NULL DEFAULT '{}', -- real_estate_agent, mortgage_officer, client_real_estate, client_mortgage
  visible_in TEXT[] NOT NULL DEFAULT '{}', -- profile, pro_dashboard, client_dashboard, admin_dashboard, matching
  is_required BOOLEAN DEFAULT false,
  matching_weight INTEGER DEFAULT 0, -- 0-100, how important for matching
  validation_rules JSONB DEFAULT '{}', -- min, max, pattern, etc.
  default_value TEXT,
  field_group TEXT, -- personal, business, location, performance, preferences
  sort_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(field_name)
);

-- Enable RLS
ALTER TABLE public.field_definitions ENABLE ROW LEVEL SECURITY;

-- Admin can manage all field definitions
CREATE POLICY "Admins can manage field definitions"
  ON public.field_definitions
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Staff can view field definitions
CREATE POLICY "Staff can view field definitions"
  ON public.field_definitions
  FOR SELECT
  USING (has_role(auth.uid(), 'staff'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_field_definitions_updated_at
  BEFORE UPDATE ON public.field_definitions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert common field definitions
INSERT INTO public.field_definitions (field_name, display_name, description, field_type, entity_types, visible_in, field_group, sort_order, matching_weight) VALUES
-- Personal Info
('full_name', 'Full Name', 'Complete name of the person', 'text', ARRAY['real_estate_agent', 'mortgage_officer'], ARRAY['profile', 'admin_dashboard'], 'personal', 1, 0),
('first_name', 'First Name', 'First name', 'text', ARRAY['real_estate_agent', 'mortgage_officer'], ARRAY['profile', 'admin_dashboard'], 'personal', 2, 0),
('last_name', 'Last Name', 'Last name', 'text', ARRAY['real_estate_agent', 'mortgage_officer'], ARRAY['profile', 'admin_dashboard'], 'personal', 3, 0),
('email', 'Email', 'Email address', 'text', ARRAY['real_estate_agent', 'mortgage_officer', 'client_real_estate', 'client_mortgage'], ARRAY['profile', 'admin_dashboard'], 'personal', 4, 0),
('phone', 'Phone', 'Phone number', 'text', ARRAY['real_estate_agent', 'mortgage_officer', 'client_real_estate', 'client_mortgage'], ARRAY['profile', 'admin_dashboard'], 'personal', 5, 0),

-- Location
('cities', 'Cities', 'Cities covered or worked in', 'array', ARRAY['real_estate_agent', 'mortgage_officer', 'client_real_estate', 'client_mortgage'], ARRAY['profile', 'admin_dashboard', 'matching'], 'location', 10, 40),
('states', 'States', 'States covered or worked in', 'array', ARRAY['real_estate_agent', 'mortgage_officer', 'client_real_estate', 'client_mortgage'], ARRAY['profile', 'admin_dashboard', 'matching'], 'location', 11, 35),
('zip_codes', 'ZIP Codes', 'ZIP codes covered', 'array', ARRAY['real_estate_agent', 'mortgage_officer', 'client_real_estate', 'client_mortgage'], ARRAY['profile', 'admin_dashboard', 'matching'], 'location', 12, 40),
('county', 'County', 'County location', 'text', ARRAY['real_estate_agent', 'mortgage_officer', 'client_real_estate'], ARRAY['profile', 'admin_dashboard'], 'location', 13, 10),

-- Business Info
('brokerage', 'Brokerage', 'Brokerage or company name', 'text', ARRAY['real_estate_agent', 'client_real_estate'], ARRAY['profile', 'admin_dashboard'], 'business', 20, 5),
('company', 'Company', 'Company name', 'text', ARRAY['real_estate_agent', 'mortgage_officer'], ARRAY['profile', 'admin_dashboard'], 'business', 21, 5),
('company_name', 'Company Name', 'Official company name', 'text', ARRAY['client_real_estate', 'client_mortgage'], ARRAY['profile', 'client_dashboard', 'admin_dashboard'], 'business', 22, 0),
('license_type', 'License Type', 'Type of license held', 'text', ARRAY['real_estate_agent', 'mortgage_officer', 'client_real_estate', 'client_mortgage'], ARRAY['profile', 'admin_dashboard'], 'business', 23, 10),

-- Performance
('years_experience', 'Years Experience', 'Years of experience in the field', 'number', ARRAY['real_estate_agent', 'mortgage_officer', 'client_real_estate'], ARRAY['profile', 'pro_dashboard', 'admin_dashboard', 'matching'], 'performance', 30, 20),
('transactions', 'Transactions', 'Number of transactions completed', 'number', ARRAY['real_estate_agent', 'mortgage_officer'], ARRAY['profile', 'pro_dashboard', 'admin_dashboard', 'matching'], 'performance', 31, 15),
('total_sales', 'Total Sales', 'Total sales volume', 'number', ARRAY['real_estate_agent'], ARRAY['profile', 'pro_dashboard', 'admin_dashboard'], 'performance', 32, 10),
('yearly_sales', 'Yearly Sales', 'Annual sales volume', 'number', ARRAY['real_estate_agent', 'client_real_estate'], ARRAY['profile', 'admin_dashboard'], 'performance', 33, 10),
('avg_sale', 'Average Sale', 'Average sale price', 'number', ARRAY['real_estate_agent', 'client_real_estate'], ARRAY['profile', 'admin_dashboard'], 'performance', 34, 5),

-- Preferences & Motivation
('wants', 'What They Want', 'What they are looking for', 'array', ARRAY['real_estate_agent', 'mortgage_officer'], ARRAY['profile', 'pro_dashboard', 'admin_dashboard', 'matching'], 'preferences', 40, 30),
('provides', 'What We Provide', 'What the company/team provides', 'array', ARRAY['client_real_estate', 'client_mortgage'], ARRAY['profile', 'client_dashboard', 'admin_dashboard', 'matching'], 'preferences', 41, 30),
('needs', 'Needs', 'Specific needs or requirements', 'text', ARRAY['client_real_estate', 'client_mortgage'], ARRAY['profile', 'client_dashboard', 'admin_dashboard', 'matching'], 'preferences', 42, 20),
('motivation', 'Motivation Level', 'Motivation score (1-10)', 'number', ARRAY['real_estate_agent', 'mortgage_officer'], ARRAY['pro_dashboard', 'admin_dashboard', 'matching'], 'preferences', 43, 25),

-- Skills
('skills', 'Skills', 'Professional skills and specializations', 'array', ARRAY['real_estate_agent', 'mortgage_officer', 'client_real_estate'], ARRAY['profile', 'admin_dashboard', 'matching'], 'skills', 50, 20),
('languages', 'Languages', 'Languages spoken', 'array', ARRAY['real_estate_agent', 'mortgage_officer', 'client_real_estate'], ARRAY['profile', 'admin_dashboard'], 'skills', 51, 5),
('designations', 'Designations', 'Professional designations', 'array', ARRAY['real_estate_agent', 'client_real_estate'], ARRAY['profile', 'admin_dashboard'], 'skills', 52, 10)
ON CONFLICT (field_name) DO NOTHING;
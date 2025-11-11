-- Create pricing configuration table
CREATE TABLE IF NOT EXISTS public.pricing_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_type text NOT NULL, -- 'base', 'motivation', 'transactions', 'time_discount'
  tier_name text NOT NULL,
  min_value integer,
  max_value integer,
  price_modifier numeric NOT NULL DEFAULT 0,
  modifier_type text NOT NULL DEFAULT 'add', -- 'add', 'multiply', 'override'
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create discount codes table
CREATE TABLE IF NOT EXISTS public.discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL DEFAULT 'percentage', -- 'percentage', 'fixed'
  discount_value numeric NOT NULL,
  max_uses integer,
  current_uses integer DEFAULT 0,
  expires_at timestamp with time zone,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create admin pricing overrides table
CREATE TABLE IF NOT EXISTS public.admin_pricing_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id),
  pro_type text,
  flat_price numeric NOT NULL,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Insert base pricing configuration
INSERT INTO public.pricing_config (config_type, tier_name, min_value, max_value, price_modifier) VALUES
  -- Base price
  ('base', 'Minimum Recruit', NULL, NULL, 100),
  
  -- Motivation add-ons (not compounding)
  ('motivation', 'Medium Motivation', 5, 7, 25),
  ('motivation', 'High Motivation', 7, 9, 50),
  ('motivation', 'Highest Motivation', 10, 10, 75),
  
  -- Transaction add-ons
  ('transactions', '1-2 Transactions', 1, 2, 25),
  ('transactions', '3-5 Transactions', 3, 5, 50),
  ('transactions', '5-10 Transactions', 5, 10, 75),
  ('transactions', '10-20 Transactions', 10, 20, 100),
  ('transactions', '20-40 Transactions', 20, 40, 150),
  ('transactions', '40+ Transactions', 40, 999999, 200),
  
  -- Time-based discounts (percentage)
  ('time_discount', '2 Hour Discount', 2, NULL, 0.10),
  ('time_discount', '12 Hour Discount', 12, NULL, 0.20),
  ('time_discount', '24 Hour Discount', 24, NULL, 0.33),
  ('time_discount', '48+ Hour Discount', 48, NULL, 0.50);

-- Enable RLS
ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_pricing_overrides ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pricing_config
CREATE POLICY "Anyone can view pricing config"
  ON public.pricing_config FOR SELECT
  USING (active = true);

CREATE POLICY "Admins can manage pricing config"
  ON public.pricing_config FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for discount_codes
CREATE POLICY "Service role can read discount codes"
  ON public.discount_codes FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage discount codes"
  ON public.discount_codes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for admin_pricing_overrides
CREATE POLICY "Clients can view their pricing overrides"
  ON public.admin_pricing_overrides FOR SELECT
  USING (
    client_id IN (
      SELECT id FROM public.clients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage pricing overrides"
  ON public.admin_pricing_overrides FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Update client_business_profiles to use compensation range
ALTER TABLE public.client_business_profiles 
  DROP COLUMN IF EXISTS compensation_range;

ALTER TABLE public.client_business_profiles 
  ADD COLUMN compensation_range jsonb DEFAULT jsonb_build_object(
    'entry_level', jsonb_build_object('min', 0, 'max', 0, 'type', 'commission_only'),
    'experienced', jsonb_build_object('min', 0, 'max', 0, 'type', 'commission_only'),
    'high_producer', jsonb_build_object('min', 0, 'max', 0, 'type', 'commission_only')
  );
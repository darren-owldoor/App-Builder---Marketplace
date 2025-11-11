-- Create geographic reference tables for matching

-- States table
CREATE TABLE public.states (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  abbreviation text NOT NULL UNIQUE,
  country text NOT NULL DEFAULT 'USA',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Counties table
CREATE TABLE public.counties (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  state_id uuid NOT NULL REFERENCES public.states(id) ON DELETE CASCADE,
  latitude numeric,
  longitude numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(name, state_id)
);

-- Cities table
CREATE TABLE public.cities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  county_id uuid REFERENCES public.counties(id) ON DELETE CASCADE,
  state_id uuid NOT NULL REFERENCES public.states(id) ON DELETE CASCADE,
  latitude numeric,
  longitude numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Zip codes table with full geographic data
CREATE TABLE public.zip_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zip_code text NOT NULL UNIQUE,
  city_id uuid REFERENCES public.cities(id) ON DELETE SET NULL,
  county_id uuid REFERENCES public.counties(id) ON DELETE SET NULL,
  state_id uuid NOT NULL REFERENCES public.states(id) ON DELETE CASCADE,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  zip_type text DEFAULT 'standard',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes for fast lookups
CREATE INDEX idx_counties_state ON public.counties(state_id);
CREATE INDEX idx_cities_state ON public.cities(state_id);
CREATE INDEX idx_cities_county ON public.cities(county_id);
CREATE INDEX idx_zip_codes_zip ON public.zip_codes(zip_code);
CREATE INDEX idx_zip_codes_state ON public.zip_codes(state_id);
CREATE INDEX idx_zip_codes_city ON public.zip_codes(city_id);
CREATE INDEX idx_zip_codes_county ON public.zip_codes(county_id);
CREATE INDEX idx_zip_codes_coords ON public.zip_codes(latitude, longitude);

-- Enable RLS
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zip_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Geographic data is public reference data
CREATE POLICY "Geographic data is viewable by authenticated users"
  ON public.states FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Geographic data is viewable by authenticated users"
  ON public.counties FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Geographic data is viewable by authenticated users"
  ON public.cities FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Geographic data is viewable by authenticated users"
  ON public.zip_codes FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Staff can manage geographic data
CREATE POLICY "Staff can manage states"
  ON public.states FOR ALL
  USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Staff can manage counties"
  ON public.counties FOR ALL
  USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Staff can manage cities"
  ON public.cities FOR ALL
  USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Staff can manage zip codes"
  ON public.zip_codes FOR ALL
  USING (has_role(auth.uid(), 'staff'::app_role));
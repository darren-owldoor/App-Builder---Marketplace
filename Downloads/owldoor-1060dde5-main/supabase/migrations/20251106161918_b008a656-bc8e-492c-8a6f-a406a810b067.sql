-- Update the market_coverage table to allow additional coverage types
ALTER TABLE market_coverage DROP CONSTRAINT IF EXISTS market_coverage_coverage_type_check;

ALTER TABLE market_coverage 
ADD CONSTRAINT market_coverage_coverage_type_check 
CHECK (coverage_type = ANY (ARRAY['cities'::text, 'radius'::text, 'polygon'::text, 'zip_radius'::text, 'zip'::text]));
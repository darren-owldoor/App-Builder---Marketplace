-- Create pricing packages table
CREATE TABLE IF NOT EXISTS pricing_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  monthly_cost numeric NOT NULL DEFAULT 0,
  credits_included integer NOT NULL DEFAULT 0,
  features jsonb DEFAULT '[]'::jsonb,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add package and credits columns to clients
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS current_package_id uuid REFERENCES pricing_packages(id),
ADD COLUMN IF NOT EXISTS credits_balance integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_used integer DEFAULT 0;

-- Enable RLS on pricing_packages
ALTER TABLE pricing_packages ENABLE ROW LEVEL SECURITY;

-- Anyone can view active packages
CREATE POLICY "Anyone can view active packages"
ON pricing_packages
FOR SELECT
USING (active = true);

-- Staff can manage all packages
CREATE POLICY "Staff can manage all packages"
ON pricing_packages
FOR ALL
USING (has_role(auth.uid(), 'staff'));

-- Create trigger for pricing_packages updated_at
CREATE TRIGGER update_pricing_packages_updated_at
BEFORE UPDATE ON pricing_packages
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert default packages
INSERT INTO pricing_packages (name, description, monthly_cost, credits_included, features) VALUES
('Free', 'Basic access with limited features', 0, 10, '["Access to basic campaigns", "10 credits per month", "Email support"]'),
('Starter', 'Perfect for small brokerages', 49.99, 100, '["All basic features", "100 credits per month", "Priority email support", "Custom campaigns"]'),
('Professional', 'For growing brokerages', 149.99, 500, '["All starter features", "500 credits per month", "Phone support", "Advanced analytics", "API access"]'),
('Enterprise', 'For large brokerages', 499.99, 2000, '["All professional features", "2000 credits per month", "Dedicated account manager", "Custom integrations", "White-label options"]')
ON CONFLICT DO NOTHING;
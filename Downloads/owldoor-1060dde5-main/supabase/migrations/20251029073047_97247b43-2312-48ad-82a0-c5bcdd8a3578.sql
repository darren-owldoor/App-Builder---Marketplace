-- Extend pricing_packages table with additional fields
ALTER TABLE pricing_packages
ADD COLUMN IF NOT EXISTS ai_usage_price numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS sms_price_per_additional numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS sms_included integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS includes_twilio_number boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS leads_per_month integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_per_lead numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS lead_pricing_rules jsonb DEFAULT '[]'::jsonb;

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  stripe_payment_intent_id text,
  amount numeric NOT NULL,
  currency text DEFAULT 'usd',
  status text NOT NULL DEFAULT 'pending',
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  refunded_amount numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create payment_links table
CREATE TABLE IF NOT EXISTS payment_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'usd',
  description text NOT NULL,
  stripe_payment_link_id text,
  stripe_payment_link_url text,
  email_template text,
  sms_template text,
  status text DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
CREATE POLICY "Staff can view all payments"
  ON payments FOR SELECT
  USING (has_role(auth.uid(), 'staff'));

CREATE POLICY "Clients can view their payments"
  ON payments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM clients c
    WHERE c.id = payments.client_id AND c.user_id = auth.uid()
  ));

CREATE POLICY "Staff can manage payments"
  ON payments FOR ALL
  USING (has_role(auth.uid(), 'staff'));

-- RLS Policies for payment_links
CREATE POLICY "Staff can manage payment links"
  ON payment_links FOR ALL
  USING (has_role(auth.uid(), 'staff'));

CREATE POLICY "Clients can view their payment links"
  ON payment_links FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM clients c
    WHERE c.id = payment_links.client_id AND c.user_id = auth.uid()
  ));

-- Add trigger for updated_at
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_links_updated_at
  BEFORE UPDATE ON payment_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
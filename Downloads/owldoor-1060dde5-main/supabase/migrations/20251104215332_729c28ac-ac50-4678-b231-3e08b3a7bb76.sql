-- Add payment and billing fields to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS has_payment_method BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_method_added_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS monthly_spend_maximum NUMERIC DEFAULT 1000,
ADD COLUMN IF NOT EXISTS current_month_spend NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_spend_reset_date DATE DEFAULT CURRENT_DATE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_stripe_customer_id ON clients(stripe_customer_id);

COMMENT ON COLUMN clients.stripe_customer_id IS 'Stripe customer ID for payment processing';
COMMENT ON COLUMN clients.has_payment_method IS 'Whether client has added a payment method';
COMMENT ON COLUMN clients.payment_method_added_at IS 'When the payment method was first added';
COMMENT ON COLUMN clients.monthly_spend_maximum IS 'Maximum amount client can spend per month (overrules bidding logic)';
COMMENT ON COLUMN clients.current_month_spend IS 'Current month spending total';
COMMENT ON COLUMN clients.last_spend_reset_date IS 'Date when spending was last reset';
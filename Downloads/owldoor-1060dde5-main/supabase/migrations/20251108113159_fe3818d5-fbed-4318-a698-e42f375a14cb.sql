-- Add cost column to matches table to track the actual charge amount
ALTER TABLE matches ADD COLUMN IF NOT EXISTS cost NUMERIC DEFAULT 0;

-- Add payment_intent_id to track Stripe payment
ALTER TABLE matches ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;

-- Add auto_charged timestamp
ALTER TABLE matches ADD COLUMN IF NOT EXISTS auto_charged_at TIMESTAMPTZ;

-- Create function to auto-charge client for a match
CREATE OR REPLACE FUNCTION auto_charge_client_for_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cost NUMERIC;
  v_has_payment_method BOOLEAN;
  v_client_email TEXT;
BEGIN
  -- Only process if match is not yet purchased
  IF NEW.purchased = TRUE THEN
    RETURN NEW;
  END IF;

  -- Get client details
  SELECT has_payment_method, email
  INTO v_has_payment_method, v_client_email
  FROM clients
  WHERE id = NEW.client_id;

  -- If client has a payment method, trigger auto-charge via edge function
  IF v_has_payment_method = TRUE THEN
    -- Calculate cost based on pricing tier
    v_cost := CASE 
      WHEN NEW.pricing_tier = 'premium' THEN 500
      WHEN NEW.pricing_tier = 'qualified' THEN 300
      ELSE 50
    END;

    -- Set the cost in the match record
    NEW.cost := v_cost;

    -- Note: The actual Stripe charge will be handled by an edge function
    -- that listens for new matches with has_payment_method=true
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger that fires BEFORE insert on matches
DROP TRIGGER IF EXISTS trigger_auto_charge_match ON matches;
CREATE TRIGGER trigger_auto_charge_match
  BEFORE INSERT ON matches
  FOR EACH ROW
  EXECUTE FUNCTION auto_charge_client_for_match();

COMMENT ON FUNCTION auto_charge_client_for_match() IS 'Sets the cost for a match based on pricing tier. The actual Stripe charge is handled by the auto-charge-match edge function.';
COMMENT ON COLUMN matches.cost IS 'The cost charged to the client for this match';
COMMENT ON COLUMN matches.payment_intent_id IS 'Stripe Payment Intent ID for this match';
COMMENT ON COLUMN matches.auto_charged_at IS 'Timestamp when the match was auto-charged';
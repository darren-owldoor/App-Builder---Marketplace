-- Convert credits to dollar amounts and add auto-refill system

-- 1. Change credits_balance and credits_used to numeric to handle dollar amounts
ALTER TABLE clients 
  ALTER COLUMN credits_balance TYPE numeric USING credits_balance::numeric,
  ALTER COLUMN credits_used TYPE numeric USING credits_used::numeric;

-- 2. Add last_refill_amount column to track auto-refill
ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS last_refill_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_refills numeric DEFAULT 0;

-- 3. Create function to auto-refill credits every $200 spent
CREATE OR REPLACE FUNCTION auto_refill_credits()
RETURNS TRIGGER AS $$
DECLARE
  v_spent_since_last_refill numeric;
  v_refill_threshold numeric := 200;
  v_refill_amount numeric := 200;
BEGIN
  -- Calculate how much has been spent since last refill
  v_spent_since_last_refill := NEW.credits_used - OLD.credits_used;
  
  -- Check if we've spent another $200 since last refill
  IF v_spent_since_last_refill >= v_refill_threshold THEN
    -- Add $200 to credits balance
    NEW.credits_balance := NEW.credits_balance + v_refill_amount;
    NEW.last_refill_amount := v_refill_amount;
    NEW.total_refills := COALESCE(NEW.total_refills, 0) + v_refill_amount;
    
    -- Log the auto-refill
    RAISE NOTICE 'Auto-refilled $ for client %: Added $% (Total refills: $%)', 
      NEW.id, v_refill_amount, NEW.total_refills;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Create trigger for auto-refill
DROP TRIGGER IF EXISTS trigger_auto_refill_credits ON clients;
CREATE TRIGGER trigger_auto_refill_credits
  BEFORE UPDATE OF credits_used ON clients
  FOR EACH ROW
  WHEN (NEW.credits_used > OLD.credits_used)
  EXECUTE FUNCTION auto_refill_credits();

-- 5. Update credit transaction history to use numeric
ALTER TABLE credit_transactions 
  ALTER COLUMN amount TYPE numeric USING amount::numeric;

-- 6. Comment on the system
COMMENT ON COLUMN clients.credits_balance IS 'Credit balance in dollars - can be used for lead purchases';
COMMENT ON COLUMN clients.credits_used IS 'Total credits (dollars) used - triggers auto-refill every $200';
COMMENT ON FUNCTION auto_refill_credits() IS 'Automatically adds $200 in credits for every $200 spent';
-- Temporarily disable the coverage quality trigger that's causing saves to fail
DROP TRIGGER IF EXISTS trigger_calculate_coverage_quality ON market_coverage;

-- We'll re-enable with better error handling later
-- The trigger was trying to calculate quality scores immediately after insert
-- but was failing to find the newly inserted record
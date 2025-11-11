-- Add bid_id to matches table to track which bid generated the match
ALTER TABLE matches ADD COLUMN IF NOT EXISTS bid_id uuid REFERENCES bids(id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_matches_bid_id ON matches(bid_id);

-- Add comments for clarity
COMMENT ON COLUMN matches.bid_id IS 'The bid that generated this match. Matches are now created based on client bids, not client records directly.';
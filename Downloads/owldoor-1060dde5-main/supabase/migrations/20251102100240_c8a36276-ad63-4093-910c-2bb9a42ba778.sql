-- Add package_type to pricing_packages for exclusive/non-exclusive leads
ALTER TABLE pricing_packages 
ADD COLUMN IF NOT EXISTS package_type text DEFAULT 'non_exclusive' CHECK (package_type IN ('exclusive', 'non_exclusive'));

-- Create missed_matches table to track opportunities clients couldn't afford
CREATE TABLE IF NOT EXISTS missed_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  match_score integer NOT NULL DEFAULT 0,
  required_credits numeric NOT NULL,
  package_type text NOT NULL CHECK (package_type IN ('exclusive', 'non_exclusive')),
  lead_preview jsonb NOT NULL, -- Redacted lead info (no name/contact)
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '30 days'),
  purchased boolean DEFAULT false,
  purchased_at timestamp with time zone
);

-- Add RLS policies for missed_matches
ALTER TABLE missed_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view their own missed matches"
  ON missed_matches FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM clients c 
    WHERE c.id = missed_matches.client_id 
    AND c.user_id = auth.uid()
  ));

CREATE POLICY "Staff can view all missed matches"
  ON missed_matches FOR SELECT
  USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Staff can manage all missed matches"
  ON missed_matches FOR ALL
  USING (has_role(auth.uid(), 'staff'::app_role));

-- Add package_type to matches table
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS package_type text DEFAULT 'non_exclusive' CHECK (package_type IN ('exclusive', 'non_exclusive'));

-- Create function to auto-progress leads from qualified to match_ready
CREATE OR REPLACE FUNCTION auto_progress_qualified_leads()
RETURNS trigger AS $$
BEGIN
  -- If a lead becomes qualified, automatically set to match_ready
  IF NEW.pipeline_stage = 'qualified' AND OLD.pipeline_stage != 'match_ready' THEN
    NEW.pipeline_stage := 'match_ready';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-progression
DROP TRIGGER IF EXISTS trigger_auto_progress_qualified ON agents;
CREATE TRIGGER trigger_auto_progress_qualified
  BEFORE UPDATE ON agents
  FOR EACH ROW
  WHEN (NEW.pipeline_stage = 'qualified')
  EXECUTE FUNCTION auto_progress_qualified_leads();

-- Add index for faster matching queries
CREATE INDEX IF NOT EXISTS idx_agents_match_ready ON agents(pipeline_stage) WHERE pipeline_stage = 'match_ready';
CREATE INDEX IF NOT EXISTS idx_missed_matches_client ON missed_matches(client_id, expires_at) WHERE NOT purchased;
-- Add pipeline type and stage columns to leads
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS pipeline_type text DEFAULT 'staff' CHECK (pipeline_type IN ('staff', 'client')),
ADD COLUMN IF NOT EXISTS pipeline_stage text DEFAULT 'new';

-- Update status to use the new pipeline stages
-- Staff pipeline: new, qualifying, qualified, match_ready, matched, purchased
-- Client pipeline: new_recruit, hot_recruit, booked_appt, nurture, hired, dead

-- Add audience targeting to campaign templates
ALTER TABLE campaign_templates
ADD COLUMN IF NOT EXISTS target_pipeline_stages text[],
ADD COLUMN IF NOT EXISTS target_field_criteria jsonb;

-- Add response tracking for campaigns
CREATE TABLE IF NOT EXISTS campaign_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES campaign_assignments(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  response_text text NOT NULL,
  received_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on campaign_responses
ALTER TABLE campaign_responses ENABLE ROW LEVEL SECURITY;

-- Staff can view all responses
CREATE POLICY "Staff can view all campaign responses"
ON campaign_responses FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'staff'));

-- Clients can view responses for their campaigns
CREATE POLICY "Clients can view their campaign responses"
ON campaign_responses FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM campaign_assignments ca
    JOIN clients c ON c.user_id = auth.uid()
    WHERE ca.id = campaign_responses.assignment_id
  )
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_campaign_responses_assignment ON campaign_responses(assignment_id);
CREATE INDEX IF NOT EXISTS idx_campaign_responses_lead ON campaign_responses(lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_pipeline ON leads(pipeline_type, pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_campaign_templates_targeting ON campaign_templates USING gin(target_pipeline_stages);

-- Update campaign_logs to include more context
ALTER TABLE campaign_logs
ADD COLUMN IF NOT EXISTS response_received boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS response_text text;
-- Add AI campaign fields to campaign_assignments
ALTER TABLE campaign_assignments
ADD COLUMN IF NOT EXISTS ai_handed_off BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_handoff_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ai_ready_for_handoff BOOLEAN DEFAULT false;

-- Add twilio_account_id to sms_templates
ALTER TABLE sms_templates
ADD COLUMN IF NOT EXISTS twilio_account_id UUID REFERENCES twilio_accounts(id) ON DELETE SET NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_campaign_assignments_ai_handoff ON campaign_assignments(ai_ready_for_handoff) WHERE ai_ready_for_handoff = true;
-- Add Twilio account and phone number fields to campaign_steps
ALTER TABLE campaign_steps
ADD COLUMN IF NOT EXISTS twilio_account_id UUID REFERENCES twilio_accounts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add AI-related fields to campaign_templates
ALTER TABLE campaign_templates
ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_system_prompt TEXT,
ADD COLUMN IF NOT EXISTS ai_initial_message TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_campaign_steps_twilio_account ON campaign_steps(twilio_account_id);

-- Add comment
COMMENT ON COLUMN campaign_steps.twilio_account_id IS 'Specific Twilio account to use for this step';
COMMENT ON COLUMN campaign_steps.phone_number IS 'Specific phone number to use for this step';
COMMENT ON COLUMN campaign_templates.ai_enabled IS 'Whether this campaign uses AI for lead qualification';
COMMENT ON COLUMN campaign_templates.ai_system_prompt IS 'System prompt for AI conversation';
COMMENT ON COLUMN campaign_templates.ai_initial_message IS 'Initial message sent by AI';
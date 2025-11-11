-- Add conversation_sid column to ai_leads table for Twilio Conversations
ALTER TABLE ai_leads 
ADD COLUMN IF NOT EXISTS conversation_sid TEXT,
ADD COLUMN IF NOT EXISTS twilio_participant_sid TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_leads_conversation_sid ON ai_leads(conversation_sid);

-- Add twilio_message_sid to ai_messages for tracking
ALTER TABLE ai_messages
ADD COLUMN IF NOT EXISTS twilio_message_sid TEXT;

-- Add index
CREATE INDEX IF NOT EXISTS idx_ai_messages_twilio_sid ON ai_messages(twilio_message_sid);
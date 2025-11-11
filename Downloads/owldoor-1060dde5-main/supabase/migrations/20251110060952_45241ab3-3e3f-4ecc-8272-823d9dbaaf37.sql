-- Add missing CRM fields to ai_leads
ALTER TABLE ai_leads
ADD COLUMN IF NOT EXISTS next_action TEXT,
ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_hot BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ai_message_count INTEGER DEFAULT 0;

-- Add missing CRM fields to ai_config
ALTER TABLE ai_config
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS brokerage_info TEXT,
ADD COLUMN IF NOT EXISTS offer_details TEXT,
ADD COLUMN IF NOT EXISTS team_special TEXT,
ADD COLUMN IF NOT EXISTS key_benefits TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ai_response_tone TEXT DEFAULT 'Professional & Friendly',
ADD COLUMN IF NOT EXISTS escalate_on_callback_requests BOOLEAN DEFAULT TRUE;

-- Create appointments table for upcoming appointments
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES ai_leads(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'scheduled',
  is_confirmed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create policies for appointments
CREATE POLICY "Users can view their own appointments"
ON appointments FOR SELECT
USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "Users can create their own appointments"
ON appointments FOR INSERT
WITH CHECK (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own appointments"
ON appointments FOR UPDATE
USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own appointments"
ON appointments FOR DELETE
USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_lead_id ON appointments(lead_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON appointments(scheduled_at);
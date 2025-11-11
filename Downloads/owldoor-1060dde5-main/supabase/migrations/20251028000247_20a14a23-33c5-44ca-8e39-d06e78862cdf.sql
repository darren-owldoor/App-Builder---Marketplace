-- Create tables for AI training and client business profiles

-- Store client business profiles for AI context
CREATE TABLE client_business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  company_description TEXT,
  unique_selling_points TEXT[],
  ideal_candidate_profile JSONB, -- structured data about ideal candidates
  hiring_criteria JSONB, -- what they're looking for
  deal_breakers TEXT[], -- automatic disqualifiers
  compensation_range JSONB, -- salary/commission structure
  work_environment TEXT, -- remote/hybrid/in-office
  culture_values TEXT[],
  typical_questions TEXT[], -- questions they want AI to ask
  objection_handlers JSONB, -- how to handle common objections
  appointment_booking_preferences JSONB, -- when/how they prefer appointments
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store onboarding questionnaire responses
CREATE TABLE client_onboarding_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES client_business_profiles(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  question_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store AI conversation logs for training
CREATE TABLE ai_conversation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_assignment_id UUID REFERENCES campaign_assignments(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL, -- 'ai_message', 'lead_response', 'system_event'
  message_content TEXT NOT NULL,
  sentiment_score DECIMAL, -- -1 to 1 (negative to positive)
  intent_detected TEXT, -- what the AI detected user wants
  context_data JSONB, -- additional context
  resulted_in_appointment BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Store successful conversation patterns for AI learning
CREATE TABLE ai_learning_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type TEXT NOT NULL, -- 'successful_objection_handler', 'booking_strategy', 'qualification_question'
  pattern_name TEXT NOT NULL,
  pattern_context JSONB, -- when to use this pattern
  pattern_content TEXT NOT NULL, -- the actual message/strategy
  success_rate DECIMAL DEFAULT 0, -- tracked over time
  times_used INTEGER DEFAULT 0,
  times_successful INTEGER DEFAULT 0,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE, -- null means universal pattern
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track AI performance metrics
CREATE TABLE ai_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  metric_date DATE DEFAULT CURRENT_DATE,
  total_conversations INTEGER DEFAULT 0,
  leads_qualified INTEGER DEFAULT 0,
  appointments_booked INTEGER DEFAULT 0,
  average_sentiment_score DECIMAL,
  average_conversation_length INTEGER, -- in messages
  top_objections JSONB,
  conversion_rate DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_business_profiles_client_id ON client_business_profiles(client_id);
CREATE INDEX idx_conversation_logs_campaign ON ai_conversation_logs(campaign_assignment_id);
CREATE INDEX idx_conversation_logs_lead ON ai_conversation_logs(lead_id);
CREATE INDEX idx_conversation_logs_client ON ai_conversation_logs(client_id);
CREATE INDEX idx_learning_patterns_client ON ai_learning_patterns(client_id);
CREATE INDEX idx_learning_patterns_active ON ai_learning_patterns(active) WHERE active = true;
CREATE INDEX idx_performance_metrics_client_date ON ai_performance_metrics(client_id, metric_date);

-- Enable RLS
ALTER TABLE client_business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_onboarding_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learning_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_business_profiles
CREATE POLICY "Staff can manage all business profiles"
  ON client_business_profiles
  FOR ALL
  USING (has_role(auth.uid(), 'staff'));

CREATE POLICY "Clients can manage their own business profile"
  ON client_business_profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = client_business_profiles.client_id
      AND c.user_id = auth.uid()
    )
  );

-- RLS Policies for client_onboarding_responses
CREATE POLICY "Staff can view all onboarding responses"
  ON client_onboarding_responses
  FOR SELECT
  USING (has_role(auth.uid(), 'staff'));

CREATE POLICY "Clients can manage their own onboarding responses"
  ON client_onboarding_responses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM client_business_profiles cbp
      JOIN clients c ON cbp.client_id = c.id
      WHERE cbp.id = client_onboarding_responses.profile_id
      AND c.user_id = auth.uid()
    )
  );

-- RLS Policies for ai_conversation_logs
CREATE POLICY "Staff can view all conversation logs"
  ON ai_conversation_logs
  FOR SELECT
  USING (has_role(auth.uid(), 'staff'));

CREATE POLICY "Clients can view their conversation logs"
  ON ai_conversation_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = ai_conversation_logs.client_id
      AND c.user_id = auth.uid()
    )
  );

-- RLS Policies for ai_learning_patterns
CREATE POLICY "Staff can manage all learning patterns"
  ON ai_learning_patterns
  FOR ALL
  USING (has_role(auth.uid(), 'staff'));

CREATE POLICY "Clients can view patterns"
  ON ai_learning_patterns
  FOR SELECT
  USING (
    has_role(auth.uid(), 'client')
    AND (client_id IS NULL OR EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = ai_learning_patterns.client_id
      AND c.user_id = auth.uid()
    ))
  );

-- RLS Policies for ai_performance_metrics
CREATE POLICY "Staff can view all performance metrics"
  ON ai_performance_metrics
  FOR SELECT
  USING (has_role(auth.uid(), 'staff'));

CREATE POLICY "Clients can view their own metrics"
  ON ai_performance_metrics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = ai_performance_metrics.client_id
      AND c.user_id = auth.uid()
    )
  );
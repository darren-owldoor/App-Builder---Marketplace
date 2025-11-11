-- Add conditional logic and auto-qualification rules to campaigns

-- Campaign step conditions (If/Then logic)
CREATE TABLE campaign_step_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID REFERENCES campaign_steps(id) ON DELETE CASCADE,
  condition_type TEXT NOT NULL, -- 'response_is', 'response_is_not', 'response_contains', 'response_does_not_contain', 'no_response_after', 'ai_analyze'
  condition_values TEXT[], -- phrases/words for matching
  condition_time_value INTEGER, -- for 'no_response_after' (numeric value)
  condition_time_unit TEXT, -- 'minutes', 'hours', 'days'
  action_type TEXT NOT NULL, -- 'end', 'proceed', 'move_to_stage', 'move_to_campaign', 'ai_respond'
  action_value TEXT, -- stage name or campaign_id
  order_index INTEGER DEFAULT 0, -- order of conditions if multiple
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-qualification rules for campaigns
CREATE TABLE campaign_qualification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_template_id UUID REFERENCES campaign_templates(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- 'field_match', 'response_match', 'score_threshold', 'time_based'
  field_name TEXT, -- custom field name or standard field
  operator TEXT NOT NULL, -- 'equals', 'contains', 'greater_than', 'less_than', 'not_equals'
  value TEXT NOT NULL,
  target_stage TEXT NOT NULL, -- which pipeline stage to move to
  active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- higher priority rules run first
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add AI fallback preferences to campaign templates
ALTER TABLE campaign_templates 
  ADD COLUMN ai_fallback_enabled BOOLEAN DEFAULT false,
  ADD COLUMN ai_fallback_notify_email BOOLEAN DEFAULT true,
  ADD COLUMN ai_fallback_notify_sms BOOLEAN DEFAULT false,
  ADD COLUMN ai_fallback_recipients TEXT[]; -- user_ids to notify

-- Add indexes for performance
CREATE INDEX idx_step_conditions_step_id ON campaign_step_conditions(step_id);
CREATE INDEX idx_qualification_rules_template_id ON campaign_qualification_rules(campaign_template_id);
CREATE INDEX idx_qualification_rules_active ON campaign_qualification_rules(active) WHERE active = true;

-- Enable RLS
ALTER TABLE campaign_step_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_qualification_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaign_step_conditions
CREATE POLICY "Staff can manage all step conditions"
  ON campaign_step_conditions
  FOR ALL
  USING (has_role(auth.uid(), 'staff'));

CREATE POLICY "Users can view conditions of accessible campaigns"
  ON campaign_step_conditions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaign_steps cs
      JOIN campaign_templates ct ON cs.campaign_template_id = ct.id
      WHERE cs.id = campaign_step_conditions.step_id
      AND (
        has_role(auth.uid(), 'staff')
        OR (has_role(auth.uid(), 'client') AND ct.shared_with_clients = true)
      )
    )
  );

-- RLS Policies for campaign_qualification_rules
CREATE POLICY "Staff can manage all qualification rules"
  ON campaign_qualification_rules
  FOR ALL
  USING (has_role(auth.uid(), 'staff'));

CREATE POLICY "Users can view rules of accessible campaigns"
  ON campaign_qualification_rules
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaign_templates ct
      WHERE ct.id = campaign_qualification_rules.campaign_template_id
      AND (
        has_role(auth.uid(), 'staff')
        OR (has_role(auth.uid(), 'client') AND ct.shared_with_clients = true)
      )
    )
  );
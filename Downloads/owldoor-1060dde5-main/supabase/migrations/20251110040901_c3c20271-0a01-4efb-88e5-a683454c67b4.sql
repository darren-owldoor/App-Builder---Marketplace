-- Add lead scoring fields to matches table
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS score_last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create function to calculate lead score based on conversation metrics
CREATE OR REPLACE FUNCTION calculate_lead_score(p_match_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_message_count INTEGER := 0;
  v_response_rate NUMERIC := 0;
  v_recency_score INTEGER := 0;
  v_engagement_score INTEGER := 0;
  v_total_score INTEGER := 0;
  v_last_message_at TIMESTAMP WITH TIME ZONE;
  v_lead_messages INTEGER := 0;
  v_ai_messages INTEGER := 0;
BEGIN
  -- Get message counts by sender type
  SELECT 
    COUNT(*) FILTER (WHERE sender_type = 'lead'),
    COUNT(*) FILTER (WHERE sender_type = 'ai'),
    MAX(created_at)
  INTO v_lead_messages, v_ai_messages, v_last_message_at
  FROM ai_messages
  WHERE lead_id = p_match_id;
  
  v_message_count := v_lead_messages + v_ai_messages;
  
  -- Calculate response rate (0-25 points)
  IF v_ai_messages > 0 THEN
    v_response_rate := (v_lead_messages::NUMERIC / v_ai_messages::NUMERIC);
    v_engagement_score := LEAST(ROUND(v_response_rate * 25), 25);
  END IF;
  
  -- Calculate recency score (0-25 points)
  IF v_last_message_at IS NOT NULL THEN
    CASE 
      WHEN v_last_message_at > NOW() - INTERVAL '24 hours' THEN v_recency_score := 25;
      WHEN v_last_message_at > NOW() - INTERVAL '3 days' THEN v_recency_score := 20;
      WHEN v_last_message_at > NOW() - INTERVAL '7 days' THEN v_recency_score := 15;
      WHEN v_last_message_at > NOW() - INTERVAL '14 days' THEN v_recency_score := 10;
      WHEN v_last_message_at > NOW() - INTERVAL '30 days' THEN v_recency_score := 5;
      ELSE v_recency_score := 0;
    END CASE;
  END IF;
  
  -- Message volume score (0-30 points)
  v_total_score := v_total_score + LEAST(v_message_count * 3, 30);
  
  -- Lead engagement score (0-20 points) - higher weight for leads who respond
  v_total_score := v_total_score + LEAST(v_lead_messages * 4, 20);
  
  -- Add recency and response rate
  v_total_score := v_total_score + v_recency_score + v_engagement_score;
  
  -- Cap at 100
  v_total_score := LEAST(v_total_score, 100);
  
  RETURN v_total_score;
END;
$$;

-- Create trigger to auto-update lead scores when messages are added
CREATE OR REPLACE FUNCTION update_lead_score_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_new_score INTEGER;
BEGIN
  -- Calculate new score
  v_new_score := calculate_lead_score(NEW.lead_id);
  
  -- Update the match record
  UPDATE matches 
  SET 
    lead_score = v_new_score,
    score_last_updated = NOW()
  WHERE id = NEW.lead_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger on ai_messages
DROP TRIGGER IF EXISTS trigger_update_lead_score ON ai_messages;
CREATE TRIGGER trigger_update_lead_score
  AFTER INSERT OR UPDATE ON ai_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_score_on_message();

-- Calculate initial scores for existing matches
UPDATE matches
SET 
  lead_score = calculate_lead_score(id),
  score_last_updated = NOW()
WHERE purchased = true;
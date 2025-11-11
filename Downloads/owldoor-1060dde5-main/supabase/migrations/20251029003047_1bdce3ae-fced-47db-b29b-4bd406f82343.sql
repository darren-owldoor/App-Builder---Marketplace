-- Add new fields to campaign_templates for lead types and pricing
ALTER TABLE campaign_templates
ADD COLUMN IF NOT EXISTS lead_types text[] DEFAULT ARRAY[]::text[],
ADD COLUMN IF NOT EXISTS pricing_model text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS monthly_cost numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS per_action_cost numeric DEFAULT 0;

-- Create campaign_template_ratings table
CREATE TABLE IF NOT EXISTS campaign_template_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_template_id uuid NOT NULL REFERENCES campaign_templates(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(campaign_template_id, client_id)
);

-- Enable RLS on ratings table
ALTER TABLE campaign_template_ratings ENABLE ROW LEVEL SECURITY;

-- Clients can manage their own ratings
CREATE POLICY "Clients can manage their own ratings"
ON campaign_template_ratings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM clients c
    WHERE c.id = campaign_template_ratings.client_id
    AND c.user_id = auth.uid()
  )
);

-- Staff can view all ratings
CREATE POLICY "Staff can view all ratings"
ON campaign_template_ratings
FOR SELECT
USING (has_role(auth.uid(), 'staff'));

-- Create trigger for updated_at
CREATE TRIGGER update_campaign_template_ratings_updated_at
BEFORE UPDATE ON campaign_template_ratings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
-- Function to increment profile views
CREATE OR REPLACE FUNCTION increment_profile_views(profile_id UUID)
RETURNS TABLE(view_count BIGINT) AS $$
BEGIN
  -- Increment view count
  UPDATE pros
  SET 
    profile_views = COALESCE(profile_views, 0) + 1,
    last_viewed_at = NOW()
  WHERE id = profile_id;
  
  -- Return new count
  RETURN QUERY
  SELECT profile_views::BIGINT
  FROM pros
  WHERE id = profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add profile tracking fields
ALTER TABLE pros ADD COLUMN IF NOT EXISTS profile_views INTEGER DEFAULT 0;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS times_contacted INTEGER DEFAULT 0;

-- Create saved_pros table
CREATE TABLE IF NOT EXISTS saved_pros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  pro_id UUID NOT NULL REFERENCES pros(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, pro_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_pros_client ON saved_pros(client_id);
CREATE INDEX IF NOT EXISTS idx_saved_pros_pro ON saved_pros(pro_id);

-- Enable RLS
ALTER TABLE saved_pros ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Clients can manage their saves" ON saved_pros;

-- Create policy for saved_pros
CREATE POLICY "Clients can manage their saves"
  ON saved_pros
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = saved_pros.client_id 
      AND clients.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = saved_pros.client_id 
      AND clients.user_id = auth.uid()
    )
  );
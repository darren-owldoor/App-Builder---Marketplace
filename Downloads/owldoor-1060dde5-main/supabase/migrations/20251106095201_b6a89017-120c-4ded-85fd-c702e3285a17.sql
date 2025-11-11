-- Create public storage bucket for data files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('data', 'data', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to data bucket
CREATE POLICY "Public read access for data files"
ON storage.objects FOR SELECT
USING (bucket_id = 'data');
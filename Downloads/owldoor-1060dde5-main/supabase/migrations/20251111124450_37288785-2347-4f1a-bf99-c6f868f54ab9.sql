-- Create sync configuration table
CREATE TABLE IF NOT EXISTS public.sync_configuration (
  id INTEGER PRIMARY KEY DEFAULT 1,
  external_url TEXT NOT NULL,
  external_key TEXT NOT NULL,
  two_way_sync BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add constraint to ensure only one row
ALTER TABLE public.sync_configuration 
ADD CONSTRAINT single_config_row CHECK (id = 1);

-- Enable Row Level Security
ALTER TABLE public.sync_configuration ENABLE ROW LEVEL SECURITY;

-- Create policies for admins only
CREATE POLICY "Admins can view sync config"
ON public.sync_configuration
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can manage sync config"
ON public.sync_configuration
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Create trigger to update updated_at
CREATE TRIGGER update_sync_configuration_updated_at
  BEFORE UPDATE ON public.sync_configuration
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
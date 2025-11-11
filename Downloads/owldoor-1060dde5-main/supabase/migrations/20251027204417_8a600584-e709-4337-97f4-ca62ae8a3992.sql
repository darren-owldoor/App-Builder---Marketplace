-- Create custom_fields table to store field definitions
CREATE TABLE IF NOT EXISTS public.custom_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL,
  target_table TEXT NOT NULL CHECK (target_table IN ('leads', 'clients')),
  required BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(field_name, target_table)
);

-- Create custom_field_values table to store actual values
CREATE TABLE IF NOT EXISTS public.custom_field_values (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  custom_field_id UUID NOT NULL REFERENCES public.custom_fields(id) ON DELETE CASCADE,
  record_id UUID NOT NULL,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(custom_field_id, record_id)
);

-- Enable RLS
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;

-- Policies for custom_fields
CREATE POLICY "Staff can manage custom fields"
  ON public.custom_fields
  FOR ALL
  USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Authenticated users can view active custom fields"
  ON public.custom_fields
  FOR SELECT
  USING (auth.uid() IS NOT NULL AND active = true);

-- Policies for custom_field_values
CREATE POLICY "Staff can manage all custom field values"
  ON public.custom_field_values
  FOR ALL
  USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Users can view their own custom field values"
  ON public.custom_field_values
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM leads 
        WHERE leads.id = record_id AND leads.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM clients 
        WHERE clients.id = record_id AND clients.user_id = auth.uid()
      )
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_custom_fields_updated_at
  BEFORE UPDATE ON public.custom_fields
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_field_values_updated_at
  BEFORE UPDATE ON public.custom_field_values
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
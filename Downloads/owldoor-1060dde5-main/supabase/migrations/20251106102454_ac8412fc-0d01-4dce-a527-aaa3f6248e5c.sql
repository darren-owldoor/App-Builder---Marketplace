-- Create table for client-specific pro notes and field edits
CREATE TABLE public.client_pro_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  pro_id UUID NOT NULL REFERENCES public.pros(id) ON DELETE CASCADE,
  notes TEXT,
  field_overrides JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, pro_id)
);

-- Enable RLS
ALTER TABLE public.client_pro_notes ENABLE ROW LEVEL SECURITY;

-- Clients can view their own notes
CREATE POLICY "Clients can view their own pro notes"
  ON public.client_pro_notes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = client_pro_notes.client_id
      AND c.user_id = auth.uid()
    )
  );

-- Clients can insert their own notes
CREATE POLICY "Clients can insert their own pro notes"
  ON public.client_pro_notes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = client_pro_notes.client_id
      AND c.user_id = auth.uid()
    )
  );

-- Clients can update their own notes
CREATE POLICY "Clients can update their own pro notes"
  ON public.client_pro_notes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = client_pro_notes.client_id
      AND c.user_id = auth.uid()
    )
  );

-- Staff can manage all notes
CREATE POLICY "Staff can manage all pro notes"
  ON public.client_pro_notes
  FOR ALL
  USING (has_role(auth.uid(), 'staff'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_client_pro_notes_updated_at
  BEFORE UPDATE ON public.client_pro_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_client_pro_notes_client_id ON public.client_pro_notes(client_id);
CREATE INDEX idx_client_pro_notes_pro_id ON public.client_pro_notes(pro_id);
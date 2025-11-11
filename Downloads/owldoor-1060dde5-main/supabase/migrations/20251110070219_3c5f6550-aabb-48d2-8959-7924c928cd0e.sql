-- Create tasks/reminders table for AI CRM
CREATE TABLE IF NOT EXISTS public.ai_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.ai_leads(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  assigned_to TEXT,
  task_type TEXT DEFAULT 'custom' CHECK (task_type IN ('custom', 'follow_up', 'call', 'email', 'meeting', 'reminder')),
  created_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_ai_tasks_lead_id ON public.ai_tasks(lead_id);
CREATE INDEX idx_ai_tasks_client_id ON public.ai_tasks(client_id);
CREATE INDEX idx_ai_tasks_status ON public.ai_tasks(status);
CREATE INDEX idx_ai_tasks_due_date ON public.ai_tasks(due_date);

-- RLS policies
ALTER TABLE public.ai_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks for their clients"
  ON public.ai_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = ai_tasks.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks for their clients"
  ON public.ai_tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = ai_tasks.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks for their clients"
  ON public.ai_tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = ai_tasks.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks for their clients"
  ON public.ai_tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = ai_tasks.client_id
      AND clients.user_id = auth.uid()
    )
  );

-- Create card layout preferences table
CREATE TABLE IF NOT EXISTS public.ai_card_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  view_type TEXT DEFAULT 'kanban' CHECK (view_type IN ('kanban', 'list')),
  visible_fields JSONB DEFAULT '[]'::jsonb,
  field_order JSONB DEFAULT '[]'::jsonb,
  card_size TEXT DEFAULT 'medium' CHECK (card_size IN ('compact', 'medium', 'large')),
  show_avatar BOOLEAN DEFAULT true,
  show_engagement_score BOOLEAN DEFAULT true,
  show_match_score BOOLEAN DEFAULT true,
  show_location BOOLEAN DEFAULT true,
  show_experience BOOLEAN DEFAULT true,
  show_volume BOOLEAN DEFAULT true,
  show_deals BOOLEAN DEFAULT true,
  show_license_years BOOLEAN DEFAULT true,
  show_wants BOOLEAN DEFAULT true,
  show_service_areas BOOLEAN DEFAULT false,
  show_last_contact BOOLEAN DEFAULT true,
  show_next_action BOOLEAN DEFAULT true,
  show_stage_badge BOOLEAN DEFAULT true,
  show_hot_badge BOOLEAN DEFAULT true,
  show_tasks_count BOOLEAN DEFAULT true,
  show_messages_count BOOLEAN DEFAULT true,
  show_phone BOOLEAN DEFAULT false,
  show_email BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint
CREATE UNIQUE INDEX idx_ai_card_layouts_client_view ON public.ai_card_layouts(client_id, view_type);

-- RLS policies
ALTER TABLE public.ai_card_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their card layouts"
  ON public.ai_card_layouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = ai_card_layouts.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their card layouts"
  ON public.ai_card_layouts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.clients
      WHERE clients.id = ai_card_layouts.client_id
      AND clients.user_id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_ai_tasks_updated_at
  BEFORE UPDATE ON public.ai_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_card_layouts_updated_at
  BEFORE UPDATE ON public.ai_card_layouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
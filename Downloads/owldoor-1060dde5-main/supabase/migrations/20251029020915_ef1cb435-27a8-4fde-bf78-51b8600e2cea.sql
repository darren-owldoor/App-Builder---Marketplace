-- Create conversations table for storing messages/interactions
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('note', 'sms', 'email', 'call')),
  message_content TEXT NOT NULL,
  sent_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB
);

-- Create message_templates table for single message templates
CREATE TABLE public.message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('sms', 'email', 'note')),
  template_content TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Staff can manage all conversations"
  ON public.conversations
  FOR ALL
  USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Clients can view their conversations"
  ON public.conversations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = conversations.client_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can create conversations for their leads"
  ON public.conversations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients c
      WHERE c.id = conversations.client_id
      AND c.user_id = auth.uid()
    )
  );

-- RLS Policies for message_templates
CREATE POLICY "Users can manage their own templates"
  ON public.message_templates
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all templates"
  ON public.message_templates
  FOR SELECT
  USING (has_role(auth.uid(), 'staff'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_conversations_lead_id ON public.conversations(lead_id);
CREATE INDEX idx_conversations_client_id ON public.conversations(client_id);
CREATE INDEX idx_conversations_created_at ON public.conversations(created_at DESC);
CREATE INDEX idx_message_templates_user_id ON public.message_templates(user_id);
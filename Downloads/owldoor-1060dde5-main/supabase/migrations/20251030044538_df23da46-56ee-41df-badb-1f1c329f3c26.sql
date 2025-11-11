-- Create admin_chat_conversations table to store admin AI chat history
CREATE TABLE IF NOT EXISTS public.admin_chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create admin_chat_messages table to store individual messages
CREATE TABLE IF NOT EXISTS public.admin_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.admin_chat_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.admin_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_chat_conversations
CREATE POLICY "Admins can view their own conversations"
  ON public.admin_chat_conversations
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND admin_id = auth.uid());

CREATE POLICY "Admins can create their own conversations"
  ON public.admin_chat_conversations
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) AND admin_id = auth.uid());

CREATE POLICY "Admins can update their own conversations"
  ON public.admin_chat_conversations
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role) AND admin_id = auth.uid());

-- RLS Policies for admin_chat_messages
CREATE POLICY "Admins can view messages from their conversations"
  ON public.admin_chat_messages
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::app_role) AND
    EXISTS (
      SELECT 1 FROM public.admin_chat_conversations
      WHERE id = admin_chat_messages.conversation_id
      AND admin_id = auth.uid()
    )
  );

CREATE POLICY "Admins can create messages in their conversations"
  ON public.admin_chat_messages
  FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role) AND
    EXISTS (
      SELECT 1 FROM public.admin_chat_conversations
      WHERE id = admin_chat_messages.conversation_id
      AND admin_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX idx_admin_chat_conversations_admin_id ON public.admin_chat_conversations(admin_id);
CREATE INDEX idx_admin_chat_messages_conversation_id ON public.admin_chat_messages(conversation_id);
CREATE INDEX idx_admin_chat_messages_created_at ON public.admin_chat_messages(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_admin_chat_conversations_updated_at
  BEFORE UPDATE ON public.admin_chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- Add RLS policies for admin_chat_conversations table

-- Policy for admins to manage their own conversations
CREATE POLICY "Admins can manage their own conversations"
ON admin_chat_conversations
FOR ALL
USING (admin_id = auth.uid())
WITH CHECK (admin_id = auth.uid());

-- Policy for admin_chat_messages
CREATE POLICY "Users can view messages in their conversations"
ON admin_chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admin_chat_conversations
    WHERE admin_chat_conversations.id = admin_chat_messages.conversation_id
    AND admin_chat_conversations.admin_id = auth.uid()
  )
);

CREATE POLICY "Users can insert messages in their conversations"
ON admin_chat_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admin_chat_conversations
    WHERE admin_chat_conversations.id = admin_chat_messages.conversation_id
    AND admin_chat_conversations.admin_id = auth.uid()
  )
);
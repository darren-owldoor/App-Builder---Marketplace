-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.imessage_outgoing CASCADE;
DROP TABLE IF EXISTS public.imessage_incoming CASCADE;
DROP TABLE IF EXISTS public.imessage_secrets CASCADE;

-- Table for outgoing iMessage queue
CREATE TABLE public.imessage_outgoing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  agent_phone TEXT NOT NULL,
  agent_name TEXT,
  content TEXT NOT NULL,
  lead_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Table for incoming iMessages
CREATE TABLE public.imessage_incoming (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  lead_id UUID,
  direction TEXT NOT NULL DEFAULT 'inbound' CHECK (direction IN ('inbound', 'outbound')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for iMessage webhook secrets
CREATE TABLE public.imessage_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  secret_token TEXT NOT NULL,
  device_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.imessage_outgoing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imessage_incoming ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imessage_secrets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for imessage_outgoing
CREATE POLICY "Users can view their own outgoing messages"
  ON public.imessage_outgoing FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own outgoing messages"
  ON public.imessage_outgoing FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own outgoing messages"
  ON public.imessage_outgoing FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for imessage_incoming
CREATE POLICY "Users can view their own incoming messages"
  ON public.imessage_incoming FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert incoming messages"
  ON public.imessage_incoming FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own incoming messages"
  ON public.imessage_incoming FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for imessage_secrets
CREATE POLICY "Users can view their own secrets"
  ON public.imessage_secrets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own secrets"
  ON public.imessage_secrets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own secrets"
  ON public.imessage_secrets FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_imessage_outgoing_user_status ON public.imessage_outgoing(user_id, status);
CREATE INDEX idx_imessage_outgoing_status ON public.imessage_outgoing(status) WHERE status = 'pending';
CREATE INDEX idx_imessage_incoming_phone ON public.imessage_incoming(phone);
CREATE INDEX idx_imessage_incoming_user ON public.imessage_incoming(user_id);
CREATE INDEX idx_imessage_secrets_token ON public.imessage_secrets(secret_token);
-- Create twilio_accounts table to store multiple Twilio credentials
CREATE TABLE public.twilio_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name TEXT NOT NULL,
  account_sid TEXT NOT NULL UNIQUE,
  auth_token TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.twilio_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage Twilio accounts"
  ON public.twilio_accounts
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create phone_numbers table for managing multiple numbers
CREATE TABLE public.phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL UNIQUE,
  twilio_account_id UUID REFERENCES public.twilio_accounts(id) ON DELETE CASCADE,
  friendly_name TEXT,
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('admin', 'staff', 'client', 'specific_account')),
  assigned_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to_client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  capabilities JSONB DEFAULT '{"sms": true, "voice": false, "mms": false}'::jsonb,
  active BOOLEAN DEFAULT true,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage phone numbers"
  ON public.phone_numbers
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view phone numbers"
  ON public.phone_numbers
  FOR SELECT
  USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Clients can view their assigned phone numbers"
  ON public.phone_numbers
  FOR SELECT
  USING (
    assignment_type = 'client' 
    AND EXISTS (
      SELECT 1 FROM clients c 
      WHERE c.id = phone_numbers.assigned_to_client_id 
      AND c.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_phone_numbers_assignment ON public.phone_numbers(assignment_type);
CREATE INDEX idx_phone_numbers_assigned_user ON public.phone_numbers(assigned_to_user_id);
CREATE INDEX idx_phone_numbers_assigned_client ON public.phone_numbers(assigned_to_client_id);
CREATE INDEX idx_twilio_accounts_active ON public.twilio_accounts(active);

-- Create trigger for updated_at
CREATE TRIGGER update_twilio_accounts_updated_at
  BEFORE UPDATE ON public.twilio_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_phone_numbers_updated_at
  BEFORE UPDATE ON public.phone_numbers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.twilio_accounts IS 'Stores multiple Twilio account credentials';
COMMENT ON TABLE public.phone_numbers IS 'Manages phone numbers with flexible assignment options';
COMMENT ON COLUMN public.phone_numbers.assignment_type IS 'admin: for admin use, staff: for staff, client: general client pool, specific_account: assigned to one account';
COMMENT ON COLUMN public.phone_numbers.assigned_to_user_id IS 'User ID when assignment_type is specific_account (for staff/admin)';
COMMENT ON COLUMN public.phone_numbers.assigned_to_client_id IS 'Client ID when assignment_type is specific_account (for client)';
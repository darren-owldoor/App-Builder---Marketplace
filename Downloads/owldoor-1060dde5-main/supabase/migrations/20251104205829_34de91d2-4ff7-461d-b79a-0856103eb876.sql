-- Create credit transactions table for audit trail
CREATE TABLE public.credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  balance_after INTEGER NOT NULL
);

-- Enable RLS
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Admins can manage all credit transactions
CREATE POLICY "Admins can manage all credit transactions"
ON public.credit_transactions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Staff can view all credit transactions
CREATE POLICY "Staff can view all credit transactions"
ON public.credit_transactions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'staff'::app_role));

-- Clients can view their own credit transactions
CREATE POLICY "Clients can view their own credit transactions"
ON public.credit_transactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM clients c
    WHERE c.id = credit_transactions.client_id
    AND c.user_id = auth.uid()
  )
);

-- Create index for better performance
CREATE INDEX idx_credit_transactions_client_id ON public.credit_transactions(client_id);
CREATE INDEX idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);
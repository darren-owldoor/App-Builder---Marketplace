-- Add zapier_webhook and hide_bids columns to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS zapier_webhook TEXT,
ADD COLUMN IF NOT EXISTS hide_bids BOOLEAN DEFAULT false;

-- Create client_reviews table for admin-managed reviews
CREATE TABLE IF NOT EXISTS public.client_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  reviewer_role TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  years_with_team TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_client_reviews_client_id ON public.client_reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_client_reviews_created_at ON public.client_reviews(created_at DESC);

-- Enable RLS
ALTER TABLE public.client_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view reviews (public profiles)
CREATE POLICY "Anyone can view client reviews"
ON public.client_reviews FOR SELECT
USING (true);

-- Policy: Only admins can create reviews
CREATE POLICY "Admins can create client reviews"
ON public.client_reviews FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Only admins can update reviews
CREATE POLICY "Admins can update client reviews"
ON public.client_reviews FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Only admins can delete reviews
CREATE POLICY "Admins can delete client reviews"
ON public.client_reviews FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_client_reviews_updated_at
BEFORE UPDATE ON public.client_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
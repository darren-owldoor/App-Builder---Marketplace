-- Add provider column to client_phone_numbers table
ALTER TABLE public.client_phone_numbers
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'twilio';

-- Add comment to explain the provider field
COMMENT ON COLUMN public.client_phone_numbers.provider IS 'SMS provider: twilio, twilio_backup, or messagebird';
-- Add auto_charge_enabled column to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS auto_charge_enabled BOOLEAN DEFAULT false;

-- Add auto_charged_at column to matches table if it doesn't exist
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS auto_charged_at TIMESTAMP WITH TIME ZONE;

-- Create a function to trigger auto-charge on new matches
CREATE OR REPLACE FUNCTION public.trigger_auto_charge_on_match()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if the match is new and not already purchased
  IF NEW.purchased = false THEN
    -- Call the auto-charge edge function asynchronously using pg_net
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/auto-charge-on-match',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object('record', row_to_json(NEW))
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on matches table
DROP TRIGGER IF EXISTS auto_charge_trigger ON public.matches;
CREATE TRIGGER auto_charge_trigger
  AFTER INSERT ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_auto_charge_on_match();
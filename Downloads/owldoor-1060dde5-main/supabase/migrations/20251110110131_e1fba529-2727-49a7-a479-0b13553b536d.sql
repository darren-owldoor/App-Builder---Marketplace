-- Auto-enrich trigger function
CREATE OR REPLACE FUNCTION public.trigger_auto_enrich()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_supabase_url text;
  v_service_key text;
BEGIN
  -- Only trigger for new pros or significant updates
  IF (TG_OP = 'INSERT') OR 
     (TG_OP = 'UPDATE' AND (
       OLD.email IS DISTINCT FROM NEW.email OR
       OLD.phone IS DISTINCT FROM NEW.phone OR
       OLD.full_name IS DISTINCT FROM NEW.full_name
     )) THEN
    
    -- Get environment variables
    v_supabase_url := current_setting('app.settings.supabase_url', true);
    v_service_key := current_setting('app.settings.service_key', true);
    
    -- Fire and forget HTTP request to edge function
    -- Using pg_net extension if available, otherwise skip
    BEGIN
      PERFORM net.http_post(
        url := v_supabase_url || '/functions/v1/auto-enrich-pro',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || v_service_key
        ),
        body := jsonb_build_object('pro_id', NEW.id)
      );
    EXCEPTION WHEN OTHERS THEN
      -- Silently fail if net extension not available
      NULL;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on pros table
DROP TRIGGER IF EXISTS trigger_auto_enrich_pros ON public.pros;
CREATE TRIGGER trigger_auto_enrich_pros
AFTER INSERT OR UPDATE ON public.pros
FOR EACH ROW
EXECUTE FUNCTION public.trigger_auto_enrich();

-- Add last_enriched_at column to pros if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pros' AND column_name = 'last_enriched_at'
  ) THEN
    ALTER TABLE public.pros ADD COLUMN last_enriched_at timestamp with time zone;
  END IF;
END $$;
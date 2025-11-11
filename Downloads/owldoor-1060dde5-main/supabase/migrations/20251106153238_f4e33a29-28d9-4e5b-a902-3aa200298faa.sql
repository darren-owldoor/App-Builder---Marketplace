-- Create stage history tracking table for pros
CREATE TABLE IF NOT EXISTS public.pro_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id UUID NOT NULL REFERENCES public.pros(id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  is_automatic BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add indexes for performance
CREATE INDEX idx_pro_stage_history_pro_id ON public.pro_stage_history(pro_id);
CREATE INDEX idx_pro_stage_history_created_at ON public.pro_stage_history(created_at DESC);

-- Enable RLS
ALTER TABLE public.pro_stage_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Staff can view all stage history"
  ON public.pro_stage_history
  FOR SELECT
  USING (has_role(auth.uid(), 'staff'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins have full access to stage history"
  ON public.pro_stage_history
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger function to automatically log stage changes
CREATE OR REPLACE FUNCTION public.log_pro_stage_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if stage actually changed
  IF OLD.pipeline_stage IS DISTINCT FROM NEW.pipeline_stage THEN
    INSERT INTO public.pro_stage_history (
      pro_id,
      from_stage,
      to_stage,
      changed_by,
      is_automatic,
      change_reason,
      metadata
    ) VALUES (
      NEW.id,
      OLD.pipeline_stage,
      NEW.pipeline_stage,
      auth.uid(),
      -- Detect if it's automatic (when qualification score changes with stage change)
      CASE 
        WHEN OLD.qualification_score IS DISTINCT FROM NEW.qualification_score THEN true
        WHEN OLD.motivation IS DISTINCT FROM NEW.motivation THEN true
        WHEN OLD.wants IS DISTINCT FROM NEW.wants THEN true
        ELSE false
      END,
      CASE
        WHEN OLD.qualification_score IS DISTINCT FROM NEW.qualification_score 
          THEN 'Qualification score changed from ' || COALESCE(OLD.qualification_score::text, 'null') || ' to ' || COALESCE(NEW.qualification_score::text, 'null')
        WHEN OLD.motivation IS DISTINCT FROM NEW.motivation 
          THEN 'Motivation changed from ' || COALESCE(OLD.motivation::text, 'null') || ' to ' || COALESCE(NEW.motivation::text, 'null')
        WHEN OLD.wants IS DISTINCT FROM NEW.wants 
          THEN 'Wants field updated'
        ELSE 'Manual stage change'
      END,
      jsonb_build_object(
        'old_qualification_score', OLD.qualification_score,
        'new_qualification_score', NEW.qualification_score,
        'old_motivation', OLD.motivation,
        'new_motivation', NEW.motivation
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on pros table to log stage changes
DROP TRIGGER IF EXISTS trigger_log_pro_stage_change ON public.pros;
CREATE TRIGGER trigger_log_pro_stage_change
  AFTER UPDATE ON public.pros
  FOR EACH ROW
  WHEN (OLD.pipeline_stage IS DISTINCT FROM NEW.pipeline_stage)
  EXECUTE FUNCTION public.log_pro_stage_change();
-- Create SMS templates table
CREATE TABLE IF NOT EXISTS public.sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  template_key TEXT NOT NULL UNIQUE,
  message_content TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'transactional',
  active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for SMS templates
CREATE POLICY "Admins can manage SMS templates"
ON public.sms_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view SMS templates"
ON public.sms_templates
FOR SELECT
USING (has_role(auth.uid(), 'staff'::app_role));

-- Insert default SMS templates
INSERT INTO public.sms_templates (template_name, template_key, message_content, description, category) VALUES
('Lead Welcome', 'lead_welcome', 'Welcome to OwlDoor! We''re excited to help you find the perfect brokerage opportunity. Reply STOP to opt out.', 'Initial welcome message for new leads', 'onboarding'),
('Client Welcome', 'client_welcome', 'Welcome to OwlDoor! Start finding quality real estate agents for your team today. Reply STOP to opt out.', 'Welcome message for new clients', 'onboarding'),
('New Match - Lead', 'lead_new_match', 'Great news! We found a brokerage that matches your profile. Check your email for details. Reply STOP to opt out.', 'Notification when a lead gets matched', 'matching'),
('New Match - Client', 'client_new_match', 'New agent match available! {{agent_name}} fits your criteria. Login to view their profile. Reply STOP to opt out.', 'Notification when client gets a new match', 'matching'),
('Appointment Reminder', 'appointment_reminder', 'Reminder: You have an appointment with {{party_name}} tomorrow at {{time}}. Reply STOP to opt out.', 'Appointment reminder', 'transactional'),
('Support Ticket Created', 'support_ticket_created', 'Your support ticket #{{ticket_number}} has been created. We''ll respond within 24 hours. Reply STOP to opt out.', 'Confirmation when support ticket is created', 'support');

-- Add twilio_number field to sms_templates for number selection
ALTER TABLE public.sms_templates 
ADD COLUMN twilio_number TEXT;
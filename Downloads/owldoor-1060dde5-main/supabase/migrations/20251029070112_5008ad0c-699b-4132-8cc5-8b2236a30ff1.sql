-- Create email_templates table for managing transactional emails
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL UNIQUE,
  template_key TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  description TEXT,
  category TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Admin can manage all email templates
CREATE POLICY "Admins can manage email templates"
  ON public.email_templates
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Staff can view templates
CREATE POLICY "Staff can view email templates"
  ON public.email_templates
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'staff'));

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can view their own tickets
CREATE POLICY "Users can view their own tickets"
  ON public.support_tickets
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own tickets
CREATE POLICY "Users can create tickets"
  ON public.support_tickets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Staff can manage all tickets
CREATE POLICY "Staff can manage all tickets"
  ON public.support_tickets
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));

-- Create support_ticket_replies table
CREATE TABLE IF NOT EXISTS public.support_ticket_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_staff_reply BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_ticket_replies ENABLE ROW LEVEL SECURITY;

-- Users can view replies to their tickets
CREATE POLICY "Users can view replies to their tickets"
  ON public.support_ticket_replies
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.support_tickets
    WHERE id = support_ticket_replies.ticket_id
    AND user_id = auth.uid()
  ));

-- Users can reply to their own tickets
CREATE POLICY "Users can reply to their tickets"
  ON public.support_ticket_replies
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.support_tickets
    WHERE id = support_ticket_replies.ticket_id
    AND user_id = auth.uid()
  ));

-- Staff can manage all replies
CREATE POLICY "Staff can manage all replies"
  ON public.support_ticket_replies
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'staff') OR public.has_role(auth.uid(), 'admin'));

-- Insert default email templates
INSERT INTO public.email_templates (template_name, template_key, subject, html_content, text_content, description, category) VALUES
(
  'Welcome - New Lead',
  'lead_welcome',
  'Welcome to OwlDoor - Your Career Journey Starts Here!',
  '<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;"><h1 style="color: white; margin: 0;">Welcome to OwlDoor!</h1></div><div style="padding: 40px 20px;"><h2 style="color: #333;">Hi {{first_name}},</h2><p style="color: #666; line-height: 1.6;">Thank you for joining OwlDoor! We''re excited to help you find your perfect career match in real estate.</p><p style="color: #666; line-height: 1.6;">Our platform uses advanced matching algorithms to connect talented professionals like you with top brokerages and teams.</p><h3 style="color: #667eea;">What happens next?</h3><ul style="color: #666; line-height: 1.8;"><li>Complete your profile to increase match quality</li><li>We''ll analyze your experience and preferences</li><li>You''ll receive notifications when matched with opportunities</li><li>Connect directly with interested brokerages</li></ul><p style="color: #666; line-height: 1.6;">Questions? Just reply to this email - we''re here to help!</p><p style="color: #666; margin-top: 30px;">Best regards,<br><strong>The OwlDoor Team</strong></p></div><div style="background: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 12px;">© 2025 OwlDoor. All rights reserved.</div></body></html>',
  'Hi {{first_name}},\n\nWelcome to OwlDoor! We''re excited to help you find your perfect career match in real estate.\n\nWhat happens next?\n- Complete your profile\n- Get matched with opportunities\n- Connect with brokerages\n\nQuestions? Just reply to this email!\n\nBest,\nThe OwlDoor Team',
  'Sent to new leads when they sign up',
  'onboarding'
),
(
  'Welcome - New Client',
  'client_welcome',
  'Welcome to OwlDoor - Start Finding Top Talent Today!',
  '<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;"><h1 style="color: white; margin: 0;">Welcome to OwlDoor!</h1></div><div style="padding: 40px 20px;"><h2 style="color: #333;">Hi {{contact_name}},</h2><p style="color: #666; line-height: 1.6;">Thank you for joining OwlDoor! We''re thrilled to help {{company_name}} find exceptional real estate talent.</p><p style="color: #666; line-height: 1.6;">Our AI-powered platform matches you with pre-qualified candidates who meet your specific criteria.</p><h3 style="color: #667eea;">Getting Started:</h3><ul style="color: #666; line-height: 1.8;"><li>Set up your hiring preferences</li><li>Define your ideal candidate profile</li><li>Review incoming matches</li><li>Connect directly with qualified professionals</li></ul><p style="color: #666; line-height: 1.6;">Need help? Our team is ready to assist you!</p><p style="color: #666; margin-top: 30px;">Best regards,<br><strong>The OwlDoor Team</strong></p></div><div style="background: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 12px;">© 2025 OwlDoor. All rights reserved.</div></body></html>',
  'Hi {{contact_name}},\n\nWelcome to OwlDoor! We''re thrilled to help {{company_name}} find exceptional real estate talent.\n\nGetting Started:\n- Set up your hiring preferences\n- Define your ideal candidate\n- Review matches\n- Connect with talent\n\nNeed help? We''re here for you!\n\nBest,\nThe OwlDoor Team',
  'Sent to new clients when they sign up',
  'onboarding'
),
(
  'New Match - Lead',
  'lead_new_match',
  'You''ve Got a New Match! 🎯',
  '<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;"><h1 style="color: white; margin: 0;">🎯 New Match!</h1></div><div style="padding: 40px 20px;"><h2 style="color: #333;">Great news, {{first_name}}!</h2><p style="color: #666; line-height: 1.6;">You''ve been matched with <strong>{{company_name}}</strong>, and they''re interested in learning more about you!</p><div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0;"><h3 style="color: #667eea; margin-top: 0;">Match Details</h3><p style="color: #666; margin: 5px 0;"><strong>Company:</strong> {{company_name}}</p><p style="color: #666; margin: 5px 0;"><strong>Location:</strong> {{location}}</p><p style="color: #666; margin: 5px 0;"><strong>Match Score:</strong> {{match_score}}%</p></div><p style="color: #666; line-height: 1.6;">This opportunity aligns well with your experience and career goals. We encourage you to review the details and reach out!</p><div style="text-align: center; margin: 30px 0;"><a href="{{dashboard_url}}" style="background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Match Details</a></div><p style="color: #666; margin-top: 30px;">Best regards,<br><strong>The OwlDoor Team</strong></p></div><div style="background: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 12px;">© 2025 OwlDoor. All rights reserved.</div></body></html>',
  'Great news, {{first_name}}!\n\nYou''ve been matched with {{company_name}}!\n\nMatch Score: {{match_score}}%\nLocation: {{location}}\n\nView your match: {{dashboard_url}}\n\nBest,\nThe OwlDoor Team',
  'Sent to leads when they get a new match',
  'matching'
),
(
  'New Match - Client',
  'client_new_match',
  'New Candidate Match Available! 🎯',
  '<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;"><h1 style="color: white; margin: 0;">🎯 New Candidate Match!</h1></div><div style="padding: 40px 20px;"><h2 style="color: #333;">Hello {{contact_name}},</h2><p style="color: #666; line-height: 1.6;">We''ve found a highly qualified candidate that matches your hiring criteria!</p><div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0;"><h3 style="color: #667eea; margin-top: 0;">Candidate Highlights</h3><p style="color: #666; margin: 5px 0;"><strong>Name:</strong> {{candidate_name}}</p><p style="color: #666; margin: 5px 0;"><strong>Experience:</strong> {{years_experience}} years</p><p style="color: #666; margin: 5px 0;"><strong>Total Sales:</strong> ${{total_sales}}</p><p style="color: #666; margin: 5px 0;"><strong>Match Score:</strong> {{match_score}}%</p></div><p style="color: #666; line-height: 1.6;">This candidate meets {{match_criteria}} of your key requirements. Review their full profile and reach out to schedule an interview!</p><div style="text-align: center; margin: 30px 0;"><a href="{{dashboard_url}}" style="background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Candidate Profile</a></div><p style="color: #666; margin-top: 30px;">Best regards,<br><strong>The OwlDoor Team</strong></p></div><div style="background: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 12px;">© 2025 OwlDoor. All rights reserved.</div></body></html>',
  'Hello {{contact_name}},\n\nNew candidate match available!\n\nCandidate: {{candidate_name}}\nExperience: {{years_experience}} years\nMatch Score: {{match_score}}%\n\nView profile: {{dashboard_url}}\n\nBest,\nThe OwlDoor Team',
  'Sent to clients when they get a new candidate match',
  'matching'
),
(
  'Payment Receipt',
  'payment_receipt',
  'Payment Receipt - OwlDoor',
  '<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;"><h1 style="color: white; margin: 0;">Payment Receipt</h1></div><div style="padding: 40px 20px;"><h2 style="color: #333;">Thank you for your payment!</h2><p style="color: #666; line-height: 1.6;">Hi {{customer_name}},</p><p style="color: #666; line-height: 1.6;">We''ve received your payment. Here are the details:</p><div style="background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 5px; padding: 20px; margin: 20px 0;"><table style="width: 100%; border-collapse: collapse;"><tr><td style="padding: 10px 0; color: #666;"><strong>Transaction ID:</strong></td><td style="padding: 10px 0; color: #666; text-align: right;">{{transaction_id}}</td></tr><tr><td style="padding: 10px 0; color: #666; border-top: 1px solid #dee2e6;"><strong>Date:</strong></td><td style="padding: 10px 0; color: #666; text-align: right; border-top: 1px solid #dee2e6;">{{transaction_date}}</td></tr><tr><td style="padding: 10px 0; color: #666; border-top: 1px solid #dee2e6;"><strong>Description:</strong></td><td style="padding: 10px 0; color: #666; text-align: right; border-top: 1px solid #dee2e6;">{{description}}</td></tr><tr><td style="padding: 10px 0; color: #666; border-top: 1px solid #dee2e6;"><strong>Amount:</strong></td><td style="padding: 10px 0; color: #667eea; text-align: right; border-top: 1px solid #dee2e6; font-size: 20px; font-weight: bold;">${{amount}}</td></tr></table></div><p style="color: #666; line-height: 1.6;">If you have any questions about this payment, please contact our support team.</p><p style="color: #666; margin-top: 30px;">Best regards,<br><strong>The OwlDoor Team</strong></p></div><div style="background: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 12px;">© 2025 OwlDoor. All rights reserved.</div></body></html>',
  'Payment Receipt\n\nTransaction ID: {{transaction_id}}\nDate: {{transaction_date}}\nDescription: {{description}}\nAmount: ${{amount}}\n\nThank you for your payment!\n\nThe OwlDoor Team',
  'Sent when a payment is processed',
  'transactions'
),
(
  'Support Ticket Confirmation',
  'support_ticket_created',
  'Support Ticket #{{ticket_number}} - We''re on it!',
  '<html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;"><h1 style="color: white; margin: 0;">Support Ticket Created</h1></div><div style="padding: 40px 20px;"><h2 style="color: #333;">Hi {{user_name}},</h2><p style="color: #666; line-height: 1.6;">We''ve received your support request and our team is on it!</p><div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0;"><h3 style="color: #667eea; margin-top: 0;">Ticket Details</h3><p style="color: #666; margin: 5px 0;"><strong>Ticket #:</strong> {{ticket_number}}</p><p style="color: #666; margin: 5px 0;"><strong>Subject:</strong> {{subject}}</p><p style="color: #666; margin: 5px 0;"><strong>Category:</strong> {{category}}</p><p style="color: #666; margin: 5px 0;"><strong>Priority:</strong> {{priority}}</p></div><p style="color: #666; line-height: 1.6;"><strong>Your Message:</strong></p><div style="background: #fff; border: 1px solid #dee2e6; border-radius: 5px; padding: 15px; margin: 10px 0;"><p style="color: #666; line-height: 1.6; margin: 0;">{{message}}</p></div><p style="color: #666; line-height: 1.6; margin-top: 20px;">We typically respond within 24 hours. You''ll receive an email when we update your ticket.</p><div style="text-align: center; margin: 30px 0;"><a href="{{ticket_url}}" style="background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Ticket</a></div><p style="color: #666; margin-top: 30px;">Best regards,<br><strong>The OwlDoor Support Team</strong></p></div><div style="background: #f5f5f5; padding: 20px; text-align: center; color: #999; font-size: 12px;">© 2025 OwlDoor. All rights reserved.</div></body></html>',
  'Support Ticket Created\n\nTicket #: {{ticket_number}}\nSubject: {{subject}}\nCategory: {{category}}\n\nYour Message:\n{{message}}\n\nWe''ll respond within 24 hours.\n\nView ticket: {{ticket_url}}\n\nThe OwlDoor Support Team',
  'Sent when a support ticket is created',
  'support'
);

-- Create indexes for better performance
CREATE INDEX idx_email_templates_template_key ON public.email_templates(template_key);
CREATE INDEX idx_email_templates_category ON public.email_templates(category);
CREATE INDEX idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_ticket_number ON public.support_tickets(ticket_number);
CREATE INDEX idx_support_ticket_replies_ticket_id ON public.support_ticket_replies(ticket_id);

-- Create function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'TKT-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestEmailRequest {
  to: string;
  templateId: string;
  sampleData?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { to, templateId, sampleData = {} }: TestEmailRequest = await req.json();

    if (!to || !templateId) {
      throw new Error('Missing required fields: to, templateId');
    }

    // Fetch template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      throw new Error('Template not found');
    }

    // Replace template variables with sample data
    let htmlContent = template.html_content;
    let subject = template.subject;

    // Default sample data
    const defaultData = {
      user_name: 'John Doe',
      ticket_number: 'TKT-123456',
      subject: 'Sample Support Request',
      category: 'Technical',
      priority: 'High',
      message: 'This is a sample support ticket message for testing purposes.',
      company_name: 'OwlDoor',
      ...sampleData
    };

    // Replace all {{variable}} patterns
    Object.entries(defaultData).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      htmlContent = htmlContent.replace(regex, String(value));
      subject = subject.replace(regex, String(value));
    });

    // Send via SendGrid
    const { error: sendError } = await supabase.functions.invoke('send-email-sendgrid', {
      body: {
        to,
        subject: `[TEST] ${subject}`,
        html: htmlContent,
      }
    });

    if (sendError) throw sendError;

    return new Response(
      JSON.stringify({ success: true, message: 'Test email sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error sending test email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
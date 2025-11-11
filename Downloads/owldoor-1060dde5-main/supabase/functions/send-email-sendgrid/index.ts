import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  context?: 'admin' | 'client';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { to, subject, html, text, context }: EmailRequest = await req.json();

    if (!to || !subject || (!html && !text)) {
      throw new Error('Missing required fields: to, subject, and html or text');
    }

    // Get SendGrid configuration with context filter
    const query = supabase
      .from('email_configs')
      .select('*')
      .eq('provider', 'sendgrid')
      .eq('is_configured', true);
    
    if (context === 'admin') {
      query.eq('use_for_admin', true);
    } else if (context === 'client') {
      query.eq('use_for_clients', true);
    }

    const { data: config, error: configError } = await query.maybeSingle();

    if (configError) {
      console.error('Error fetching email config:', configError);
    }

    // Try to get API key from database config first, then fall back to environment variable
    const dbApiKey = config?.config?.api_key_encrypted;
    const envApiKey = Deno.env.get('SENDGRID_API_KEY');
    const apiKey = dbApiKey || envApiKey;

    if (!apiKey) {
      console.error('SendGrid API key not found in config or secrets');
      throw new Error('SendGrid API key not configured. Please add SENDGRID_API_KEY secret or configure SendGrid in Admin Integrations.');
    }

    // Use configured email or default to a sensible value
    const fromEmail = config?.config?.from_email || 'noreply@owldoor.com';
    const fromName = config?.config?.from_name || 'OwlDoor';
    
    console.log('SendGrid config status:', {
      hasDbConfig: !!config,
      usingDbKey: !!dbApiKey,
      usingEnvKey: !dbApiKey && !!envApiKey,
      context
    });

    console.log('Sending email via SendGrid:', { 
      to: to.substring(0, 5) + '***', 
      from: fromEmail, 
      hasApiKey: !!apiKey,
      subject: subject.substring(0, 30) + '...'
    });

    // Send email via SendGrid API
    const sendGridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: to }],
        }],
        from: {
          email: fromEmail,
          name: fromName,
        },
        subject,
        content: [
          html ? { type: 'text/html', value: html } : { type: 'text/plain', value: text || '' }
        ],
      }),
    });

    if (!sendGridResponse.ok) {
      const errorText = await sendGridResponse.text();
      console.error('SendGrid API error:', errorText);
      throw new Error(`SendGrid error: ${sendGridResponse.status} - ${errorText}`);
    }

    // Log the email
    await supabase
      .from('email_logs')
      .insert({
        to_email: to,
        subject,
        status: 'sent',
        provider: 'sendgrid',
        user_id: user.id,
      });

    console.log(`Email sent successfully to ${to}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

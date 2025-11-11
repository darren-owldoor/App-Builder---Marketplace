import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, phone, method } = await req.json();

    if (!email) {
      throw new Error('Email is required');
    }

    if (method === 'sms' && !phone) {
      throw new Error('Phone number is required for SMS reset');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Generate password reset link with proper redirect
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${req.headers.get('origin') || 'https://owldoor.com'}/set-new-password`
      }
    });

    if (error) {
      console.error('Error generating reset link:', error);
      throw new Error('Failed to generate password reset link');
    }

    console.log('Generated reset link for:', email);
    const magicLink = data.properties.action_link;

    // Send based on method preference
    if (method === 'sms' && phone) {
      // Send SMS only
      const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
      const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

      if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
        throw new Error('SMS provider not configured');
      }

      const formattedPhone = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;
      const smsBody = `Your OwlDoor password reset link: ${magicLink}\n\nThis link expires in 1 hour.`;
      
      const twilioResponse = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: formattedPhone,
            From: twilioPhoneNumber,
            Body: smsBody,
          }),
        }
      );

      if (!twilioResponse.ok) {
        const errorText = await twilioResponse.text();
        console.error('Failed to send SMS:', errorText);
        throw new Error('Failed to send SMS');
      }

      console.log('SMS sent successfully to:', phone);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Password reset link sent via SMS' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Send email via SendGrid (default or explicit email method)
    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY');
    
    if (!sendGridApiKey) {
      throw new Error('SendGrid API key not configured');
    }

    const sendGridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendGridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email }],
          subject: 'Reset Your Password - OwlDoor',
        }],
        from: {
          email: 'noreply@owldoor.com',
          name: 'OwlDoor'
        },
        content: [{
          type: 'text/html',
          value: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">Password Reset Request</h1>
              </div>
              <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px;">Hello,</p>
                <p style="font-size: 16px;">We received a request to reset your password for your OwlDoor account.</p>
                <p style="font-size: 16px;">Click the button below to reset your password:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${magicLink}" 
                     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white; 
                            padding: 15px 30px; 
                            text-decoration: none; 
                            border-radius: 5px; 
                            display: inline-block;
                            font-weight: bold;">
                    Reset Password
                  </a>
                </div>
                <p style="font-size: 14px; color: #666;">If you didn't request this password reset, you can safely ignore this email.</p>
                <p style="font-size: 14px; color: #666;">This link will expire in 1 hour for security reasons.</p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                <p style="font-size: 12px; color: #999; text-align: center;">
                  © ${new Date().getFullYear()} OwlDoor. All rights reserved.<br>
                  Connecting Real Estate Agents with Top Brokerages
                </p>
              </div>
            </body>
            </html>
          `
        }]
      })
    });

    if (!sendGridResponse.ok) {
      const errorText = await sendGridResponse.text();
      console.error('SendGrid error:', errorText);
      throw new Error('Failed to send email');
    }

    console.log('Password reset email sent successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Password reset link sent via email' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in send-password-reset:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    
    // Log detailed error for monitoring  
    console.error('Full error details:', {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
      function: 'send-password-reset'
    });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

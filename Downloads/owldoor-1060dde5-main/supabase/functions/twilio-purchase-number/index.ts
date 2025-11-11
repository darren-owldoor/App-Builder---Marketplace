import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { phoneNumber, clientId } = await req.json();

    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }

    // Twilio credentials
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }

    const basicAuth = btoa(`${accountSid}:${authToken}`);
    
    // Webhook URL for incoming SMS and calls
    const webhookUrl = `${supabaseUrl}/functions/v1/twilio-webhook`;
    
    console.log('Purchasing phone number:', phoneNumber);

    // Purchase the phone number with webhook configuration
    const purchaseUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json`;
    
    const purchaseData = new URLSearchParams({
      PhoneNumber: phoneNumber,
      SmsUrl: webhookUrl,
      SmsMethod: 'POST',
      VoiceUrl: webhookUrl,
      VoiceMethod: 'POST',
      StatusCallback: webhookUrl,
      StatusCallbackMethod: 'POST',
      FriendlyName: clientId ? `Client ${clientId}` : 'Owldoor Number',
    });

    const response = await fetch(purchaseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: purchaseData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twilio purchase error:', errorText);
      throw new Error(`Failed to purchase phone number: ${response.status}`);
    }

    const result = await response.json();

    console.log('Phone number purchased successfully:', phoneNumber, 'SID:', result.sid);

    return new Response(
      JSON.stringify({
        success: true,
        phoneNumber,
        sid: result.sid,
        webhookUrl,
        message: 'Phone number purchased and configured',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error purchasing phone number:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An error occurred',
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }

    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!twilioAccountSid || !twilioAuthToken) {
      throw new Error('Twilio credentials not configured');
    }

    // Webhook URL for incoming SMS and calls
    const webhookUrl = `${supabaseUrl}/functions/v1/twilio-webhook`;

    // Get phone number SID from Twilio
    const searchUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(phoneNumber)}`;
    
    const searchResponse = await fetch(searchUrl, {
      headers: {
        'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
      },
    });

    if (!searchResponse.ok) {
      throw new Error('Failed to find phone number in Twilio');
    }

    const searchData = await searchResponse.json();
    
    if (!searchData.incoming_phone_numbers || searchData.incoming_phone_numbers.length === 0) {
      throw new Error('Phone number not found in your Twilio account');
    }

    const phoneSid = searchData.incoming_phone_numbers[0].sid;

    // Update phone number with webhook URLs
    const updateUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/IncomingPhoneNumbers/${phoneSid}.json`;
    
    const updateData = new URLSearchParams({
      SmsUrl: webhookUrl,
      SmsMethod: 'POST',
      VoiceUrl: webhookUrl,
      VoiceMethod: 'POST',
      StatusCallback: webhookUrl,
      StatusCallbackMethod: 'POST',
    });

    const updateResponse = await fetch(updateUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: updateData.toString(),
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Twilio update error:', errorText);
      throw new Error('Failed to configure phone number webhooks');
    }

    const result = await updateResponse.json();

    console.log('Phone number configured successfully:', phoneNumber);

    return new Response(
      JSON.stringify({
        success: true,
        phoneNumber,
        webhookUrl,
        message: 'Phone number configured for incoming SMS and calls',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error configuring phone number:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
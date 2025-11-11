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

    const { areaCode } = await req.json();

    if (!areaCode) {
      throw new Error('Area code is required');
    }

    // Twilio credentials
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }

    const basicAuth = btoa(`${accountSid}:${authToken}`);
    
    // Search for available phone numbers
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/AvailablePhoneNumbers/US/Local.json?AreaCode=${areaCode}&Limit=10`;
    
    console.log('Searching Twilio for numbers with area code:', areaCode);

    const response = await fetch(twilioUrl, {
      headers: {
        'Authorization': `Basic ${basicAuth}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twilio API error:', errorText);
      throw new Error(`Twilio API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform Twilio response to our format
    const phoneNumbers = data.available_phone_numbers?.map((number: any) => ({
      phoneNumber: number.phone_number,
      friendlyName: number.friendly_name,
      locality: number.locality,
      region: number.region,
      postalCode: number.postal_code,
      capabilities: number.capabilities,
    })) || [];

    console.log(`Found ${phoneNumbers.length} available numbers`);

    return new Response(
      JSON.stringify({ success: true, phoneNumbers }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error searching Twilio numbers:', error);
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

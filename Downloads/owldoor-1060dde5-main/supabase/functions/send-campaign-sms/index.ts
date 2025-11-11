import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendSMSRequest {
  to: string | string[]; // Support single or multiple recipients
  message: string;
  assignmentId: string;
  stepId: string;
  twilioAccountId?: string;
  phoneNumber?: string;
}

const sendTwilioSMS = async (
  to: string | string[], 
  from: string, 
  body: string, 
  accountSid: string, 
  authToken: string,
  isGroupMessage: boolean = false
) => {
  const auth = btoa(`${accountSid}:${authToken}`);
  
  // Format phone numbers
  const formatPhone = (phone: string) => phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;
  
  // For group messaging with toll-free numbers
  if (isGroupMessage && Array.isArray(to)) {
    // Use Twilio Messaging Service for group texting
    const formattedRecipients = to.map(formatPhone);
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: formattedRecipients.join(','), // Multiple recipients comma-separated
          From: from,
          Body: body,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Twilio API error: ${error}`);
    }

    return await response.json();
  }
  
  // Single recipient message
  const formattedTo = Array.isArray(to) ? formatPhone(to[0]) : formatPhone(to);
  
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: formattedTo,
        From: from,
        Body: body,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Twilio API error: ${error}`);
  }

  return await response.json();
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { to, message, assignmentId, stepId, twilioAccountId, phoneNumber }: SendSMSRequest = await req.json();
    
    // Get Twilio credentials from specified account or use default
    let accountSid: string;
    let authToken: string;
    let twilioPhoneNumber: string;

    if (twilioAccountId && phoneNumber) {
      // Fetch credentials for specific account
      const { data: account, error: accountError } = await supabase
        .from('twilio_accounts')
        .select('account_sid, auth_token')
        .eq('id', twilioAccountId)
        .single();

      if (accountError || !account) {
        throw new Error('Twilio account not found');
      }

      accountSid = account.account_sid;
      authToken = account.auth_token;
      twilioPhoneNumber = phoneNumber;
    } else {
      // Use default credentials
      accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')!;
      authToken = Deno.env.get('TWILIO_AUTH_TOKEN')!;
      twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER')!;
    }

    console.log('Sending SMS:', { to, assignmentId, stepId, from: twilioPhoneNumber });

    // Check if this is a group message
    const isGroupMessage = Array.isArray(to) && to.length > 1;

    // Send SMS via Twilio
    const twilioResponse = await sendTwilioSMS(
      to, 
      twilioPhoneNumber, 
      message,
      accountSid,
      authToken,
      isGroupMessage
    );

    console.log('Twilio response:', twilioResponse);

    // Log the campaign activity
    const { error: logError } = await supabase
      .from('campaign_logs')
      .insert({
        assignment_id: assignmentId,
        step_id: stepId,
        type: 'sms',
        status: 'sent',
        sent_at: new Date().toISOString(),
      });

    if (logError) {
      console.error('Error logging campaign activity:', logError);
      throw logError;
    }

    return new Response(
      JSON.stringify({ success: true, twilioSid: twilioResponse.sid }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in send-campaign-sms:', error);
    
    // Try to log the error if we have the necessary info
    try {
      const { assignmentId, stepId } = await req.json();
      if (assignmentId && stepId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        await supabase.from('campaign_logs').insert({
          assignment_id: assignmentId,
          step_id: stepId,
          type: 'sms',
          status: 'failed',
          error_message: error.message,
          sent_at: new Date().toISOString(),
        });
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

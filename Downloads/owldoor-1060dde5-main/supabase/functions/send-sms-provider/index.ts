import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Formats a phone number to E.164 format for Twilio (+1XXXXXXXXXX)
 */
function formatPhoneForTwilio(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (phone.startsWith('+1') && digits.length === 11) return phone;
  return phone;
}

interface SMSRequest {
  provider_type?: string;
  to: string | string[]; // Support single or multiple recipients for group messaging
  message: string;
  lead_id?: string;
  campaign_id?: string;
  context?: 'admin' | 'client';
  from_number?: string; // Optional specific phone number to use
  twilio_account_id?: string; // Optional specific Twilio account
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user from the auth header
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    const { provider_type, to, message, lead_id, campaign_id, context, from_number, twilio_account_id }: SMSRequest = await req.json();

    console.log('SMS Request:', { 
      provider_type, 
      to: Array.isArray(to) ? `${to.length} recipients` : to.substring(0, 5) + '***', 
      context,
      isGroupMessage: Array.isArray(to)
    });

    // Validate credentials exist for available providers
    const twilioSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');
    const twilioBackupSid = Deno.env.get('TWILIO_BACKUP_ACCOUNT_SID');
    const twilioBackupToken = Deno.env.get('TWILIO_BACKUP_AUTH_TOKEN');
    const twilioBackupPhone = Deno.env.get('TWILIO_BACKUP_PHONE_NUMBER');
    const messagebirdKey = Deno.env.get('MESSAGEBIRD_API_KEY');
    const messagebirdOriginator = Deno.env.get('MESSAGEBIRD_ORIGINATOR');

    const hasMainTwilio = !!(twilioSid && twilioToken && twilioPhone);
    const hasBackupTwilio = !!(twilioBackupSid && twilioBackupToken && twilioBackupPhone);
    const hasMessagebird = !!(messagebirdKey && messagebirdOriginator);

    // If no provider specified, get the default active provider for this context
    let selectedProvider = provider_type;
    if (!selectedProvider) {
      const query = supabase
        .from('sms_provider_configs')
        .select('provider_type')
        .eq('is_active', true);
      
      // Filter by context if provided
      if (context === 'admin') {
        query.eq('use_for_admin', true);
      } else if (context === 'client') {
        query.eq('use_for_clients', true);
      }
      
      // Get default provider first, or any active provider
      const { data: defaultProvider } = await query
        .eq('is_default', true)
        .maybeSingle();
      
      if (defaultProvider) {
        selectedProvider = defaultProvider.provider_type;
      } else {
        // If no default, get any active provider for this context
        const { data: anyProvider } = await query
          .order('priority', { ascending: true })
          .limit(1)
          .maybeSingle();
        
        selectedProvider = anyProvider?.provider_type || 'twilio_primary';
      }
    }

    // Validate selected provider has credentials, fall back if not
    if (selectedProvider === 'twilio_primary' && !hasMainTwilio) {
      console.warn('Primary Twilio not configured, trying backup');
      if (hasBackupTwilio) {
        selectedProvider = 'twilio_backup';
      } else if (hasMessagebird) {
        selectedProvider = 'messagebird';
      } else {
        throw new Error('No SMS provider is configured. Please configure Twilio or MessageBird credentials.');
      }
    }
    
    if (selectedProvider === 'twilio_backup' && !hasBackupTwilio) {
      console.warn('Backup Twilio not configured, trying primary');
      if (hasMainTwilio) {
        selectedProvider = 'twilio_primary';
      } else if (hasMessagebird) {
        selectedProvider = 'messagebird';
      } else {
        throw new Error('No SMS provider is configured. Please configure Twilio or MessageBird credentials.');
      }
    }
    
    if (selectedProvider === 'messagebird' && !hasMessagebird) {
      console.warn('MessageBird not configured, trying Twilio');
      if (hasMainTwilio) {
        selectedProvider = 'twilio_primary';
      } else if (hasBackupTwilio) {
        selectedProvider = 'twilio_backup';
      } else {
        throw new Error('No SMS provider is configured. Please configure Twilio or MessageBird credentials.');
      }
    }

    console.log('Using provider:', selectedProvider);

    let result;
    let fromNumber;

    // Send via appropriate provider
    switch (selectedProvider) {
      case 'twilio_primary':
        result = await sendViaTwilioPrimary(to, message, from_number, twilio_account_id);
        fromNumber = from_number || Deno.env.get('TWILIO_PHONE_NUMBER');
        break;
      
      case 'twilio_backup':
        result = await sendViaTwilioBackup(to, message, from_number);
        fromNumber = from_number || Deno.env.get('TWILIO_BACKUP_PHONE_NUMBER');
        break;
      
      case 'messagebird':
        result = await sendViaMessageBird(to, message);
        fromNumber = Deno.env.get('MESSAGEBIRD_ORIGINATOR');
        break;
      
      default:
        throw new Error(`Unknown provider type: ${selectedProvider}`);
    }

    // Log the SMS
    const toNumber = Array.isArray(to) ? to.join(',') : to;
    await supabase.from('sms_logs').insert({
      provider_type: selectedProvider,
      provider_name: getProviderName(selectedProvider),
      to_number: toNumber,
      from_number: fromNumber,
      message_body: message,
      status: result.success ? 'sent' : 'failed',
      external_id: result.messageId,
      error_message: result.error,
      metadata: {
        lead_id,
        campaign_id,
        is_group_message: Array.isArray(to) && to.length > 1,
        recipient_count: Array.isArray(to) ? to.length : 1,
      },
      sent_by: userId,
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to send SMS');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.messageId,
        provider: selectedProvider 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error sending SMS:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});

async function sendViaTwilioPrimary(
  to: string | string[], 
  message: string, 
  from_number?: string,
  account_id?: string
) {
  let accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  let authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  let fromNumber = from_number || Deno.env.get('TWILIO_PHONE_NUMBER');

  // If specific account ID provided, fetch those credentials
  if (account_id) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: account, error } = await supabase
      .from('twilio_accounts')
      .select('account_sid, auth_token')
      .eq('id', account_id)
      .single();

    if (!error && account) {
      accountSid = account.account_sid;
      authToken = account.auth_token;
    }
  }

  if (!accountSid || !authToken || !fromNumber) {
    return { success: false, error: 'Twilio primary credentials not configured' };
  }

  // Format phone numbers to E.164 format
  fromNumber = formatPhoneForTwilio(fromNumber);
  
  // Handle group messaging
  if (Array.isArray(to) && to.length > 1) {
    return await sendGroupSMS(accountSid, authToken, fromNumber, to, message);
  }

  // Single recipient
  const formattedTo = formatPhoneForTwilio(Array.isArray(to) ? to[0] : to);

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: formattedTo,
          From: fromNumber,
          Body: message,
        }),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.message || 'Twilio API error' };
    }

    return { success: true, messageId: data.sid };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function sendGroupSMS(
  accountSid: string,
  authToken: string,
  fromNumber: string,
  recipients: string[],
  message: string
) {
  // Send individual messages for group messaging (Twilio doesn't support multi-recipient directly for toll-free)
  const results = [];
  
  for (const recipient of recipients) {
    const formattedTo = formatPhoneForTwilio(recipient);
    
    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: formattedTo,
            From: fromNumber,
            Body: message,
          }),
        }
      );

      const data = await response.json();
      results.push({ recipient, success: response.ok, sid: data.sid });
    } catch (error: any) {
      results.push({ recipient, success: false, error: error.message });
    }
  }

  const allSuccess = results.every(r => r.success);
  const errorMessages = results.filter(r => !r.success).map(r => r.error).join('; ');
  return { 
    success: allSuccess, 
    messageId: results.map(r => r.sid).filter(Boolean).join(','),
    error: allSuccess ? undefined : errorMessages,
    groupResults: results
  };
}

async function sendViaTwilioBackup(to: string | string[], message: string, from_number?: string) {
  const accountSid = Deno.env.get('TWILIO_BACKUP_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_BACKUP_AUTH_TOKEN');
  let fromNumber = from_number || Deno.env.get('TWILIO_BACKUP_PHONE_NUMBER');

  if (!accountSid || !authToken || !fromNumber) {
    return { success: false, error: 'Twilio backup credentials not configured' };
  }

  // Format phone numbers to E.164 format
  fromNumber = formatPhoneForTwilio(fromNumber);
  
  // Handle group messaging
  if (Array.isArray(to) && to.length > 1) {
    return await sendGroupSMS(accountSid, authToken, fromNumber, to, message);
  }

  const formattedTo = formatPhoneForTwilio(Array.isArray(to) ? to[0] : to);

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: formattedTo,
          From: fromNumber,
          Body: message,
        }),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.message || 'Twilio backup API error' };
    }

    return { success: true, messageId: data.sid };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

async function sendViaMessageBird(to: string | string[], message: string) {
  const apiKey = Deno.env.get('MESSAGEBIRD_API_KEY');
  const originator = Deno.env.get('MESSAGEBIRD_ORIGINATOR');

  if (!apiKey || !originator) {
    return { success: false, error: 'MessageBird credentials not configured' };
  }

  // MessageBird supports multiple recipients natively
  const recipients = Array.isArray(to) ? to : [to];

  try {
    const response = await fetch('https://rest.messagebird.com/messages', {
      method: 'POST',
      headers: {
        'Authorization': `AccessKey ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        originator: originator,
        recipients,
        body: message,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { 
        success: false, 
        error: data.errors?.[0]?.description || 'MessageBird API error' 
      };
    }

    return { success: true, messageId: data.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

function getProviderName(providerType: string): string {
  const names: Record<string, string> = {
    'twilio_primary': 'Twilio Primary',
    'twilio_backup': 'Twilio Backup',
    'messagebird': 'MessageBird',
  };
  return names[providerType] || providerType;
}

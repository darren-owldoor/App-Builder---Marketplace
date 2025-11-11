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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roles || roles.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const { action, data } = await req.json();

    const twilioAccountSid = data.twilioAccount === 'backup' 
      ? Deno.env.get('TWILIO_BACKUP_ACCOUNT_SID')
      : Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = data.twilioAccount === 'backup'
      ? Deno.env.get('TWILIO_BACKUP_AUTH_TOKEN')
      : Deno.env.get('TWILIO_AUTH_TOKEN');

    if (!twilioAccountSid || !twilioAuthToken) {
      throw new Error('Twilio credentials not configured');
    }

    const authString = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
    const baseUrl = `https://messaging.twilio.com/v1/a2p/BrandRegistrations/${twilioAccountSid}/TollfreeVerifications`;

    if (action === 'create') {
      // Create new toll-free verification
      const formData = new URLSearchParams();
      formData.append('BusinessName', data.businessName);
      formData.append('BusinessWebsite', data.businessWebsite);
      formData.append('BusinessStreetAddress', data.businessAddress.street);
      formData.append('BusinessStreetAddress2', data.businessAddress.street2 || '');
      formData.append('BusinessCity', data.businessAddress.city);
      formData.append('BusinessStateProvinceRegion', data.businessAddress.state);
      formData.append('BusinessPostalCode', data.businessAddress.postalCode);
      formData.append('BusinessCountry', data.businessAddress.country);
      formData.append('UseCaseCategories', data.useCaseCategories.join(','));
      formData.append('UseCaseSummary', data.useCaseSummary);
      formData.append('ProductionMessageSample', data.messageSamples.join('\n\n'));
      formData.append('OptInWorkflowDescription', data.optInWorkflow);
      formData.append('OptOutWorkflowDescription', data.optOutWorkflow);
      formData.append('MessageVolume', data.messageVolume);
      formData.append('TollfreePhoneNumberSid', data.phoneNumberSid);

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create verification');
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update') {
      // Update existing toll-free verification
      const { sid, ...updateData } = data;
      const formData = new URLSearchParams();
      
      if (updateData.businessName) formData.append('BusinessName', updateData.businessName);
      if (updateData.businessWebsite) formData.append('BusinessWebsite', updateData.businessWebsite);
      if (updateData.businessAddress) {
        formData.append('BusinessStreetAddress', updateData.businessAddress.street);
        formData.append('BusinessCity', updateData.businessAddress.city);
        formData.append('BusinessStateProvinceRegion', updateData.businessAddress.state);
        formData.append('BusinessPostalCode', updateData.businessAddress.postalCode);
      }
      if (updateData.useCaseSummary) formData.append('UseCaseSummary', updateData.useCaseSummary);
      if (updateData.messageSamples) formData.append('ProductionMessageSample', updateData.messageSamples.join('\n\n'));
      if (updateData.optInWorkflow) formData.append('OptInWorkflowDescription', updateData.optInWorkflow);
      if (updateData.optOutWorkflow) formData.append('OptOutWorkflowDescription', updateData.optOutWorkflow);

      const response = await fetch(`${baseUrl}/${sid}`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update verification');
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'list') {
      // List all toll-free verifications
      const response = await fetch(baseUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${authString}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to list verifications');
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get') {
      // Get specific toll-free verification
      const response = await fetch(`${baseUrl}/${data.sid}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${authString}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to get verification');
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

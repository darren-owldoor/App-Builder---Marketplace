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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin');

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, phoneNumber } = await req.json();

    switch (action) {
      case 'list':
        const { data: numbers, error: listError } = await supabase
          .from('phone_numbers')
          .select(`
            *,
            twilio_accounts!inner(account_name, account_sid),
            clients(company_name, contact_name),
            profiles!phone_numbers_assigned_to_user_id_fkey(full_name)
          `)
          .order('created_at', { ascending: false });

        if (listError) throw listError;

        return new Response(JSON.stringify({ numbers }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'create':
        // Purchase phone number via Twilio
        const { data: twilioAccount } = await supabase
          .from('twilio_accounts')
          .select('*')
          .eq('id', phoneNumber.twilio_account_id)
          .single();

        if (!twilioAccount) {
          throw new Error('Twilio account not found');
        }

        // Create in our database
        const { data: newNumber, error: createError } = await supabase
          .from('phone_numbers')
          .insert({
            phone_number: phoneNumber.phone_number,
            twilio_account_id: phoneNumber.twilio_account_id,
            friendly_name: phoneNumber.friendly_name,
            assignment_type: phoneNumber.assignment_type,
            assigned_to_user_id: phoneNumber.assigned_to_user_id || null,
            assigned_to_client_id: phoneNumber.assigned_to_client_id || null,
            capabilities: phoneNumber.capabilities || { sms: true, voice: false, mms: false },
          })
          .select()
          .single();

        if (createError) throw createError;

        return new Response(JSON.stringify({ number: newNumber }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'update':
        const { data: updatedNumber, error: updateError } = await supabase
          .from('phone_numbers')
          .update({
            friendly_name: phoneNumber.friendly_name,
            assignment_type: phoneNumber.assignment_type,
            assigned_to_user_id: phoneNumber.assigned_to_user_id || null,
            assigned_to_client_id: phoneNumber.assigned_to_client_id || null,
            active: phoneNumber.active,
            capabilities: phoneNumber.capabilities,
          })
          .eq('id', phoneNumber.id)
          .select()
          .single();

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ number: updatedNumber }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'delete':
        const { error: deleteError } = await supabase
          .from('phone_numbers')
          .delete()
          .eq('id', phoneNumber.id);

        if (deleteError) throw deleteError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'search_available':
        // Search for available phone numbers in Twilio
        const { data: account } = await supabase
          .from('twilio_accounts')
          .select('*')
          .eq('id', phoneNumber.twilio_account_id)
          .single();

        if (!account) {
          throw new Error('Twilio account not found');
        }

        const searchParams = new URLSearchParams({
          AreaCode: phoneNumber.area_code || '',
          SmsEnabled: 'true',
        });

        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${account.account_sid}/AvailablePhoneNumbers/US/Local.json?${searchParams}`,
          {
            headers: {
              Authorization: `Basic ${btoa(`${account.account_sid}:${account.auth_token}`)}`,
            },
          }
        );

        const data = await response.json();

        return new Response(JSON.stringify({ available_numbers: data.available_phone_numbers || [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'purchase':
        // Purchase a phone number from Twilio
        const { data: purchaseAccount } = await supabase
          .from('twilio_accounts')
          .select('*')
          .eq('id', phoneNumber.twilio_account_id)
          .single();

        if (!purchaseAccount) {
          throw new Error('Twilio account not found');
        }

        const purchaseResponse = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${purchaseAccount.account_sid}/IncomingPhoneNumbers.json`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${btoa(`${purchaseAccount.account_sid}:${purchaseAccount.auth_token}`)}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              PhoneNumber: phoneNumber.phone_number,
              FriendlyName: phoneNumber.friendly_name || phoneNumber.phone_number,
              SmsUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/twilio-webhook`,
              SmsMethod: 'POST',
            }),
          }
        );

        if (!purchaseResponse.ok) {
          const error = await purchaseResponse.json();
          throw new Error(`Failed to purchase number: ${error.message}`);
        }

        const purchasedNumber = await purchaseResponse.json();

        // Save to database
        const { data: savedNumber, error: saveError } = await supabase
          .from('phone_numbers')
          .insert({
            phone_number: purchasedNumber.phone_number,
            twilio_account_id: phoneNumber.twilio_account_id,
            friendly_name: phoneNumber.friendly_name || purchasedNumber.friendly_name,
            assignment_type: phoneNumber.assignment_type,
            assigned_to_user_id: phoneNumber.assigned_to_user_id || null,
            assigned_to_client_id: phoneNumber.assigned_to_client_id || null,
            capabilities: {
              sms: purchasedNumber.capabilities.sms,
              voice: purchasedNumber.capabilities.voice,
              mms: purchasedNumber.capabilities.mms,
            },
          })
          .select()
          .single();

        if (saveError) throw saveError;

        return new Response(JSON.stringify({ number: savedNumber }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Error managing phone numbers:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

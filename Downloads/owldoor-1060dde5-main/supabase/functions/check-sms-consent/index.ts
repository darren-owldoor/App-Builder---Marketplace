import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const checkConsentSchema = z.object({
  phone_number: z.string().trim().min(10).max(20),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { phone_number } = checkConsentSchema.parse(body);

    console.log('Checking SMS consent for:', phone_number);

    // Get most recent consent record for this phone number
    const { data, error } = await supabase
      .from('sms_consent_log')
      .select('*')
      .eq('phone_number', phone_number)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking consent:', error);
      throw error;
    }

    // No consent record found
    if (!data) {
      console.log('No consent record found for:', phone_number);
      return new Response(JSON.stringify({ 
        can_send: false,
        reason: 'no_consent_record',
        message: 'No consent record found for this phone number'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user has opted out
    if (data.opt_out_timestamp) {
      console.log('User has opted out:', phone_number);
      return new Response(JSON.stringify({ 
        can_send: false,
        reason: 'opted_out',
        message: 'User has opted out of SMS communications',
        opt_out_date: data.opt_out_timestamp
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if consent was given
    if (!data.consent_given) {
      console.log('Consent not given:', phone_number);
      return new Response(JSON.stringify({ 
        can_send: false,
        reason: 'consent_not_given',
        message: 'User has not given consent for SMS communications'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // All checks passed
    console.log('SMS consent verified for:', phone_number);
    return new Response(JSON.stringify({ 
      can_send: true,
      consent_date: data.consent_timestamp,
      consent_method: data.consent_method,
      double_opt_in_confirmed: data.double_opt_in_confirmed
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in check-sms-consent:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      can_send: false,
      error: errorMessage 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

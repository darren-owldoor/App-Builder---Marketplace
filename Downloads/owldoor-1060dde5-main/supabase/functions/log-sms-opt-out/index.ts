import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const optOutSchema = z.object({
  phone_number: z.string().trim().min(10).max(20),
  opt_out_method: z.enum(['sms', 'phone', 'website', 'email']).optional().default('sms'),
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
    const { phone_number, opt_out_method } = optOutSchema.parse(body);

    console.log('Processing SMS opt-out for:', phone_number);

    // Get most recent consent record
    const { data: existingConsent, error: fetchError } = await supabase
      .from('sms_consent_log')
      .select('*')
      .eq('phone_number', phone_number)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching consent:', fetchError);
      throw fetchError;
    }

    // Update existing record if found
    if (existingConsent && !existingConsent.opt_out_timestamp) {
      const { error: updateError } = await supabase
        .from('sms_consent_log')
        .update({ 
          opt_out_timestamp: new Date().toISOString(),
          consent_given: false
        })
        .eq('id', existingConsent.id);

      if (updateError) {
        console.error('Error updating opt-out:', updateError);
        throw updateError;
      }

      console.log('Opt-out recorded for:', phone_number);
    } else if (!existingConsent) {
      // Create new opt-out record if no previous consent exists
      const { error: insertError } = await supabase
        .from('sms_consent_log')
        .insert({
          phone_number,
          consent_given: false,
          consent_timestamp: new Date().toISOString(),
          consent_method: opt_out_method,
          consent_text: 'User opted out via ' + opt_out_method,
          opt_out_timestamp: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Error inserting opt-out:', insertError);
        throw insertError;
      }

      console.log('New opt-out record created for:', phone_number);
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'SMS opt-out recorded successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in log-sms-opt-out:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

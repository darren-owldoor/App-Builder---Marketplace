import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schema for consent logging
const consentSchema = z.object({
  phone_number: z.string().trim().min(10).max(20),
  consent_given: z.boolean(),
  consent_method: z.enum(['website', 'sms', 'phone', 'verbal']),
  consent_text: z.string().min(10).max(2000),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  double_opt_in_confirmed: z.boolean().optional().default(false),
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
    
    // Validate input
    const validatedData = consentSchema.parse(body);

    console.log('Logging SMS consent for:', validatedData.phone_number);

    // Insert consent log
    const { data, error } = await supabase
      .from('sms_consent_log')
      .insert({
        phone_number: validatedData.phone_number,
        consent_given: validatedData.consent_given,
        consent_timestamp: new Date().toISOString(),
        consent_method: validatedData.consent_method,
        consent_text: validatedData.consent_text,
        ip_address: validatedData.ip_address || null,
        double_opt_in_confirmed: validatedData.double_opt_in_confirmed,
      })
      .select()
      .single();

    if (error) {
      console.error('Error logging consent:', error);
      throw error;
    }

    console.log('SMS consent logged successfully:', data.id);

    return new Response(JSON.stringify({ 
      success: true, 
      consent_id: data.id,
      message: 'SMS consent logged successfully' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in log-sms-consent:', error);
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

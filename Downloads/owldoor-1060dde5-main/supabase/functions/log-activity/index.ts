import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LogRequest {
  type: 'sms' | 'email' | 'payment' | 'captcha' | 'security' | 'system_health' | 'api_metric';
  data: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { type, data }: LogRequest = await req.json();

    let table = '';
    let insertData = data;

    switch (type) {
      case 'sms':
        table = 'sms_activity_log';
        break;
      case 'email':
        table = 'email_activity_log';
        break;
      case 'payment':
        table = 'payment_activity_log';
        break;
      case 'captcha':
        table = 'captcha_activity_log';
        break;
      case 'security':
        table = 'security_events';
        break;
      case 'system_health':
        table = 'system_health';
        break;
      case 'api_metric':
        table = 'api_endpoint_metrics';
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid log type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const { error } = await supabase
      .from(table)
      .insert(insertData);

    if (error) {
      console.error(`Error logging ${type}:`, error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in log-activity function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

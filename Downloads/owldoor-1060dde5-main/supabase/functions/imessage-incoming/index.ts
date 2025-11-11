import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-imessage-secret',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const secret = req.headers.get('x-imessage-secret');
    if (!secret) {
      return new Response(
        JSON.stringify({ error: 'Missing x-imessage-secret header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify secret and get user_id
    const { data: secretData, error: secretError } = await supabase
      .from('imessage_secrets')
      .select('user_id')
      .eq('secret_token', secret)
      .eq('is_active', true)
      .single();

    if (secretError || !secretData) {
      return new Response(
        JSON.stringify({ error: 'Invalid secret' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { phone, message, direction = 'inbound', timestamp } = await req.json();

    if (!phone || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: phone, message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try to match phone to a lead
    const { data: leads } = await supabase
      .from('leads')
      .select('id')
      .eq('user_id', secretData.user_id)
      .or(`phone.eq.${phone},phone.eq.+1${phone.replace(/\D/g, '')}`)
      .limit(1);

    const lead_id = leads && leads.length > 0 ? leads[0].id : null;

    // Insert incoming message
    const { data: messageData, error: insertError } = await supabase
      .from('imessage_incoming')
      .insert({
        user_id: secretData.user_id,
        phone,
        message,
        lead_id,
        direction,
        timestamp: timestamp || new Date().toISOString(),
        processed: false
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // If this is linked to a lead, also store in ai_messages for conversation history
    if (lead_id) {
      await supabase
        .from('ai_messages')
        .insert({
          lead_id,
          message,
          sender_type: 'lead',
          channel: 'imessage',
          metadata: { phone, imessage_id: messageData.id }
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        id: messageData.id,
        lead_id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

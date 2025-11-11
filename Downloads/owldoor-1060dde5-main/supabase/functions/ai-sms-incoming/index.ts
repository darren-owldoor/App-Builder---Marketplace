import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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

    // Parse Twilio webhook data
    const formData = await req.formData();
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const body = formData.get('Body') as string;
    const messageSid = formData.get('MessageSid') as string;

    console.log('Incoming SMS:', { from, to, body });

    // Find client by Twilio number
    const { data: configData } = await supabase
      .from('ai_config')
      .select('client_id, ai_enabled')
      .eq('twilio_phone_number', to)
      .single();

    if (!configData || !configData.ai_enabled) {
      console.log('No active AI config found for number:', to);
      return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
      });
    }

    const clientId = configData.client_id;
    const conversationId = `${from}-${to}`;

    // Find or create AI lead
    let { data: lead, error: leadError } = await supabase
      .from('ai_leads')
      .select('*')
      .eq('client_id', clientId)
      .eq('phone', from)
      .single();

    if (leadError || !lead) {
      // Create new lead
      const { data: newLead } = await supabase
        .from('ai_leads')
        .insert({
          client_id: clientId,
          phone: from,
          status: 'new',
          ai_active: true,
          last_message_at: new Date().toISOString(),
          message_count: 1,
        })
        .select()
        .single();
      
      lead = newLead;
    } else {
      // Update existing lead
      await supabase
        .from('ai_leads')
        .update({
          last_message_at: new Date().toISOString(),
          message_count: (lead.message_count || 0) + 1,
        })
        .eq('id', lead.id);
    }

    // Store incoming message
    await supabase
      .from('ai_messages')
      .insert({
        lead_id: lead.id,
        client_id: clientId,
        conversation_id: conversationId,
        sender_type: 'lead',
        content: body,
        twilio_sid: messageSid,
      });

    // For Phase 1, we just store the message
    // Phase 2 will add AI response logic
    console.log('Message stored for lead:', lead.id);

    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing SMS:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

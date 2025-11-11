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

    // GET - Fetch pending messages
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const limit = parseInt(url.searchParams.get('limit') || '10');

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

      // Update last_used_at
      await supabase
        .from('imessage_secrets')
        .update({ last_used_at: new Date().toISOString() })
        .eq('secret_token', secret);

      // Fetch pending messages
      const { data: messages, error } = await supabase
        .from('imessage_outgoing')
        .select('*')
        .eq('user_id', secretData.user_id)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return new Response(
        JSON.stringify({ 
          data: messages.map(m => ({
            id: m.id,
            agent: {
              phone: m.agent_phone,
              name: m.agent_name
            },
            content: m.content,
            lead_id: m.lead_id,
            created_at: m.created_at
          }))
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PATCH - Update message status
    if (req.method === 'PATCH') {
      const { id, status, error: errorMsg } = await req.json();

      // Verify secret
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

      const updateData: any = { 
        status,
        ...(status === 'sent' && { sent_at: new Date().toISOString() }),
        ...(errorMsg && { error: errorMsg })
      };

      const { error } = await supabase
        .from('imessage_outgoing')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', secretData.user_id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

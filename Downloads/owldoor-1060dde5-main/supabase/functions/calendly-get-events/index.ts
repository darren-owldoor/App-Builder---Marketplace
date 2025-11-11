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
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Authentication required');
    }

    // Get user's Calendly token
    const { data: tokenData, error: tokenError } = await supabase
      .from('calendly_tokens')
      .select('access_token, calendly_user_uri')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !tokenData) {
      throw new Error('Calendly not connected. Please connect your Calendly account first.');
    }

    const { count = 20, status = 'active' } = await req.json();

    // Get event types for the user
    const url = new URL('https://api.calendly.com/event_types');
    url.searchParams.append('user', tokenData.calendly_user_uri);
    url.searchParams.append('count', count.toString());
    url.searchParams.append('active', status === 'active' ? 'true' : 'false');

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Calendly API error:', error);
      throw new Error(`Calendly API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Successfully retrieved ${data.collection?.length || 0} event types`);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in calendly-get-events:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

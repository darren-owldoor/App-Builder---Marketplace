import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { function_name, search = '' } = await req.json();

    if (!function_name) {
      throw new Error('function_name is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Construct the analytics query URL
    const projectRef = supabaseUrl.split('//')[1].split('.')[0];
    const logsUrl = `https://${projectRef}.supabase.co/rest/v1/rpc/query_logflare`;

    // Query for edge function logs
    const query = {
      sql: `
        SELECT 
          event_message,
          event_type,
          function_id,
          level,
          timestamp
        FROM edge_logs
        WHERE function_id LIKE '%${function_name}%'
        ${search ? `AND event_message LIKE '%${search}%'` : ''}
        ORDER BY timestamp DESC
        LIMIT 100
      `
    };

    const response = await fetch(logsUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify(query)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error fetching logs:', errorText);
      
      // Return empty array instead of error to prevent breaking the UI
      return new Response(
        JSON.stringify({ 
          logs: [],
          message: 'Unable to fetch logs. Log querying may not be configured.'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    const logs = await response.json();

    return new Response(
      JSON.stringify({ logs: logs || [] }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in get-edge-logs:', error);
    
    // Return empty array instead of error
    return new Response(
      JSON.stringify({ 
        logs: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  }
});

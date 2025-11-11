import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extract API key from header
    const apiKey = req.headers.get('x-api-key');
    
    if (!apiKey) {
      console.error('No API key provided');
      return new Response(
        JSON.stringify({ error: 'API key is required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash the API key with SHA-256
    const apiKeyHash = Array.from(
      new Uint8Array(
        await crypto.subtle.digest('SHA-256', new TextEncoder().encode(apiKey))
      )
    ).map(b => b.toString(16).padStart(2, '0')).join('');

    // Validate API key using hash
    const { data: keyData, error: keyError } = await supabase
      .from('zapier_api_keys')
      .select('user_id, id')
      .eq('api_key_hash', apiKeyHash)
      .eq('active', true)
      .single();

    if (keyError || !keyData) {
      console.error('Invalid API key:', keyError);
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = keyData.user_id;

    // Update last_used_at
    await supabase
      .from('zapier_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyData.id);

    // Handle different HTTP methods
    switch (req.method) {
      case 'POST': {
        // Subscribe - store webhook URL
        const { hookUrl } = await req.json();
        
        if (!hookUrl) {
          return new Response(
            JSON.stringify({ error: 'hookUrl is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Creating webhook subscription:', { userId, hookUrl });

        // Store webhook subscription
        const { data: webhook, error: webhookError } = await supabase
          .from('zapier_webhooks')
          .insert({
            user_id: userId,
            webhook_url: hookUrl,
            webhook_type: 'export',
            entity_type: 'leads',
            active: true,
          })
          .select()
          .single();

        if (webhookError) {
          console.error('Error creating webhook:', webhookError);
          throw webhookError;
        }

        console.log('Webhook subscription created:', webhook.id);

        return new Response(
          JSON.stringify({ 
            id: webhook.id,
            success: true 
          }),
          { 
            status: 201, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      case 'DELETE': {
        // Unsubscribe - remove webhook URL
        const { hookUrl } = await req.json();
        
        if (!hookUrl) {
          return new Response(
            JSON.stringify({ error: 'hookUrl is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Deleting webhook subscription:', { userId, hookUrl });

        const { error: deleteError } = await supabase
          .from('zapier_webhooks')
          .delete()
          .eq('user_id', userId)
          .eq('webhook_url', hookUrl);

        if (deleteError) {
          console.error('Error deleting webhook:', deleteError);
          throw deleteError;
        }

        console.log('Webhook subscription deleted');

        return new Response(
          JSON.stringify({ success: true }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      case 'GET': {
        // Perform List - return sample data for Zapier editor (used for testing)
        console.log('Returning sample agents data for user:', userId);

        const { data: sampleLeads, error: leadsError } = await supabase
          .from('pros')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(3);

        if (leadsError) {
          console.error('Error fetching sample leads:', leadsError);
        }

        // Return sample data (or mock data if no leads exist)
        const samples = sampleLeads && sampleLeads.length > 0 
          ? sampleLeads 
          : [
              {
                id: 'sample-1',
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe@example.com',
                phone: '555-0123',
                lead_type: 'real_estate_agent',
                created_at: new Date().toISOString(),
              },
              {
                id: 'sample-2',
                first_name: 'Jane',
                last_name: 'Smith',
                email: 'jane.smith@example.com',
                phone: '555-0124',
                lead_type: 'mortgage_officer',
                created_at: new Date().toISOString(),
              }
            ];

        return new Response(
          JSON.stringify(samples),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Error in zapier-webhook-subscribe:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

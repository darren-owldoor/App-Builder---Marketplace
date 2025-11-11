import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportRequest {
  webhook_url: string;
  entity_type: 'users' | 'leads' | 'staff' | 'clients';
  filters?: any;
  user_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extract and validate API key
    const apiKey = req.headers.get('x-api-key') || req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      console.error('No API key provided');
      return new Response(
        JSON.stringify({ error: 'API key is required in x-api-key or Authorization header' }),
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

    // Update last_used_at
    await supabase
      .from('zapier_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyData.id);

    const authenticatedUserId = keyData.user_id;

    const { webhook_url, entity_type, filters, user_id }: ExportRequest = await req.json();

    console.log('Zapier export request:', { entity_type, webhook_url, user_id });

    if (!webhook_url || !entity_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: webhook_url and entity_type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let query;
    let data: any[] = [];

    switch (entity_type) {
      case 'leads':
        query = supabase.from('pros').select('*');
        // Always scope to authenticated user's data
        query = query.eq('user_id', authenticatedUserId);
        break;

      case 'clients':
        query = supabase.from('clients').select('*');
        break;

      case 'staff':
        // Get staff users by role
        const { data: staffRoles } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'staff');
        
        if (staffRoles && staffRoles.length > 0) {
          const staffUserIds = staffRoles.map(r => r.user_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', staffUserIds);
          data = profiles || [];
        }
        query = null;
        break;

      case 'users':
        query = supabase.from('profiles').select('*');
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid entity_type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    if (query) {
      const { data: queryData, error } = await query;
      if (error) {
        throw error;
      }
      data = queryData || [];
    }

    console.log(`Exporting ${data.length} ${entity_type} records to Zapier`);

    // Send data to Zapier webhook
    const zapierResponse = await fetch(webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        entity_type,
        data,
        timestamp: new Date().toISOString(),
        count: data.length,
      }),
    });

    if (!zapierResponse.ok) {
      throw new Error(`Zapier webhook failed: ${zapierResponse.statusText}`);
    }

    // Log success
    await supabase.from('zapier_logs').insert({
      user_id: authenticatedUserId,
      action: 'export',
      entity_type,
      entity_count: data.length,
      status: 'success',
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        exported: data.length,
        entity_type,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Zapier export error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting admin database export...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get JWT token and verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Tables to export
    const tablesToExport = [
      'profiles',
      'clients',
      'pros',
      'matches',
      'leads',
      'conversations',
      'campaign_templates',
      'campaigns',
      'campaign_assignments',
      'campaign_responses',
      'support_tickets',
      'credit_transactions',
      'market_coverage',
      'custom_fields',
      'custom_field_values',
      'user_roles',
      'agent_unlocks',
    ];

    const exportData: Record<string, any[]> = {};
    const metadata = {
      exportedAt: new Date().toISOString(),
      exportedBy: user.id,
      exportedByEmail: user.email,
      supabaseUrl,
      tableCount: 0,
      totalRecords: 0,
    };

    for (const table of tablesToExport) {
      console.log(`📦 Exporting table: ${table}`);
      
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*');

        if (error) {
          console.error(`❌ Error fetching ${table}:`, error);
          exportData[table] = [];
        } else {
          exportData[table] = data || [];
          metadata.totalRecords += (data?.length || 0);
          console.log(`✅ Exported ${data?.length || 0} records from ${table}`);
        }
      } catch (error) {
        console.error(`❌ Exception exporting ${table}:`, error);
        exportData[table] = [];
      }
    }

    metadata.tableCount = tablesToExport.length;

    const fullExport = {
      metadata,
      data: exportData,
    };

    console.log('🎉 Export completed!');
    console.log(`📊 Total tables: ${metadata.tableCount}`);
    console.log(`📊 Total records: ${metadata.totalRecords}`);

    return new Response(
      JSON.stringify(fullExport, null, 2),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="database-export-${new Date().toISOString()}.json"`,
        },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Export function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

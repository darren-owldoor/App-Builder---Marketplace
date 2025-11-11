import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportData {
  schema: {
    tables: Array<{
      name: string;
      definition: string;
      indexes: string[];
      triggers: string[];
      policies: string[];
    }>;
    enums: string[];
    functions: string[];
  };
  data: Record<string, any[]>;
  metadata: {
    exported_at: string;
    version: string;
    row_counts: Record<string, number>;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting database export...');

    // Tables to export in dependency order
    const tables = [
      'user_roles',
      'profiles', 
      'leads',
      'pros',
      'clients',
      'matches',
      'conversations',
      'campaign_templates',
      'campaign_logs',
      'campaign_assignments',
      'campaign_responses',
      'support_tickets',
      'credit_transactions',
      'market_coverage',
      'custom_fields',
      'custom_field_values',
      'sync_configuration',
      'sync_logs',
    ];

    const exportData: ExportData = {
      schema: {
        tables: [],
        enums: [],
        functions: [],
      },
      data: {},
      metadata: {
        exported_at: new Date().toISOString(),
        version: '1.0',
        row_counts: {},
      },
    };

    // Export enum types
    const { data: enumData } = await supabase.rpc('pg_catalog.pg_enum', {});
    exportData.schema.enums.push("CREATE TYPE public.app_role AS ENUM ('staff', 'client', 'lead', 'admin');");

    // Export data from each table
    for (const table of tables) {
      console.log(`Exporting ${table}...`);
      
      const { data, error } = await supabase.from(table).select('*');
      
      if (error) {
        console.error(`Error exporting ${table}:`, error);
        continue;
      }

      exportData.data[table] = data || [];
      exportData.metadata.row_counts[table] = (data || []).length;
      
      console.log(`Exported ${(data || []).length} rows from ${table}`);
    }

    // Create downloadable JSON file
    const jsonString = JSON.stringify(exportData, null, 2);
    
    return new Response(jsonString, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="lovable-cloud-backup-${Date.now()}.json"`,
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Export failed',
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

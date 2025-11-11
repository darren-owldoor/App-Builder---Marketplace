import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RestoreData {
  data: Record<string, any[]>;
  metadata: {
    exported_at: string;
    version: string;
    row_counts: Record<string, number>;
  };
}

interface RestoreResult {
  table: string;
  restored: number;
  errors: number;
  status: 'success' | 'partial' | 'failed';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { backupData, clearExisting = false } = await req.json() as {
      backupData: RestoreData;
      clearExisting?: boolean;
    };

    console.log('Starting database restore...');
    console.log(`Backup from: ${backupData.metadata.exported_at}`);
    console.log(`Clear existing: ${clearExisting}`);

    const results: RestoreResult[] = [];

    // Tables in dependency order
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

    // Optionally clear existing data (in reverse order)
    if (clearExisting) {
      console.log('Clearing existing data...');
      for (const table of [...tables].reverse()) {
        await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        console.log(`Cleared ${table}`);
      }
    }

    // Restore data for each table
    for (const table of tables) {
      const tableData = backupData.data[table];
      
      if (!tableData || tableData.length === 0) {
        console.log(`Skipping ${table} - no data`);
        continue;
      }

      console.log(`Restoring ${table} (${tableData.length} rows)...`);
      
      let restored = 0;
      let errors = 0;

      // Insert in batches of 100
      const batchSize = 100;
      for (let i = 0; i < tableData.length; i += batchSize) {
        const batch = tableData.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from(table)
          .upsert(batch, { 
            onConflict: 'id',
            ignoreDuplicates: false,
          });

        if (error) {
          console.error(`Error restoring batch in ${table}:`, error);
          errors += batch.length;
        } else {
          restored += batch.length;
        }
      }

      const status = errors === 0 ? 'success' : 
                    restored > 0 ? 'partial' : 'failed';

      results.push({
        table,
        restored,
        errors,
        status,
      });

      console.log(`Restored ${restored} rows to ${table} with ${errors} errors`);
    }

    const summary = {
      totalRestored: results.reduce((sum, r) => sum + r.restored, 0),
      totalErrors: results.reduce((sum, r) => sum + r.errors, 0),
      failedTables: results.filter(r => r.status === 'failed').length,
    };

    console.log('Restore complete:', summary);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Restore error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Restore failed',
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

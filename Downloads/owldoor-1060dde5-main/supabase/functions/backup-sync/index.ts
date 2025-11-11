import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncResult {
  table: string;
  synced: number;
  errors: number;
  status: 'success' | 'partial' | 'failed';
}

// Helper function to get available columns for a table
async function getTableColumns(client: any, tableName: string): Promise<string[]> {
  try {
    const { data, error } = await client.from(tableName).select('*').limit(1);
    if (error || !data || data.length === 0) {
      console.warn(`⚠️ Could not fetch columns for ${tableName}`);
      return [];
    }
    return Object.keys(data[0]);
  } catch (error) {
    console.warn(`⚠️ Error fetching columns for ${tableName}:`, error);
    return [];
  }
}

// Helper function to filter data to only include common columns
function filterToCommonColumns(data: any[], commonColumns: string[]): any[] {
  return data.map(row => {
    const filtered: any = {};
    for (const col of commonColumns) {
      if (col in row) {
        filtered[col] = row[col];
      }
    }
    return filtered;
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { twoWaySync = false } = await req.json().catch(() => ({}));
    console.log(`🔄 Starting ${twoWaySync ? '2-way' : '1-way'} backup sync...`);

    // Initialize source (Lovable Cloud) Supabase client
    const sourceUrl = Deno.env.get('SUPABASE_URL')!;
    const sourceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const sourceClient = createClient(sourceUrl, sourceKey);

    // Try to get configuration from database first
    const { data: config } = await sourceClient
      .from('sync_configuration')
      .select('*')
      .eq('id', 1)
      .single();

    // Use database config if available, otherwise fall back to env vars
    let destUrl = config?.external_url || Deno.env.get('EXTERNAL_SUPABASE_URL');
    let destKey = config?.external_key || Deno.env.get('EXTERNAL_SUPABASE_SERVICE_KEY');
    const useTwoWay = config?.two_way_sync ?? twoWaySync;

    if (!destUrl || !destKey) {
      throw new Error('External database credentials not configured. Please configure them in the admin settings.');
    }

    // Initialize destination (External) Supabase client
    const destClient = createClient(destUrl, destKey);
    console.log(`🔗 Connected to external database`);

    // Tables to sync (in order of dependencies)
    const tablesToSync = [
      'profiles',
      'clients',
      'pros',
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
    ];

    const results: SyncResult[] = [];

    // Sync from source to destination
    console.log('📤 Syncing from Lovable Cloud to External...');
    for (const table of tablesToSync) {
      console.log(`📦 Syncing table: ${table}`);
      let syncedCount = 0;
      let errorCount = 0;

      try {
        // Get columns from both databases
        const sourceColumns = await getTableColumns(sourceClient, table);
        const destColumns = await getTableColumns(destClient, table);
        
        if (sourceColumns.length === 0 || destColumns.length === 0) {
          console.log(`⚠️ Could not determine columns for ${table}, skipping`);
          results.push({ table, synced: 0, errors: 0, status: 'failed' });
          continue;
        }

        // Get common columns
        const commonColumns = sourceColumns.filter(col => destColumns.includes(col));
        
        if (commonColumns.length === 0) {
          console.log(`⚠️ No common columns for ${table}, skipping`);
          results.push({ table, synced: 0, errors: 0, status: 'failed' });
          continue;
        }

        console.log(`📋 Syncing ${commonColumns.length}/${sourceColumns.length} columns`);

        // Fetch all data from source
        const { data: sourceData, error: fetchError } = await sourceClient
          .from(table)
          .select('*');

        if (fetchError) {
          console.error(`❌ Error fetching ${table}:`, fetchError);
          results.push({ table, synced: 0, errors: 1, status: 'failed' });
          continue;
        }

        if (!sourceData || sourceData.length === 0) {
          console.log(`⚠️ No data in ${table}`);
          results.push({ table, synced: 0, errors: 0, status: 'success' });
          continue;
        }

        console.log(`📊 Found ${sourceData.length} records in ${table}`);

        // Filter data to only include common columns
        const filteredData = filterToCommonColumns(sourceData, commonColumns);

        // Upsert to destination in batches of 100
        const batchSize = 100;
        for (let i = 0; i < filteredData.length; i += batchSize) {
          const batch = filteredData.slice(i, i + batchSize);
          
          const { error: upsertError } = await destClient
            .from(table)
            .upsert(batch, { onConflict: 'id' });

          if (upsertError) {
            console.error(`❌ Error upserting batch to ${table}:`, upsertError);
            errorCount += batch.length;
          } else {
            syncedCount += batch.length;
          }
        }

        const status = errorCount === 0 ? 'success' : 
                      syncedCount > 0 ? 'partial' : 'failed';
        
        results.push({ table, synced: syncedCount, errors: errorCount, status });
        console.log(`✅ ${table}: ${syncedCount} synced, ${errorCount} errors`);

      } catch (error) {
        console.error(`❌ Unexpected error syncing ${table}:`, error);
        results.push({ table, synced: 0, errors: 1, status: 'failed' });
      }
    }

    // If 2-way sync, sync back from external to source
    if (useTwoWay) {
      console.log('📥 Syncing from External to Lovable Cloud...');
      for (const table of tablesToSync) {
        console.log(`📦 Reverse syncing table: ${table}`);
        let syncedCount = 0;
        let errorCount = 0;

        try {
          // Get columns from both databases
          const sourceColumns = await getTableColumns(sourceClient, table);
          const destColumns = await getTableColumns(destClient, table);
          
          if (sourceColumns.length === 0 || destColumns.length === 0) {
            console.log(`⚠️ Could not determine columns for ${table}, skipping reverse sync`);
            continue;
          }

          // Get common columns
          const commonColumns = destColumns.filter(col => sourceColumns.includes(col));
          
          if (commonColumns.length === 0) {
            console.log(`⚠️ No common columns for ${table}, skipping reverse sync`);
            continue;
          }

          console.log(`📋 Reverse syncing ${commonColumns.length}/${destColumns.length} columns`);

          // Fetch all data from external
          const { data: extData, error: fetchError } = await destClient
            .from(table)
            .select('*');

          if (fetchError) {
            console.error(`❌ Error fetching ${table} from external:`, fetchError);
            continue;
          }

          if (!extData || extData.length === 0) {
            console.log(`⚠️ No data in external ${table}`);
            continue;
          }

          console.log(`📊 Found ${extData.length} records in external ${table}`);

          // Filter data to only include common columns
          const filteredData = filterToCommonColumns(extData, commonColumns);

          // Upsert to source in batches of 100
          const batchSize = 100;
          for (let i = 0; i < filteredData.length; i += batchSize) {
            const batch = filteredData.slice(i, i + batchSize);
            
            const { error: upsertError } = await sourceClient
              .from(table)
              .upsert(batch, { onConflict: 'id' });

            if (upsertError) {
              console.error(`❌ Error upserting batch to source ${table}:`, upsertError);
              errorCount += batch.length;
            } else {
              syncedCount += batch.length;
            }
          }

          console.log(`✅ Reverse ${table}: ${syncedCount} synced, ${errorCount} errors`);

        } catch (error) {
          console.error(`❌ Unexpected error reverse syncing ${table}:`, error);
        }
      }
    }

    // Log sync completion
    const totalSynced = results.reduce((sum, r) => sum + r.synced, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);
    const failedTables = results.filter(r => r.status === 'failed').length;

    console.log('🎉 Backup sync completed!');
    console.log(`📊 Total synced: ${totalSynced}`);
    console.log(`⚠️ Total errors: ${totalErrors}`);
    console.log(`❌ Failed tables: ${failedTables}`);

    // Log to source database for audit trail
    try {
      await sourceClient.from('sync_logs').insert({
        synced_at: new Date().toISOString(),
        total_records: totalSynced,
        total_errors: totalErrors,
        failed_tables: failedTables,
        details: results,
      });
    } catch (logError) {
      console.error('Failed to log sync:', logError);
    }

    return new Response(
      JSON.stringify({
        success: failedTables === 0,
        timestamp: new Date().toISOString(),
        summary: {
          totalSynced,
          totalErrors,
          failedTables,
        },
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Sync function error:', error);
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

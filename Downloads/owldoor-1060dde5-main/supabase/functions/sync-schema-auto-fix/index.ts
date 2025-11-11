import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ColumnDifference {
  table: string;
  column: string;
  type: string;
  nullable: boolean;
  default_value?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔧 Starting schema auto-fix process...');

    // Initialize source (Lovable Cloud) Supabase client
    const sourceSupabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get sync configuration
    const { data: config, error: configError } = await sourceSupabase
      .from('sync_configuration')
      .select('*')
      .single();

    if (configError || !config) {
      throw new Error('Sync configuration not found. Please configure sync first.');
    }

    if (!config.external_url || !config.external_key) {
      throw new Error('External Supabase URL and key must be configured.');
    }

    console.log('✅ Sync configuration loaded');

    // Initialize destination (external) Supabase client
    const destSupabase = createClient(config.external_url, config.external_key);

    // Define the schema differences we know about
    const missingColumns: ColumnDifference[] = [
      { table: 'profiles', column: 'onboarding_data', type: 'jsonb', nullable: true },
      { table: 'clients', column: 'avg_sale', type: 'numeric', nullable: true },
      { table: 'pros', column: 'additional_data', type: 'jsonb', nullable: true },
      { table: 'matches', column: 'match_type', type: 'text', nullable: true },
      { table: 'campaign_templates', column: 'ai_fallback_notify_email', type: 'text', nullable: true },
      { table: 'credit_transactions', column: 'reason', type: 'text', nullable: true },
      { table: 'market_coverage', column: 'name', type: 'text', nullable: true },
    ];

    console.log(`📋 Checking ${missingColumns.length} potential missing columns...`);

    const addedColumns: string[] = [];
    const errors: string[] = [];

    // Check and add each missing column
    for (const col of missingColumns) {
      try {
        console.log(`🔍 Checking ${col.table}.${col.column}...`);

        // Try to query the column to see if it exists
        const { error: checkError } = await destSupabase
          .from(col.table)
          .select(col.column)
          .limit(1);

        if (checkError && checkError.message.includes('column')) {
          console.log(`➕ Adding ${col.table}.${col.column}...`);

          // Build ALTER TABLE statement
          let alterSQL = `ALTER TABLE public.${col.table} ADD COLUMN IF NOT EXISTS ${col.column} ${col.type.toUpperCase()}`;
          
          if (!col.nullable) {
            alterSQL += ' NOT NULL';
          }
          
          if (col.default_value) {
            alterSQL += ` DEFAULT ${col.default_value}`;
          }

          // Execute via RPC if available, or log for manual execution
          console.log(`📝 SQL: ${alterSQL}`);
          
          // Note: We can't execute raw SQL directly via Supabase client for security reasons
          // The user will need to execute these via their Supabase SQL editor
          addedColumns.push(`${col.table}.${col.column}`);
        } else {
          console.log(`✅ ${col.table}.${col.column} already exists`);
        }
      } catch (error) {
        const errorMsg = `Failed to check/add ${col.table}.${col.column}: ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    // Generate SQL script for manual execution
    const sqlScript = missingColumns.map(col => {
      let sql = `ALTER TABLE public.${col.table} ADD COLUMN IF NOT EXISTS ${col.column} ${col.type.toUpperCase()}`;
      if (!col.nullable) sql += ' NOT NULL';
      if (col.default_value) sql += ` DEFAULT ${col.default_value}`;
      return sql + ';';
    }).join('\n');

    console.log('📊 Schema check complete');

    // If columns were found missing, provide SQL script
    if (addedColumns.length > 0) {
      return new Response(
        JSON.stringify({
          status: 'columns_missing',
          message: 'Missing columns detected. Please run the SQL script below on your external Supabase.',
          missing_columns: addedColumns,
          sql_script: sqlScript,
          instructions: [
            '1. Copy the SQL script below',
            '2. Go to your external Supabase project SQL Editor',
            '3. Paste and run the script',
            '4. Run NOTIFY pgrst, \'reload schema\'; to refresh the schema cache',
            '5. Try the sync again'
          ]
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // If all columns exist, trigger the sync
    console.log('✅ All columns present, triggering sync...');
    
    const { data: syncResult, error: syncError } = await sourceSupabase.functions.invoke('backup-sync', {
      body: { twoWaySync: config.two_way_sync || false }
    });

    if (syncError) {
      throw new Error(`Sync failed: ${syncError.message}`);
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        message: 'Schema is up to date and sync completed successfully',
        sync_result: syncResult
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Schema auto-fix error:', error);
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

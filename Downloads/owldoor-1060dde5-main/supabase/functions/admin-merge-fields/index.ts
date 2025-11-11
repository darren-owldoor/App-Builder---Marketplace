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
    console.log('🔄 Starting field merge operation...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin role
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

    const { sourceFieldName, targetFieldName } = await req.json();

    if (!sourceFieldName || !targetFieldName) {
      return new Response(
        JSON.stringify({ error: 'sourceFieldName and targetFieldName are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Merging field: ${sourceFieldName} -> ${targetFieldName}`);

    // Get field definitions to determine entity types
    const { data: sourceField } = await supabase
      .from('field_definitions')
      .select('*')
      .eq('field_name', sourceFieldName)
      .single();

    const { data: targetField } = await supabase
      .from('field_definitions')
      .select('*')
      .eq('field_name', targetFieldName)
      .single();

    if (!sourceField || !targetField) {
      return new Response(
        JSON.stringify({ error: 'One or both fields not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Merge custom field values
    let mergedCount = 0;

    // Get all custom field values for the source field
    const { data: sourceValues } = await supabase
      .from('custom_field_values')
      .select('*')
      .eq('field_name', sourceFieldName);

    if (sourceValues && sourceValues.length > 0) {
      console.log(`Found ${sourceValues.length} source values to merge`);

      // For each source value, update or insert into target
      for (const sourceValue of sourceValues) {
        const { data: existing } = await supabase
          .from('custom_field_values')
          .select('*')
          .eq('entity_id', sourceValue.entity_id)
          .eq('entity_type', sourceValue.entity_type)
          .eq('field_name', targetFieldName)
          .single();

        if (existing) {
          // Update existing target value
          await supabase
            .from('custom_field_values')
            .update({ field_value: sourceValue.field_value })
            .eq('id', existing.id);
        } else {
          // Insert new target value
          await supabase
            .from('custom_field_values')
            .insert({
              entity_id: sourceValue.entity_id,
              entity_type: sourceValue.entity_type,
              field_name: targetFieldName,
              field_value: sourceValue.field_value,
            });
        }
        mergedCount++;
      }

      console.log(`✅ Merged ${mergedCount} values`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        mergedCount,
        message: `Successfully merged ${mergedCount} values from ${sourceFieldName} to ${targetFieldName}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('❌ Merge field error:', error);
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

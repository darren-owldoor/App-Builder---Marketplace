import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract and validate API key
    const apiKey = req.headers.get('x-api-key') || req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      console.error('No API key provided');
      return new Response(
        JSON.stringify({ success: false, error: 'API key is required in x-api-key or Authorization header' }),
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
        JSON.stringify({ success: false, error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update last_used_at
    await supabase
      .from('zapier_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyData.id);

    const { pro_id, email, phone, stage, trigger_matching = true } = await req.json();

    console.log('📬 Update stage request:', { pro_id, email, phone, stage });

    // Validate stage
    const validStages = ['new', 'qualifying', 'qualified', 'match_ready', 'matched', 'purchased'];
    if (!stage || !validStages.includes(stage)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid stage. Must be one of: ${validStages.join(', ')}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Find pro
    let query = supabase.from('pros').select('*');

    if (pro_id) {
      query = query.eq('id', pro_id);
    } else if (email && phone) {
      query = query.or(`email.eq.${email},phone.eq.${phone}`);
    } else if (email) {
      query = query.eq('email', email);
    } else if (phone) {
      query = query.eq('phone', phone);
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Must provide pro_id, email, or phone',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: pros, error: findError } = await query.limit(1);

    if (findError) {
      console.error('❌ Error finding pro:', findError);
      throw findError;
    }

    if (!pros || pros.length === 0) {
      console.error('❌ Pro not found');
      
      // Log error
      await supabase.from('zapier_logs').insert({
        user_id: keyData.user_id,
        action: 'update_stage',
        entity_type: 'pro',
        entity_count: 0,
        status: 'error',
        error_message: 'Pro not found',
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Pro not found',
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const pro = pros[0];
    console.log('✅ Found pro:', pro.id);

    // Update stage
    const { data: updatedPro, error: updateError } = await supabase
      .from('pros')
      .update({
        pipeline_stage: stage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pro.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating stage:', updateError);
      throw updateError;
    }

    console.log('✅ Updated stage to:', stage);

    // Trigger auto-matching if requested and stage is match_ready
    let matchingTriggered = false;
    let matchingError = null;

    if (trigger_matching && stage === 'match_ready') {
      console.log('🎯 Triggering auto-match...');

      try {
        const matchResponse = await fetch(
          `${supabaseUrl}/functions/v1/auto-match-leads`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        matchingTriggered = matchResponse.ok;
        
        if (!matchResponse.ok) {
          const errorText = await matchResponse.text();
          matchingError = errorText;
          console.error('❌ Matching failed:', errorText);
        } else {
          console.log('✅ Matching triggered successfully');
        }
      } catch (matchError: any) {
        matchingError = matchError.message;
        console.error('❌ Error triggering matching:', matchError);
      }
    }

    // Log success
    await supabase.from('zapier_logs').insert({
      user_id: keyData.user_id,
      action: 'update_stage',
      entity_type: 'pro',
      entity_count: 1,
      status: 'success',
    });

    return new Response(
      JSON.stringify({
        success: true,
        pro_id: updatedPro.id,
        old_stage: pro.pipeline_stage,
        new_stage: stage,
        matching_triggered: matchingTriggered,
        matching_error: matchingError,
        message: 'Stage updated successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('❌ Fatal error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

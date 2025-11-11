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

    const {
      pro_type,
      first_name,
      last_name,
      email,
      phone,
      source,
      tags,
      city,
      state,
      utm_source,
      utm_campaign,
      utm_medium,
    } = await req.json();

    console.log('📬 Zapier create/update pro request:', { email, phone, pro_type });

    // Validate: at least email or phone
    if (!email && !phone) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Either email or phone is required',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate pro_type
    if (pro_type && !['real_estate_agent', 'mortgage_officer'].includes(pro_type)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid pro_type. Must be "real_estate_agent" or "mortgage_officer"',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check for existing pro (match by email or phone)
    let query = supabase.from('pros').select('*');
    
    if (email && phone) {
      query = query.or(`email.eq.${email},phone.eq.${phone}`);
    } else if (email) {
      query = query.eq('email', email);
    } else if (phone) {
      query = query.eq('phone', phone);
    }

    const { data: existingPros } = await query.limit(1);

    if (existingPros && existingPros.length > 0) {
      // UPDATE EXISTING PRO
      const existingPro = existingPros[0];
      
      console.log('✅ Found existing pro:', existingPro.id);

      const { data: updatedPro, error: updateError } = await supabase
        .from('pros')
        .update({
          // Update type if provided and different
          pro_type: pro_type || existingPro.pro_type,
          
          // Update name if provided
          first_name: first_name || existingPro.first_name,
          last_name: last_name || existingPro.last_name,
          full_name: first_name && last_name 
            ? `${first_name} ${last_name}` 
            : existingPro.full_name,
          
          // Update contact if provided
          email: email || existingPro.email,
          phone: phone || existingPro.phone,
          
          // Update location if provided
          city: city || existingPro.city,
          state: state || existingPro.state,
          
          // Merge tags
          tags: tags 
            ? [...new Set([...(existingPro.tags || []), ...(Array.isArray(tags) ? tags : [tags])])]
            : existingPro.tags,
          
          // Update tracking
          lead_source: source || existingPro.lead_source,
          utm_source: utm_source || existingPro.utm_source,
          utm_campaign: utm_campaign || existingPro.utm_campaign,
          utm_medium: utm_medium || existingPro.utm_medium,
          
          // Mark as recruiting lead
          open_to_company_offers: true,
          interested_in_opportunities: true,
          
          // Update pipeline if was directory
          pipeline_stage: existingPro.pipeline_stage === 'directory' 
            ? 'new' 
            : existingPro.pipeline_stage,
          
          // Track conversion
          became_lead_at: existingPro.became_lead_at || new Date().toISOString(),
          form_submission_count: (existingPro.form_submission_count || 0) + 1,
          last_form_submission_at: new Date().toISOString(),
          
          // Boost engagement
          engagement_score: Math.min((existingPro.engagement_score || 0) + 20, 100),
          
          // Update timestamp
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingPro.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating pro:', updateError);
        throw updateError;
      }

      console.log('✅ Updated existing pro');

      // Log to zapier_logs
      await supabase.from('zapier_logs').insert({
        user_id: keyData.user_id,
        action: 'create_pro',
        entity_type: 'pro',
        entity_count: 1,
        status: 'success',
      });

      return new Response(
        JSON.stringify({
          success: true,
          action: 'updated',
          pro_id: updatedPro.id,
          pro: updatedPro,
          message: 'Pro profile updated successfully',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      // CREATE NEW PRO
      console.log('➕ Creating new pro');

      const { data: newPro, error: createError } = await supabase
        .from('pros')
        .insert({
          pro_type: pro_type || 'real_estate_agent',
          first_name,
          last_name,
          full_name: first_name && last_name ? `${first_name} ${last_name}` : '',
          email,
          phone,
          city,
          state,
          tags: Array.isArray(tags) ? tags : (tags ? [tags] : null),
          
          // Pipeline
          pipeline_stage: 'new',
          original_status: 'new',
          
          // Recruitment
          open_to_company_offers: true,
          interested_in_opportunities: true,
          became_lead_at: new Date().toISOString(),
          
          // Tracking
          lead_source: source || 'zapier',
          utm_source,
          utm_campaign,
          utm_medium,
          form_submission_count: 1,
          last_form_submission_at: new Date().toISOString(),
          engagement_score: 20,
          
          // Directory
          is_claimed: false,
          
          // Timestamps
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating pro:', createError);
        
        // Log error
        await supabase.from('zapier_logs').insert({
          user_id: keyData.user_id,
          action: 'create_pro',
          entity_type: 'pro',
          entity_count: 0,
          status: 'error',
          error_message: createError.message,
        });

        throw createError;
      }

      console.log('✅ Created new pro:', newPro.id);

      // Log success
      await supabase.from('zapier_logs').insert({
        user_id: keyData.user_id,
        action: 'create_pro',
        entity_type: 'pro',
        entity_count: 1,
        status: 'success',
      });

      return new Response(
        JSON.stringify({
          success: true,
          action: 'created',
          pro_id: newPro.id,
          pro: newPro,
          message: 'Pro profile created successfully',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
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

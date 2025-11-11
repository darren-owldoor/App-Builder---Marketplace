import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authentication - accept webhook secret, Anthropic API key, OR valid Supabase JWT
    const webhookSecret = req.headers.get('x-webhook-secret');
    const authHeader = req.headers.get('authorization');
    const expectedSecret = Deno.env.get('CLIENT_WEBHOOK_SECRET');
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    
    let isAuthenticated = false;
    
    // Check webhook secret
    if (expectedSecret && webhookSecret === expectedSecret) {
      isAuthenticated = true;
      console.log('Authenticated via webhook secret');
    }
    
    // Check Anthropic API key
    if (!isAuthenticated && anthropicKey && authHeader) {
      const bearerToken = authHeader.replace('Bearer ', '');
      if (bearerToken === anthropicKey) {
        isAuthenticated = true;
        console.log('Authenticated via Anthropic API key');
      }
    }
    
    // Check Supabase JWT token (for admin/internal calls)
    if (!isAuthenticated && authHeader) {
      try {
        const supabaseAuth = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          { global: { headers: { Authorization: authHeader } } }
        );
        
        const { data: { user }, error } = await supabaseAuth.auth.getUser();
        
        if (user && !error) {
          isAuthenticated = true;
          console.log('Authenticated via Supabase JWT token');
        }
      } catch (error) {
        console.log('JWT validation failed:', error);
      }
    }
    
    if (!isAuthenticated) {
      console.error('Unauthorized: No valid authentication provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Provide x-webhook-secret, valid JWT token, or Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestData = await req.json();
    console.log('Received client webhook data:', { 
      company: requestData.company_name, 
      email_domain: requestData.email?.split('@')[1],
      client_type: requestData.client_type 
    });

    // Validate required fields
    const { company_name, contact_name, email, client_type } = requestData;
    
    if (!company_name || !contact_name || !email || !client_type) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields',
          required: ['company_name', 'contact_name', 'email', 'client_type'],
          received: { company_name, contact_name, email, client_type }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate client_type enum - must be 'real_estate' or 'mortgage'
    const validClientTypes = ['real_estate', 'mortgage'];
    if (!validClientTypes.includes(client_type)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid client_type',
          valid_types: validClientTypes,
          received: client_type,
          note: 'client_type must be either "real_estate" or "mortgage"'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if client with this email already exists
    const { data: existingClient, error: checkError } = await supabaseClient
      .from('clients')
      .select('id, email, company_name')
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing client:', checkError);
      return new Response(
        JSON.stringify({ error: 'Database error checking existing client' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existingClient) {
      console.log('Client already exists:', existingClient);
      return new Response(
        JSON.stringify({ 
          message: 'Client already exists',
          client_id: existingClient.id,
          email: existingClient.email
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create user account first
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email: email,
      email_confirm: true,
      user_metadata: {
        first_name: requestData.first_name || '',
        last_name: requestData.last_name || '',
        full_name: contact_name,
      }
    });

    if (authError || !authData.user) {
      console.error('Error creating user:', authError);
      return new Response(
        JSON.stringify({ error: 'Failed to create user account', details: authError?.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Created user:', authData.user.id);

    // Assign client role
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: 'client'
      });

    if (roleError) {
      console.error('Error assigning client role:', roleError);
    }

    // Prepare client data
    const clientData = {
      user_id: authData.user.id,
      company_name,
      contact_name,
      email,
      client_type,
      phone: requestData.phone || null,
      phone2: requestData.phone2 || null,
      email2: requestData.email2 || null,
      first_name: requestData.first_name || null,
      last_name: requestData.last_name || null,
      brokerage: requestData.brokerage || null,
      license_type: requestData.license_type || null,
      cities: requestData.cities || null,
      states: requestData.states || null,
      zip_codes: requestData.zip_codes || null,
      county: requestData.county || null,
      years_experience: requestData.years_experience || null,
      yearly_sales: requestData.yearly_sales || null,
      avg_sale: requestData.avg_sale || null,
      skills: requestData.skills || null,
      wants: requestData.wants || null,
      needs: requestData.needs || null,
      tags: requestData.tags || [],
      languages: requestData.languages || null,
      designations: requestData.designations || null,
      image_url: requestData.image_url || null,
      website_url: requestData.website_url || null,
      linkedin_url: requestData.linkedin_url || null,
      facebook_url: requestData.facebook_url || null,
      twitter_url: requestData.twitter_url || null,
      instagram_url: requestData.instagram_url || null,
      youtube_url: requestData.youtube_url || null,
      tiktok_url: requestData.tiktok_url || null,
      realtor_com_url: requestData.realtor_com_url || null,
      homes_com_url: requestData.homes_com_url || null,
      coverage_areas: requestData.coverage_areas || null,
      preferences: requestData.preferences || null,
      credits_balance: requestData.credits_balance || 0,
      monthly_spend_maximum: requestData.monthly_spend_maximum || 1000,
      active: true,
      profile_completed: false
    };

    // Create client record
    const { data: client, error: clientError } = await supabaseClient
      .from('clients')
      .insert(clientData)
      .select()
      .single();

    if (clientError) {
      console.error('Error creating client:', clientError);
      
      // Clean up user if client creation fails
      await supabaseClient.auth.admin.deleteUser(authData.user.id);
      
      return new Response(
        JSON.stringify({ error: 'Failed to create client record', details: clientError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully created client:', client.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Client created successfully',
        client_id: client.id,
        user_id: authData.user.id,
        email: client.email,
        company_name: client.company_name
      }),
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in client webhook:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // SECURITY: Require admin authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('Invalid token:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if requesting user is admin
    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin');

    if (!roles || roles.length === 0) {
      console.error('User lacks admin role:', user.id);
      await supabaseAdmin.from('security_events').insert({
        event_type: 'unauthorized_test_user_creation_attempt',
        severity: 'high',
        user_id: user.id,
        endpoint: '/functions/v1/create-test-user',
        success: false,
        error_message: 'Non-admin user attempted to create test user'
      });
      
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, password, role, userType } = await req.json();

    // Validate inputs
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create user with admin client (bypasses email verification)
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: 'Test',
        last_name: 'User'
      }
    });

    if (userError) {
      console.error('Error creating user:', userError);
      return new Response(
        JSON.stringify({ error: userError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = userData.user.id;

    // Assign role if provided (default to 'admin')
    const userRole = role || 'admin';
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: userId, role: userRole });

    if (roleError) {
      console.error('Error assigning role:', roleError);
      // Don't fail the entire operation, just log it
    }

    // Create appropriate profile based on userType
    if (userType === 'client') {
      const { error: clientError } = await supabaseAdmin
        .from('clients')
        .insert({
          user_id: userId,
          contact_name: 'Test User',
          company_name: 'Test Company',
          email,
          phone: '+15551234567',
          active: true,
          credits_balance: 1000,
          has_payment_method: true,
          onboarding_completed: true
        });

      if (clientError) {
        console.error('Error creating client profile:', clientError);
      }
    } else if (userType === 'pro') {
      const { error: proError } = await supabaseAdmin
        .from('pros')
        .insert({
          user_id: userId,
          first_name: 'Test',
          last_name: 'User',
          full_name: 'Test User',
          email,
          phone: '+15551234567',
          pipeline_stage: 'match_ready',
          motivation: 8,
          wants: ['opportunities', 'leads'],
          cities: ['Los Angeles'],
          states: ['CA'],
          transactions: 25,
          years_experience: 5,
          qualification_score: 85,
          active: true
        });

      if (proError) {
        console.error('Error creating pro profile:', proError);
      }
    }

    console.log('Test user created successfully:', {
      id: userId,
      email,
      role: userRole,
      type: userType || 'admin'
    });

    // Log security event
    await supabaseAdmin.from('security_events').insert({
      event_type: 'test_user_created',
      severity: 'medium',
      user_id: user.id,
      endpoint: '/functions/v1/create-test-user',
      success: true,
      metadata: {
        created_user_id: userId,
        created_user_email: email,
        created_user_role: userRole,
        created_user_type: userType || 'admin'
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userId,
          email,
          role: userRole,
          type: userType || 'admin'
        },
        message: 'Test user created successfully. You can now log in with the provided credentials.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

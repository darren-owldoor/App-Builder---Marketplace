import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
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

    // Verify the requesting user is admin
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const hasAdminRole = roles?.some(r => r.role === 'admin');
    if (!hasAdminRole) {
      throw new Error('Unauthorized: Admin role required');
    }

    // Get request body
    const { first_name, last_name, email, password, company, role } = await req.json();

    if (!email || !first_name || !last_name) {
      throw new Error('Email, first name, and last name are required');
    }

    const full_name = `${first_name} ${last_name}`.trim();

    // Create user account
    const userCreateData: any = {
      email,
      email_confirm: true,
      user_metadata: {
        full_name,
        first_name,
        last_name,
      },
    };

    // Add password if provided
    if (password) {
      userCreateData.password = password;
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser(userCreateData);

    if (authError) throw authError;

    // Remove default lead role
    await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', authData.user.id)
      .eq('role', 'lead');

    // Assign requested role (default to staff)
    const userRole = role || 'staff';
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: userRole,
      });

    if (roleError) throw roleError;

    // Update profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        first_name,
        last_name,
        full_name,
      })
      .eq('id', authData.user.id);

    if (profileError) console.error('Profile update error:', profileError);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          full_name,
          role: userRole,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating staff user:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
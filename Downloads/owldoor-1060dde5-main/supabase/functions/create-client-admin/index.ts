import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schema
const createClientSchema = z.object({
  company_name: z.string().trim().min(1).max(200),
  contact_name: z.string().trim().max(200).optional(),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(20).optional(),
  package_id: z.string().uuid().optional(),
  password: z.string().min(8).max(100).optional(),
  first_name: z.string().trim().max(100).optional(),
  last_name: z.string().trim().max(100).optional(),
  cities: z.array(z.string().max(100)).optional(),
  states: z.array(z.string().max(2)).optional(),
  zip_codes: z.array(z.string().max(10)).optional(),
  county: z.string().max(100).optional(),
  years_experience: z.number().int().min(0).max(100).optional(),
  yearly_sales: z.number().int().min(0).optional(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    
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

    // Rate limiting: 10 account creations per hour per IP
    const { data: rateLimitOk } = await supabaseAdmin.rpc('check_rate_limit', {
      p_identifier: ipAddress,
      p_endpoint: 'create-client-admin',
      p_max_requests: 10,
      p_window_minutes: 60
    });

    if (!rateLimitOk) {
      return new Response(
        JSON.stringify({ error: 'Too many account creation attempts. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the requesting user is staff
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

    const hasStaffRole = roles?.some(r => r.role === 'staff' || r.role === 'admin');
    if (!hasStaffRole) {
      throw new Error('Unauthorized: Staff role required');
    }

    // Get and validate request body
    const rawData = await req.json();
    const validationResult = createClientSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request data',
          details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { company_name, contact_name, email, phone, package_id, password, first_name, last_name, cities, states, zip_codes, county, years_experience, yearly_sales } = validationResult.data;
    
    // Generate cryptographically secure random password
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    const passwordArray = new Uint8Array(16);
    crypto.getRandomValues(passwordArray);
    const temporaryPassword = Array.from(passwordArray)
      .map(x => chars[x % chars.length])
      .join('');

    // Create user account with admin privileges
    const userCreateData: any = {
      email,
      email_confirm: true,
      user_metadata: {
        full_name: contact_name || '',
        first_name: first_name || '',
        last_name: last_name || '',
      },
    };

    // Use provided password or secure temporary password
    userCreateData.password = password || temporaryPassword;

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser(userCreateData);

    if (authError) throw authError;

    // Assign client role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: 'client',
      });

    if (roleError) throw roleError;

    // Remove default lead role
    await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', authData.user.id)
      .eq('role', 'lead');

    const clientInsertData: any = {
      user_id: authData.user.id,
      company_name,
      contact_name: contact_name || company_name,
      email,
      phone: phone || null,
      current_package_id: package_id || null,
      client_type: 'real_estate',
      password_change_required: !password, // Require password change if using temporary password
    };

    // Add optional fields if provided
    if (first_name) clientInsertData.first_name = first_name;
    if (last_name) clientInsertData.last_name = last_name;
    if (cities) clientInsertData.cities = cities;
    if (states) clientInsertData.states = states;
    if (zip_codes) clientInsertData.zip_codes = zip_codes;
    if (county) clientInsertData.county = county;
    if (years_experience) clientInsertData.years_experience = years_experience;
    if (yearly_sales) clientInsertData.yearly_sales = yearly_sales;

    const { data: clientData, error: clientError } = await supabaseAdmin
      .from('clients')
      .insert(clientInsertData)
      .select()
      .single();

    if (clientError) throw clientError;

    // AUTO-CREATE iMessage integration secret for this client
    try {
      const iMessageToken = crypto.randomUUID() + "-" + crypto.randomUUID();
      const { error: iMessageError } = await supabaseAdmin
        .from('imessage_secrets')
        .insert({
          user_id: authData.user.id,
          secret_token: iMessageToken,
          active: true,
        });

      if (iMessageError) {
        console.error('[CREATE-CLIENT] Failed to create iMessage secret:', iMessageError);
      } else {
        console.log('[CREATE-CLIENT] Auto-created iMessage integration for client');
      }
    } catch (iMessageErr) {
      console.error('[CREATE-CLIENT] Error setting up iMessage:', iMessageErr);
      // Don't fail client creation if iMessage setup fails
    }

    // If package selected, get package details for payment link
    let paymentLinkResult = null;
    if (package_id) {
      const { data: packageData } = await supabaseAdmin
        .from('pricing_packages')
        .select('name, monthly_cost')
        .eq('id', package_id)
        .single();

      if (packageData) {
        const { data, error } = await supabaseAdmin.functions.invoke('create-payment-link', {
          body: {
            client_id: clientData.id,
            amount: packageData.monthly_cost,
            description: `${packageData.name} - Monthly Subscription`,
            send_via: 'email',
            email_message: `Welcome to OwlDoor! We've set up your ${packageData.name} package. Please complete payment to activate your subscription.`,
          },
        });

        paymentLinkResult = data;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        client: clientData,
        payment_link: paymentLinkResult,
        temporary_password: password ? undefined : temporaryPassword, // Only return if auto-generated
        password_change_required: !password,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating client:', error);
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

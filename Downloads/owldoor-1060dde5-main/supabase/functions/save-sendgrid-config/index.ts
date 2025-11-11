import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendGridConfig {
  provider: string;
  config: {
    api_key?: string;
    from_email: string;
    from_name: string;
  };
  use_for_clients?: boolean;
  use_for_admin?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin or staff
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'staff'])
      .maybeSingle();

    if (!roles) {
      throw new Error('Unauthorized: Admin or Staff access required');
    }

    const { provider, config, use_for_clients, use_for_admin }: SendGridConfig = await req.json();

    if (provider !== 'sendgrid') {
      throw new Error('Invalid provider');
    }

    // Prepare the config for storage
    const configToStore: any = {
      from_email: config.from_email,
      from_name: config.from_name,
    };

    // If API key is provided, encrypt and store it
    if (config.api_key) {
      configToStore.api_key_encrypted = config.api_key; // In production, encrypt this
    }

    const { error: upsertError } = await supabase
      .from('email_configs')
      .upsert({
        provider,
        config: configToStore,
        is_configured: true,
        use_for_clients: use_for_clients ?? true,
        use_for_admin: use_for_admin ?? true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'provider',
      });

    if (upsertError) {
      throw upsertError;
    }

    console.log('SendGrid configuration saved successfully');

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error saving SendGrid config:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

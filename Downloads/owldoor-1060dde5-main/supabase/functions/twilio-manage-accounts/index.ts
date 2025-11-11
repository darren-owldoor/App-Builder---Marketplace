import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin');

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, account } = await req.json();

    switch (action) {
      case 'list':
        const { data: accounts, error: listError } = await supabase
          .from('twilio_accounts')
          .select('*')
          .order('created_at', { ascending: false });

        if (listError) throw listError;

        return new Response(JSON.stringify({ accounts }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'create':
        const { data: newAccount, error: createError } = await supabase
          .from('twilio_accounts')
          .insert({
            account_name: account.account_name,
            account_sid: account.account_sid,
            auth_token: account.auth_token,
            is_default: account.is_default || false,
            created_by: user.id,
          })
          .select()
          .single();

        if (createError) throw createError;

        return new Response(JSON.stringify({ account: newAccount }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'update':
        const { data: updatedAccount, error: updateError } = await supabase
          .from('twilio_accounts')
          .update({
            account_name: account.account_name,
            account_sid: account.account_sid,
            auth_token: account.auth_token,
            is_default: account.is_default,
            active: account.active,
          })
          .eq('id', account.id)
          .select()
          .single();

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ account: updatedAccount }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'delete':
        const { error: deleteError } = await supabase
          .from('twilio_accounts')
          .delete()
          .eq('id', account.id);

        if (deleteError) throw deleteError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'set_default':
        // Unset all defaults first
        await supabase
          .from('twilio_accounts')
          .update({ is_default: false })
          .neq('id', account.id);

        // Set new default
        const { data: defaultAccount, error: defaultError } = await supabase
          .from('twilio_accounts')
          .update({ is_default: true })
          .eq('id', account.id)
          .select()
          .single();

        if (defaultError) throw defaultError;

        return new Response(JSON.stringify({ account: defaultAccount }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Error managing Twilio accounts:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { token } = await req.json();
    
    if (!token) {
      throw new Error('Token is required');
    }

    console.log('Verifying magic link token:', token);

    // Find the magic link
    const { data: magicLink, error: findError } = await supabase
      .from('admin_magic_links')
      .select('*')
      .eq('token', token)
      .is('used_at', null)
      .maybeSingle();

    if (findError) {
      console.error('Database error finding magic link:', findError);
      throw new Error('Database error: ' + findError.message);
    }

    if (!magicLink) {
      console.error('Magic link not found or already used for token:', token);
      
      // Check if the link exists but was used
      const { data: usedLink } = await supabase
        .from('admin_magic_links')
        .select('used_at, expires_at')
        .eq('token', token)
        .maybeSingle();
      
      if (usedLink?.used_at) {
        throw new Error('This magic link has already been used');
      }
      
      throw new Error('Invalid magic link. Please request a new one.');
    }

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(magicLink.expires_at);
    
    if (now > expiresAt) {
      console.error('Magic link expired');
      throw new Error('Magic link has expired');
    }

    console.log('Magic link valid, marking as used for user:', magicLink.target_user_id);

    // Mark as used
    const { error: updateError } = await supabase
      .from('admin_magic_links')
      .update({ used_at: now.toISOString() })
      .eq('id', magicLink.id);

    if (updateError) {
      console.error('Error marking magic link as used:', updateError);
    }

    // Generate a magic link for the target user using Supabase Auth
    const { data: { user: targetUser }, error: getUserError } = await supabase.auth.admin.getUserById(magicLink.target_user_id);

    if (getUserError || !targetUser) {
      console.error('Error getting target user:', getUserError);
      throw new Error('Failed to get user information');
    }

    // Generate an auth link for the user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: targetUser.email || '',
    });

    if (sessionError || !sessionData) {
      console.error('Error generating session:', sessionError);
      throw new Error('Failed to generate session');
    }

    console.log('Session generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        redirectUrl: sessionData.properties.action_link
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
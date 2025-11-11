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

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get the user from the auth token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    console.log('Checking admin access for user:', user.id);

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      console.error('User is not admin:', user.id);
      throw new Error('Admin access required');
    }

    // Get target user ID from request
    const { targetUserId } = await req.json();
    
    if (!targetUserId) {
      throw new Error('Target user ID is required');
    }

    console.log('Generating magic link for user:', targetUserId);

    // Verify target user exists
    const { data: targetUser, error: targetUserError } = await supabase.auth.admin.getUserById(targetUserId);
    
    if (targetUserError || !targetUser) {
      throw new Error('Target user not found');
    }

    // Generate a secure random token
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const token_str = Array.from(tokenBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Calculate expiry (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Store the magic link
    const { data: magicLink, error: insertError } = await supabase
      .from('admin_magic_links')
      .insert({
        created_by: user.id,
        target_user_id: targetUserId,
        token: token_str,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating magic link:', insertError);
      throw new Error('Failed to create magic link');
    }

    // Get the app URL (use the origin from the request)
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'https://owldoor.lovable.app';
    const magicLinkUrl = `${origin}/magic-link?token=${token_str}`;

    console.log('Magic link generated successfully:', magicLink.id);

    return new Response(
      JSON.stringify({
        success: true,
        magicLink: magicLinkUrl,
        expiresAt: expiresAt.toISOString(),
        targetUserEmail: targetUser.user.email
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
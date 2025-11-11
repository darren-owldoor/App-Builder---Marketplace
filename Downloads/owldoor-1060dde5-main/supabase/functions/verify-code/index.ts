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
    const { code, email, password } = await req.json();

    if (!code || !email) {
      throw new Error('Code and email are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('Verifying code for email:', email);

    // Find the verification code (case-insensitive email match)
    const { data: codeRecord, error: findError } = await supabaseAdmin
      .from('magic_links')
      .select('*')
      .eq('code', code)
      .ilike('email', email)
      .single();

    if (findError || !codeRecord) {
      console.error('Code not found:', findError);
      return new Response(
        JSON.stringify({ error: 'Invalid verification code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if code has expired
    const now = new Date();
    const expiresAt = new Date(codeRecord.expires_at);
    
    if (now > expiresAt) {
      // Delete expired code
      await supabaseAdmin
        .from('magic_links')
        .delete()
        .eq('id', codeRecord.id);

      return new Response(
        JSON.stringify({ error: 'Verification code has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check attempts (max 5 attempts)
    if (codeRecord.attempts >= 5) {
      await supabaseAdmin
        .from('magic_links')
        .delete()
        .eq('id', codeRecord.id);

      return new Response(
        JSON.stringify({ error: 'Too many verification attempts. Please request a new code.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Increment attempts
    await supabaseAdmin
      .from('magic_links')
      .update({ attempts: codeRecord.attempts + 1 })
      .eq('id', codeRecord.id);

    // If password is provided, update it now
    if (password) {
      if (password.length < 6) {
        return new Response(
          JSON.stringify({ error: 'Password must be at least 6 characters' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user_id exists
      if (!codeRecord.user_id) {
        console.error('No user_id found in code record');
        return new Response(
          JSON.stringify({ error: 'Invalid verification code - no user associated' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Updating password for user:', codeRecord.user_id);

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        codeRecord.user_id,
        { password: password }
      );

      if (updateError) {
        console.error('Error updating password:', {
          message: updateError.message,
          status: updateError.status,
          code: updateError.code,
          userId: codeRecord.user_id
        });
        
        // Return a user-friendly error message
        return new Response(
          JSON.stringify({ 
            error: 'Failed to set password. Please try again or contact support.',
            details: updateError.message 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Delete the code after successful password update
      await supabaseAdmin
        .from('magic_links')
        .delete()
        .eq('id', codeRecord.id);

      console.log('Password updated successfully for user:', codeRecord.user_id);

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Password set successfully',
          userId: codeRecord.user_id,
          agentId: codeRecord.agent_id
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Code is valid - delete it so it can't be reused
    await supabaseAdmin
      .from('magic_links')
      .delete()
      .eq('id', codeRecord.id);

    console.log('Code verified successfully for user:', codeRecord.user_id);

    return new Response(
      JSON.stringify({ 
        success: true,
        userId: codeRecord.user_id,
        agentId: codeRecord.agent_id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in verify-code:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    
    // Log detailed error for monitoring
    console.error('Full error details:', {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

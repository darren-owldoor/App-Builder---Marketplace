import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Check2FARequest {
  email: string;
  ipAddress: string;
  userAgent?: string;
}

interface Verify2FARequest {
  verificationId: string;
  code: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, email, ipAddress, userAgent, verificationId, code } = await req.json();

    if (action === 'check') {
      return await handleCheck2FA(supabase, { email, ipAddress, userAgent });
    } else if (action === 'verify') {
      return await handleVerify2FA(supabase, { verificationId, code });
    } else {
      throw new Error('Invalid action');
    }

  } catch (error: any) {
    console.error('Error in check-2fa-required:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});

async function handleCheck2FA(supabase: any, { email, ipAddress, userAgent }: Check2FARequest) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  console.log('Checking 2FA requirement for:', email.split('@')[1], 'from IP:', ipAddress.substring(0, 8) + '...');

  // Get user by email
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) throw authError;

  const user = authData.users.find((u: any) => u.email === email);
  if (!user) {
    return new Response(
      JSON.stringify({ requires2FA: false, message: 'User not found' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check if user is admin
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .single();

  if (!roleData) {
    // Not an admin, no 2FA required
    return new Response(
      JSON.stringify({ requires2FA: false, userId: user.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check if IP is trusted
  const { data: trustedIP } = await supabase
    .from('user_trusted_ips')
    .select('id')
    .eq('user_id', user.id)
    .eq('ip_address', ipAddress)
    .eq('is_active', true)
    .single();

  if (trustedIP) {
    // Update last_used_at
    await supabase
      .from('user_trusted_ips')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', trustedIP.id);

    return new Response(
      JSON.stringify({ requires2FA: false, userId: user.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check rate limiting
  const { data: rateLimit } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('identifier', ipAddress)
    .eq('endpoint', '2fa-check')
    .gte('window_start', new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .single();

  if (rateLimit && rateLimit.attempt_count >= 5) {
    return new Response(
      JSON.stringify({ 
        requires2FA: false, 
        error: 'Too many 2FA attempts. Please try again later.',
        rateLimited: true 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 429
      }
    );
  }

  // Update rate limit
  if (rateLimit) {
    await supabase
      .from('rate_limits')
      .update({ 
        attempt_count: rateLimit.attempt_count + 1,
        window_start: new Date().toISOString()
      })
      .eq('id', rateLimit.id);
  } else {
    await supabase
      .from('rate_limits')
      .insert({
        identifier: ipAddress,
        endpoint: '2fa-check',
        attempt_count: 1,
        window_start: new Date().toISOString()
      });
  }

  // Get admin's phone number from profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('phone')
    .eq('id', user.id)
    .single();

  const phoneNumber = profile?.phone;
  
  if (!phoneNumber) {
    return new Response(
      JSON.stringify({ 
        requires2FA: false, 
        error: 'Admin phone number not configured. Please update your profile.',
        userId: user.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // New IP for admin - send cryptographically secure 2FA code
  const codeArray = new Uint32Array(1);
  crypto.getRandomValues(codeArray);
  const code = (codeArray[0] % 900000 + 100000).toString();
  
  // Store verification record
  const { data: verification, error: verifyError } = await supabase
    .from('two_factor_verifications')
    .insert({
      user_id: user.id,
      ip_address: ipAddress,
      verification_code: code,
      phone_number: phoneNumber,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
    })
    .select()
    .single();

  if (verifyError) throw verifyError;

  // Send SMS via existing SMS provider
  try {
    const smsResponse = await fetch(`${supabaseUrl}/functions/v1/send-sms-provider`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        to: phoneNumber,
        message: `OwlDoor Security: Your verification code is ${code}. This code expires in 10 minutes. Login from new IP: ${ipAddress}`,
        context: 'admin',
      }),
    });

    if (!smsResponse.ok) {
      const errorData = await smsResponse.json();
      console.error('SMS send failed:', errorData);
      throw new Error('Failed to send verification code');
    }

    console.log('2FA code sent successfully to:', phoneNumber.slice(-4));
  } catch (smsError) {
    console.error('Error sending SMS:', smsError);
    // Delete the verification record if SMS fails
    await supabase
      .from('two_factor_verifications')
      .delete()
      .eq('id', verification.id);
    
    throw new Error('Failed to send verification code. Please try again.');
  }

  return new Response(
    JSON.stringify({ 
      requires2FA: true, 
      verificationId: verification.id,
      userId: user.id,
      expiresAt: verification.expires_at
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleVerify2FA(supabase: any, { verificationId, code }: Verify2FARequest) {
  console.log('Verifying 2FA code for verification:', verificationId.substring(0, 8) + '...');

  // Get verification record
  const { data: verification, error: verifyError } = await supabase
    .from('two_factor_verifications')
    .select('*')
    .eq('id', verificationId)
    .single();

  if (verifyError || !verification) {
    return new Response(
      JSON.stringify({ verified: false, error: 'Verification not found' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404
      }
    );
  }

  // Check if already used
  if (verification.is_used) {
    return new Response(
      JSON.stringify({ verified: false, error: 'Code already used' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }

  // Check if expired
  if (new Date(verification.expires_at) < new Date()) {
    return new Response(
      JSON.stringify({ verified: false, error: 'Code expired' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }

  // Check attempts
  if (verification.attempts >= verification.max_attempts) {
    return new Response(
      JSON.stringify({ verified: false, error: 'Too many attempts' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }

  // Verify code
  if (verification.verification_code !== code) {
    // Increment attempts
    await supabase
      .from('two_factor_verifications')
      .update({ attempts: verification.attempts + 1 })
      .eq('id', verificationId);

    return new Response(
      JSON.stringify({ 
        verified: false, 
        error: 'Invalid code',
        attemptsRemaining: verification.max_attempts - verification.attempts - 1
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }

  // Code is valid - mark as used
  await supabase
    .from('two_factor_verifications')
    .update({ 
      is_used: true,
      verified_at: new Date().toISOString()
    })
    .eq('id', verificationId);

  // Add IP to trusted list
  await supabase
    .from('user_trusted_ips')
    .insert({
      user_id: verification.user_id,
      ip_address: verification.ip_address,
      first_seen_at: new Date().toISOString(),
      last_used_at: new Date().toISOString(),
    });

  console.log('2FA verified successfully, IP added to trusted list');

  return new Response(
    JSON.stringify({ 
      verified: true,
      userId: verification.user_id
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

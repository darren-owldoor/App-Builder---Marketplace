import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schemas
const sendCodeSchema = z.object({
  action: z.literal('send'),
  sessionId: z.string().uuid(),
  phone: z.string().trim().min(10).max(20).regex(/^[\d\s\-\+\(\)]+$/),
});

const verifyCodeSchema = z.object({
  action: z.literal('verify'),
  sessionId: z.string().uuid(),
  code: z.string().trim().length(6).regex(/^\d{6}$/),
});

serve(async (req) => {
  console.log("=== agent-verify-phone function called ===");
  console.log("Method:", req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    
    const rawBody = await req.json();
    console.log("Request action:", rawBody.action, "SessionId:", rawBody.sessionId?.substring(0, 8) + "...");
    
    // Validate based on action
    let validationResult;
    if (rawBody.action === 'send') {
      validationResult = sendCodeSchema.safeParse(rawBody);
    } else if (rawBody.action === 'verify') {
      validationResult = verifyCodeSchema.safeParse(rawBody);
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Must be "send" or "verify"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    const { action, sessionId, phone, code } = validationResult.data as any;
    
    console.log("Action:", action);
    console.log("SessionId:", sessionId.substring(0, 8) + "...");
    console.log("Phone (last 4):", phone.slice(-4));
    console.log("Code provided:", !!code);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log("Supabase client created successfully");

    if (action === 'send') {
      // Rate limiting: 5 verification codes per hour per IP
      const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
        p_identifier: ipAddress,
        p_endpoint: 'agent-verify-phone',
        p_max_requests: 5,
        p_window_minutes: 60
      });

      if (!rateLimitOk) {
        return new Response(
          JSON.stringify({ error: 'Too many verification attempts. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate cryptographically secure 6-digit code
      const codeArray = new Uint32Array(1);
      crypto.getRandomValues(codeArray);
      const verificationCode = (codeArray[0] % 900000 + 100000).toString();
      
      // Store code in agent_sessions
      const { error: updateError } = await supabase
        .from('agent_sessions')
        .update({ 
          verification_code: verificationCode,
          verification_phone: phone,
          verification_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 min
        })
        .eq('session_id', sessionId);

      if (updateError) {
        console.error('Error storing verification code:', updateError);
        throw updateError;
      }

      // Send SMS via Twilio
      const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_BACKUP_ACCOUNT_SID');
      const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_BACKUP_AUTH_TOKEN');
      const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_BACKUP_PHONE_NUMBER');

      if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
        throw new Error('Twilio credentials not configured');
      }

      const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
      
      // Ensure phone has +1 prefix for Twilio
      const formattedPhone = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;
      
      const twilioResponse = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: formattedPhone,
            From: TWILIO_PHONE_NUMBER,
            Body: `Your OwlDoor verification code is: ${verificationCode}`,
          }),
        }
      );

      if (!twilioResponse.ok) {
        const error = await twilioResponse.text();
        console.error('Twilio error:', error);
        throw new Error(`Failed to send SMS: ${error}`);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Verification code sent' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'verify') {
      console.log("=== Verifying code ===");
      console.log("Looking up session:", sessionId);
      
      // Verify code
      const { data: session, error: sessionError } = await supabase
        .from('agent_sessions')
        .select('verification_code, verification_phone, verification_expires_at, verified')
        .eq('session_id', sessionId)
        .single();

      console.log("Session lookup result:", { session, sessionError });

      if (sessionError || !session) {
        console.error("Session not found:", sessionError);
        throw new Error('Session not found');
      }

      if (session.verified) {
        console.log("Session already verified");
        return new Response(
          JSON.stringify({ success: true, message: 'Already verified' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log("Checking expiration...");
      console.log("Expires at:", session.verification_expires_at);
      console.log("Current time:", new Date().toISOString());
      
      if (new Date(session.verification_expires_at) < new Date()) {
        console.log("Code expired");
        return new Response(
          JSON.stringify({ success: false, message: 'Verification code expired' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log("Comparing codes...");
      // SECURITY: Never log verification codes in plaintext
      console.log("Code comparison for session:", sessionId.substring(0, 8) + "...");
      
      if (session.verification_code !== code) {
        console.log("Code mismatch!");
        return new Response(
          JSON.stringify({ success: false, message: 'Invalid verification code' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log("Code matches! Marking as verified...");
      // Mark as verified
      const { error: verifyError } = await supabase
        .from('agent_sessions')
        .update({ verified: true })
        .eq('session_id', sessionId);

      if (verifyError) {
        console.error('Error marking as verified:', verifyError);
        throw verifyError;
      }

      console.log("Verification successful!");
      return new Response(
        JSON.stringify({ success: true, message: 'Phone verified successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in agent-verify-phone:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

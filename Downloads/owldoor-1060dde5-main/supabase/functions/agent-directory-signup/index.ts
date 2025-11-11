import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schema
const signupSchema = z.object({
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(10).max(20).regex(/^[\d\s\-\+\(\)]+$/),
  license: z.string().trim().max(50).optional(),
  specialization: z.string().trim().max(200).optional(),
  account_type: z.string().trim().max(50).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  company_name: z.string().trim().max(200).optional(),
  team_size: z.string().trim().max(50).optional(),
  branch_size: z.string().trim().max(50).optional(),
  looking_for: z.string().trim().max(1000).optional(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    
    const rawData = await req.json();
    
    // Validate request data
    const validationResult = signupSchema.safeParse(rawData);
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

    const { first_name, last_name, email, phone, license, specialization, account_type, city, state, company_name, team_size, branch_size, looking_for } = validationResult.data;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY');

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Rate limiting: 10000 signups per hour per IP (increased for testing/development)
    // Note: For production, consider adding captcha for additional security
    const { data: rateLimitOk } = await supabaseAdmin.rpc('check_rate_limit', {
      p_identifier: ipAddress,
      p_endpoint: 'agent-directory-signup',
      p_max_requests: 10000,
      p_window_minutes: 60
    });

    if (!rateLimitOk) {
      console.log('Rate limit exceeded for IP:', ipAddress);
      return new Response(
        JSON.stringify({ error: 'Too many signup attempts. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Checking for existing agent with email domain:', email.split('@')[1], 'phone (last 4):', phone.slice(-4));

    // Check if agent exists by license, phone, or email
    let query = supabaseAdmin
      .from('pros')
      .select('*')
      .or(`email.eq.${email},phone.eq.${phone}`);
    
    if (license) {
      query = query.or(`license.eq.${license},license_number.eq.${license},state_license.eq.${license}`);
    }

    const { data: existingAgents, error: searchError } = await query.limit(1).single();

    if (searchError && searchError.code !== 'PGRST116') {
      console.error('Error searching for agent:', searchError);
    }

    let userId: string;
    let agentId: string;
    let isExisting = false;

    if (existingAgents) {
      console.log('Found existing agent:', existingAgents.id);
      isExisting = true;
      agentId = existingAgents.id;

      // Store pending updates for after password creation
      const pendingData = {
        first_name,
        last_name,
        email,
        phone,
        ...(license && { license }),
        ...(specialization && { specialization }),
        ...(company_name && { company_name }),
        ...(city && { city }),
        ...(state && { state }),
        ...(team_size && { team_size }),
        ...(branch_size && { branch_size }),
        ...(looking_for && { looking_for })
      };

      await supabaseAdmin
        .from('pros')
        .update({ 
          notes: `Pending signup data: ${JSON.stringify(pendingData)}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', agentId);

      if (existingAgents.user_id) {
        // Has auth account, send password reset
        userId = existingAgents.user_id;
        console.log('Agent has user_id, sending password reset');
      } else {
        // Create auth account and link
        const tempPassword = crypto.randomUUID();
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { first_name, last_name }
        });

        if (createError) throw createError;
        userId = newUser.user.id;

        // Assign user role based on specialization
        // Real estate agents get 'lead' role, mortgage brokers get 'client' role
        const userRole = specialization === 'mortgage' ? 'client' : 'lead';
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: userId,
            role: userRole
          });

        if (roleError) {
          console.error('Error assigning role:', roleError);
        } else {
          console.log(`Assigned ${userRole} role to existing agent's new user`);
        }

        // Link user to agent
        await supabaseAdmin
          .from('pros')
          .update({ user_id: userId })
          .eq('id', agentId);
        
        console.log('Created auth user and linked to existing agent');
      }
    } else {
      // Create new agent and auth account
      console.log('Creating new agent and auth account');
      
      const tempPassword = crypto.randomUUID();
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { first_name, last_name }
      });

      if (createError) {
        // Handle case where email already exists in auth but not in pros
        if (createError.message?.includes('already been registered') || createError.message?.includes('email_exists')) {
          return new Response(
            JSON.stringify({ 
              error: 'An account with this email already exists. Please sign in or use the "Forgot Password" option to reset your password.',
              errorCode: 'EMAIL_EXISTS'
            }),
            { 
              status: 409,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }
        throw createError;
      }
      userId = newUser.user.id;

      // Assign user role based on specialization
      // Real estate agents get 'lead' role, mortgage brokers get 'client' role
      const userRole = specialization === 'mortgage' ? 'client' : 'lead';
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: userId,
          role: userRole
        });

      if (roleError) {
        console.error('Error assigning role:', roleError);
        // Don't throw - continue with signup
      } else {
        console.log(`Assigned ${userRole} role to user`);
      }

      // Create agent record
      const { data: newAgent, error: agentError } = await supabaseAdmin
        .from('pros')
        .insert({
          user_id: userId,
          first_name,
          last_name,
          email,
          phone,
          full_name: `${first_name} ${last_name}`,
          ...(license && { license }),
          ...(specialization && { specialization }),
          ...(company_name && { company_name }),
          ...(city && { city }),
          ...(state && { state }),
          ...(team_size && { notes: `Team Size: ${team_size}` }),
          ...(branch_size && { notes: `Branch Size: ${branch_size}` }),
          ...(looking_for && { wants: looking_for }),
          status: 'new',
          pipeline_stage: 'new',
          pipeline_type: 'staff',
          source: 'directory',
          matching_completed: false,
          market_coverage_completed: false
        })
        .select()
        .single();

      if (agentError) throw agentError;
      agentId = newAgent.id;
      console.log('Created new agent record:', agentId);
    }

    // Generate cryptographically secure 5-digit verification code
    const codeArray = new Uint32Array(1);
    crypto.getRandomValues(codeArray);
    const verificationCode = (codeArray[0] % 90000 + 10000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiration
    
    // Store verification code in database
    const { error: codeError } = await supabaseAdmin
      .from('magic_links')
      .insert({
        code: verificationCode,
        user_id: userId,
        agent_id: agentId,
        email: email,
        expires_at: expiresAt.toISOString(),
        attempts: 0
      });

    if (codeError) {
      console.error('Error creating verification code:', codeError);
      throw codeError;
    }

    console.log('Generated verification code');

    // Send email via SendGrid
    if (sendGridApiKey) {
      const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendGridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email }],
            subject: isExisting ? 'Your OwlDoor Verification Code' : 'Welcome to OwlDoor - Your Verification Code',
          }],
          from: {
            email: 'noreply@owldoor.com',
            name: 'OwlDoor'
          },
          content: [{
            type: 'text/html',
            value: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                  <h1 style="color: white; margin: 0;">${isExisting ? 'Your Verification Code' : 'Welcome to OwlDoor!'}</h1>
                </div>
                <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                  <p style="font-size: 16px;">Hello ${first_name},</p>
                  <p style="font-size: 16px;">${isExisting ? 'We found your profile in our directory. Use this code to verify your account.' : 'Thank you for joining OwlDoor! Use this code to verify your account.'}</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <div style="background: white; 
                                border: 3px solid #667eea; 
                                padding: 20px 40px; 
                                border-radius: 10px; 
                                display: inline-block;">
                      <p style="margin: 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Your Code</p>
                      <p style="margin: 10px 0 0 0; font-size: 42px; font-weight: bold; letter-spacing: 8px; color: #667eea;">${verificationCode}</p>
                    </div>
                  </div>
                  <p style="font-size: 14px; color: #666; text-align: center;">Enter this code to complete your sign up</p>
                  <p style="font-size: 14px; color: #666;">Questions? Contact us at Hello@OwlDoor.com</p>
                  <p style="font-size: 14px; color: #666;">This code will expire in 10 minutes for security reasons.</p>
                  <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                  <p style="font-size: 12px; color: #999; text-align: center;">
                    © ${new Date().getFullYear()} OwlDoor. All rights reserved.
                  </p>
                </div>
              </body>
              </html>
            `
          }]
        })
      });

      if (!emailResponse.ok) {
        console.error('SendGrid error:', await emailResponse.text());
      } else {
        console.log('Email sent successfully');
      }
    }

    // Send SMS - try backup Twilio first, fallback to primary
    let twilioAccountSid = Deno.env.get('TWILIO_BACKUP_ACCOUNT_SID') || Deno.env.get('TWILIO_ACCOUNT_SID');
    let twilioAuthToken = Deno.env.get('TWILIO_BACKUP_AUTH_TOKEN') || Deno.env.get('TWILIO_AUTH_TOKEN');
    let twilioPhoneNumber = Deno.env.get('TWILIO_BACKUP_PHONE_NUMBER') || Deno.env.get('TWILIO_PHONE_NUMBER');

    console.log('Twilio Config Check:', {
      hasAccountSid: !!twilioAccountSid,
      hasAuthToken: !!twilioAuthToken,
      hasPhoneNumber: !!twilioPhoneNumber,
      phoneNumber: twilioPhoneNumber ? twilioPhoneNumber.slice(0, 5) + '***' : 'none'
    });

    if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
      try {
        // Ensure phone has +1 prefix for Twilio
        const formattedPhone = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;
        const smsBody = `OwlDoor: Your verification code is ${verificationCode}. Valid for 10 minutes.`;
        
        console.log('Attempting to send SMS to:', formattedPhone.slice(0, 5) + '***');
        
        const twilioResponse = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: formattedPhone,
              From: twilioPhoneNumber,
              Body: smsBody,
            }),
          }
        );

        const responseText = await twilioResponse.text();
        if (twilioResponse.ok) {
          console.log('SMS sent successfully:', responseText);
        } else {
          console.error('Failed to send SMS. Status:', twilioResponse.status, 'Response:', responseText);
        }
      } catch (smsError) {
        console.error('Error sending SMS:', smsError);
      }
    } else {
      console.log('Twilio not configured - SMS will not be sent');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: isExisting ? 'Found your profile! Check your email and phone for your verification code.' : 'Account created! Check your email and phone for your verification code.',
        isExisting,
        agentId,
        email: email,
        specialization: specialization
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in agent-directory-signup:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

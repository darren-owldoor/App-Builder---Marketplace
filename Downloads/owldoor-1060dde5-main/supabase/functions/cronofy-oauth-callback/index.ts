import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      throw new Error(`OAuth error: ${error}`);
    }

    if (!code) {
      throw new Error('No authorization code received');
    }

    const clientId = Deno.env.get('CRONOFY_CLIENT_ID');
    const clientSecret = Deno.env.get('CRONOFY_CLIENT_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/cronofy-oauth-callback`;

    if (!clientId || !clientSecret) {
      throw new Error('Cronofy credentials not configured');
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://api.cronofy.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange error:', errorText);
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();
    console.log('Successfully obtained Cronofy tokens');

    // Get user info from Cronofy
    const profileResponse = await fetch('https://api.cronofy.com/v1/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      throw new Error('Failed to fetch Cronofy user info');
    }

    const profile = await profileResponse.json();

    // If we have authorization header, save to database
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);

      if (userError || !user) {
        throw new Error('Authentication required');
      }

      // Calculate token expiry
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

      // Store tokens in database
      const { error: dbError } = await supabase
        .from('cronofy_tokens')
        .upsert({
          user_id: user.id,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: expiresAt.toISOString(),
          cronofy_sub: profile.sub,
          updated_at: new Date().toISOString(),
        });

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to save tokens');
      }

      console.log('Successfully saved Cronofy tokens');
    }

    // Return HTML that closes the popup and notifies parent
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cronofy Connected</title>
        </head>
        <body>
          <script>
            window.opener?.postMessage({ type: 'cronofy-auth-success', data: ${JSON.stringify({ sub: profile.sub })} }, '*');
            window.close();
          </script>
          <p>Successfully connected to Cronofy! You can close this window.</p>
        </body>
      </html>
      `,
      {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in cronofy-oauth-callback:', errorMessage);
    
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cronofy Connection Error</title>
        </head>
        <body>
          <script>
            window.opener?.postMessage({ type: 'cronofy-auth-error', error: '${errorMessage}' }, '*');
            window.close();
          </script>
          <p>Error connecting to Cronofy: ${errorMessage}</p>
        </body>
      </html>
      `,
      {
        headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        status: 500,
      }
    );
  }
});

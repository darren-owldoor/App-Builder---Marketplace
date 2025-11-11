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
      console.error('OAuth error:', error);
      return new Response(
        `<html><body><script>window.opener.postMessage({ type: 'calendly-oauth-error', error: '${error}' }, '*'); window.close();</script></body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (!code) {
      throw new Error('No authorization code received');
    }

    const clientId = Deno.env.get('CALENDLY_CLIENT_ID');
    const clientSecret = Deno.env.get('CALENDLY_CLIENT_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/calendly-oauth-callback`;
    
    if (!clientId || !clientSecret) {
      throw new Error('OAuth credentials not configured');
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://auth.calendly.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange error:', errorText);
      throw new Error('Failed to exchange authorization code');
    }

    const tokenData = await tokenResponse.json();
    console.log('Successfully obtained access token');

    // Get user info from Calendly
    const userResponse = await fetch('https://api.calendly.com/users/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userData = await userResponse.json();
    const calendlyUserUri = userData.resource.uri;
    const calendlyEmail = userData.resource.email;

    // Get the user_id from the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      // Return HTML that will post message to opener
      return new Response(
        `<html><body><script>
          const token = ${JSON.stringify(tokenData)};
          const user = { uri: '${calendlyUserUri}', email: '${calendlyEmail}' };
          window.opener.postMessage({ type: 'calendly-oauth-success', token, user }, '*');
          window.close();
        </script></body></html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Authentication required');
    }

    // Calculate expiration time if provided
    let expiresAt = null;
    if (tokenData.expires_in) {
      expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();
    }

    // Store or update the token in the database
    const { error: dbError } = await supabase
      .from('calendly_tokens')
      .upsert({
        user_id: user.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_type: tokenData.token_type || 'Bearer',
        expires_at: expiresAt,
        calendly_user_uri: calendlyUserUri,
        calendly_email: calendlyEmail,
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to store OAuth token');
    }

    console.log('Successfully stored Calendly token for user');

    return new Response(
      `<html><body><script>window.opener.postMessage({ type: 'calendly-oauth-success' }, '*'); window.close();</script><p>Authorization successful! You can close this window.</p></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in calendly-oauth-callback:', errorMessage);
    return new Response(
      `<html><body><script>window.opener.postMessage({ type: 'calendly-oauth-error', error: '${errorMessage}' }, '*'); window.close();</script></body></html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
});

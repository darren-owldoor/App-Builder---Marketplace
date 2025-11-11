import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, calendly-webhook-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookSignature = req.headers.get('calendly-webhook-signature');
    const webhookKey = Deno.env.get('CALENDLY_WEBHOOK_KEY');
    
    // Verify webhook signature if key is configured
    if (webhookKey && webhookSignature) {
      // TODO: Implement signature verification
      // For now, we'll log the signature
      console.log('Webhook signature:', webhookSignature);
    }

    const payload = await req.json();
    console.log('Calendly webhook received:', payload.event);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle different webhook events
    switch (payload.event) {
      case 'invitee.created':
        console.log('New invitee created:', payload.payload.name);
        // Store event in database or send notifications
        break;
      
      case 'invitee.canceled':
        console.log('Invitee canceled:', payload.payload.name);
        // Handle cancellation
        break;
      
      default:
        console.log('Unhandled webhook event:', payload.event);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in calendly-webhook:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

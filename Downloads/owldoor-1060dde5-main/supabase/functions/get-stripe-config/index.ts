import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const publishableKey = Deno.env.get("STRIPE_PUBLISHABLE_KEY");
    
    console.log("Fetching Stripe config, key present:", !!publishableKey);
    
    if (!publishableKey) {
      console.error("STRIPE_PUBLISHABLE_KEY environment variable is not set");
      return new Response(
        JSON.stringify({ 
          error: "Stripe not configured. Please add STRIPE_PUBLISHABLE_KEY in Cloud settings.",
          configured: false 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    console.log("Returning Stripe publishable key");
    return new Response(
      JSON.stringify({ publishableKey, configured: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in get-stripe-config:", error);
    return new Response(
      JSON.stringify({ error: error.message, configured: false }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

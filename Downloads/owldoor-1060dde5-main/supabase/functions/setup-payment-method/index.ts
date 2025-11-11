import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ 
          error: "Authentication required",
          details: "No authorization header provided"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (authError || !user?.email) {
      console.error("User authentication failed:", authError);
      return new Response(
        JSON.stringify({ 
          error: "User not authenticated",
          details: authError?.message || "Invalid authentication token"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    console.log("User authenticated:", user.id);

    // Get client record - use maybeSingle to handle missing records gracefully
    const { data: client, error: clientError } = await supabaseClient
      .from("clients")
      .select("id, email, stripe_customer_id, company_name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (clientError) {
      console.error("Database error fetching client:", clientError);
      return new Response(
        JSON.stringify({ 
          error: "Database error",
          details: "Failed to fetch client record"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    if (!client) {
      console.error("No client record found for user:", user.id);
      return new Response(
        JSON.stringify({ 
          error: "Client account not found",
          details: "You must have a team leader or brokerage account to add a payment method. Please complete your account setup first."
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    console.log("Client found:", client.id);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    let customerId = client.stripe_customer_id;

    // Create or get Stripe customer
    if (!customerId) {
      const customers = await stripe.customers.list({ email: client.email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: client.email,
          name: client.company_name,
          metadata: {
            client_id: client.id,
          },
        });
        customerId = customer.id;
      }

      // Update client with stripe_customer_id
      await supabaseClient
        .from("clients")
        .update({ stripe_customer_id: customerId })
        .eq("id", client.id);
    }

    // Create Setup Intent for adding payment method
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "off_session", // Allow charging without user presence
    });

    return new Response(
      JSON.stringify({ 
        client_secret: setupIntent.client_secret,
        customer_id: customerId 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    const correlationId = crypto.randomUUID();
    console.error("Error setting up payment method:", { correlationId, error });
    return new Response(
      JSON.stringify({ 
        error: "An error occurred while setting up your payment method. Please try again.",
        correlationId
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

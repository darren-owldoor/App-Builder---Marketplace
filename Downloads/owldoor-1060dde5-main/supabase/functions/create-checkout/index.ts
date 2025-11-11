import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");
    
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) {
      throw new Error("User not authenticated or email not available");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    const body = await req.json();
    const { amount, price_id, tier_name } = body;
    
    // Support both old credit purchase format and new pricing tier format
    if (price_id) {
      logStep("Pricing tier purchase requested", { price_id, tier_name });
    } else if (amount && amount > 0) {
      logStep("Credit amount requested", { amount });
    } else {
      throw new Error("Invalid request: must provide either price_id or amount");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found", { customerId });
    } else {
      logStep("No existing customer, will be created during checkout");
    }

    // Get client_id for metadata
    const { data: clientData } = await supabaseClient
      .from("clients")
      .select("id")
      .eq("user_id", user.id)
      .single();

    const clientId = clientData?.id;
    logStep("Client lookup", { clientId });

    // Create session based on request type
    let sessionConfig: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      mode: "payment",
      metadata: {
        user_id: user.id,
        client_id: clientId,
      },
    };

    if (price_id) {
      // New pricing tier purchase
      sessionConfig.line_items = [{ price: price_id, quantity: 1 }];
      sessionConfig.success_url = `${req.headers.get("origin")}/broker?payment=success&tier=${encodeURIComponent(tier_name || "recruit")}`;
      sessionConfig.cancel_url = `${req.headers.get("origin")}/pricing?payment=cancelled`;
      sessionConfig.metadata.type = "recruit_purchase";
      sessionConfig.metadata.tier_name = tier_name || "Recruit";
      sessionConfig.metadata.description = `${tier_name || "Recruit"} Purchase`;
    } else {
      // Old credit purchase format
      sessionConfig.line_items = [
        {
          price_data: {
            currency: "usd",
            unit_amount: amount * 100,
            product_data: {
              name: "OwlDoor Credits",
              description: `Add $${amount} in credits to your account`,
            },
          },
          quantity: 1,
        },
      ];
      sessionConfig.success_url = `${req.headers.get("origin")}/client-dashboard?payment=success&amount=${amount}`;
      sessionConfig.cancel_url = `${req.headers.get("origin")}/client-dashboard?payment=cancelled`;
      sessionConfig.metadata.type = "credit_purchase";
      sessionConfig.metadata.credit_amount = amount.toString();
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

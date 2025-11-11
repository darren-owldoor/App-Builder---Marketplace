import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PURCHASE-RECRUIT] ${step}${detailsStr}`);
};

// Pricing configuration
const PRICING = {
  basic: { amount: 5000, name: "Basic Lead" }, // $50
  qualified: { amount: 30000, name: "Qualified Candidate" }, // $300
  premium: { amount: 50000, name: "Premium Candidate" }, // $500
};

const STRIPE_PRICE_IDS = {
  basic: "price_1SR6d4BDqaZSMCzwdcoeubBh",
  qualified: "price_1SR6dHBDqaZSMCzw0Zz52Xar",
  premium: "price_1SR6dkBDqaZSMCzwLNhxMHom",
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
      throw new Error("User not authenticated");
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { recruit_id, match_id } = await req.json();
    if (!recruit_id || !match_id) {
      throw new Error("recruit_id and match_id are required");
    }
    logStep("Request parsed", { recruit_id, match_id });

    // Get client ID
    const { data: clientData, error: clientError } = await supabaseClient
      .from("clients")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (clientError || !clientData) {
      throw new Error("Client not found");
    }
    logStep("Client found", { clientId: clientData.id });

    // Get agent/recruit details and calculate pricing tier
    const { data: agentData, error: agentError } = await supabaseClient
      .from("agents")
      .select("full_name, transactions, experience, qualification_score")
      .eq("id", recruit_id)
      .single();

    if (agentError || !agentData) {
      throw new Error("Recruit not found");
    }
    logStep("Recruit found", { name: agentData.full_name });

    // Calculate pricing tier
    const transactions = agentData.transactions || 0;
    const experience = agentData.experience || 0;
    const qualificationScore = agentData.qualification_score || 0;
    
    let pricingTier: 'basic' | 'qualified' | 'premium' = 'basic';
    if (transactions >= 30 && experience >= 10 && qualificationScore >= 80) {
      pricingTier = 'premium';
    } else if (transactions >= 15 && experience >= 5 && qualificationScore >= 60) {
      pricingTier = 'qualified';
    }
    
    const pricing = PRICING[pricingTier];
    logStep("Pricing tier calculated", { tier: pricingTier, amount: pricing.amount });

    // Initialize Stripe
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
      throw new Error("No payment method on file. Please add a payment method first.");
    }

    // Get saved payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
      limit: 1,
    });

    if (paymentMethods.data.length === 0) {
      throw new Error("No payment method on file. Please add a payment method first.");
    }

    const paymentMethodId = paymentMethods.data[0].id;
    logStep("Payment method found", { paymentMethodId });

    // Create and confirm payment intent directly
    const paymentIntent = await stripe.paymentIntents.create({
      amount: pricing.amount,
      currency: "usd",
      customer: customerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      description: `${pricing.name}: ${agentData.full_name}`,
      metadata: {
        user_id: user.id,
        client_id: clientData.id,
        recruit_id: recruit_id,
        match_id: match_id,
        pricing_tier: pricingTier,
        type: "recruit_purchase",
        recruit_name: agentData.full_name,
      },
    });

    logStep("Payment intent created and confirmed", { 
      paymentIntentId: paymentIntent.id, 
      status: paymentIntent.status 
    });

    if (paymentIntent.status !== "succeeded") {
      throw new Error(`Payment failed with status: ${paymentIntent.status}`);
    }

    // Update match as purchased
    const { error: matchError } = await supabaseClient
      .from("matches")
      .update({
        purchased: true,
        purchased_at: new Date().toISOString(),
        purchase_amount: pricing.amount / 100,
        pricing_tier: pricingTier,
        package_type: pricingTier,
      })
      .eq("id", match_id)
      .eq("client_id", clientData.id);

    if (matchError) {
      logStep("Error updating match", { error: matchError });
      throw matchError;
    }

    // Create payment record
    const { error: paymentError } = await supabaseClient
      .from("payments")
      .insert({
        client_id: clientData.id,
        stripe_payment_intent_id: paymentIntent.id,
        amount: pricing.amount / 100,
        currency: "usd",
        status: "succeeded",
        description: `Recruit Purchase: ${agentData.full_name} (${pricingTier})`,
      });

    if (paymentError) {
      logStep("Error creating payment record", { error: paymentError });
    }

    logStep("Purchase completed successfully");

    return new Response(
      JSON.stringify({ 
        success: true,
        pricing_tier: pricingTier,
        amount: pricing.amount / 100,
        recruit_name: agentData.full_name,
      }),
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

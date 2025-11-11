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

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { match_id, skip_if_no_payment } = await req.json();

    if (!match_id) {
      throw new Error("Match ID is required");
    }

    console.log(`[AUTO-CHARGE] Processing match ${match_id}`);

    // Get match details with client and pro info
    const { data: match, error: matchError } = await supabaseAdmin
      .from("matches")
      .select(`
        *,
        clients!inner(
          id,
          company_name,
          email,
          stripe_customer_id,
          has_payment_method,
          credits_balance
        ),
        agents!inner(
          full_name,
          email
        )
      `)
      .eq("id", match_id)
      .single();

    if (matchError || !match) {
      throw new Error(`Match not found: ${matchError?.message}`);
    }

    console.log(`[AUTO-CHARGE] Match found for client ${match.clients.company_name}`);

    // Check if already purchased
    if (match.purchased) {
      console.log(`[AUTO-CHARGE] Match already purchased`);
      return new Response(
        JSON.stringify({ success: true, already_purchased: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check if client has payment method (optional now - credits work without it)
    if (!match.clients.has_payment_method || !match.clients.stripe_customer_id) {
      console.log(`[AUTO-CHARGE] Client has no payment method (will use credits only)`);
    }

    // Calculate cost based on pricing tier
    const cost = match.cost || (
      match.pricing_tier === 'premium' ? 500 :
      match.pricing_tier === 'qualified' ? 300 : 50
    );

    // Check if client has enough credits (dollars)
    if (match.clients.credits_balance < cost) {
      console.log(`[AUTO-CHARGE] Insufficient credits ($${match.clients.credits_balance} < $${cost})`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "insufficient_credits",
          required: cost,
          available: match.clients.credits_balance 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`[AUTO-CHARGE] Deducting $${cost} from credits for ${match.pricing_tier} tier match`);

    // Deduct from credits_balance and increment credits_used
    const { error: clientUpdateError } = await supabaseAdmin
      .from("clients")
      .update({
        credits_balance: match.clients.credits_balance - cost,
        credits_used: ((match.clients as any).credits_used || 0) + cost,
        current_month_spend: ((match.clients as any).current_month_spend || 0) + cost,
      })
      .eq("id", match.clients.id);

    if (clientUpdateError) {
      console.error(`[AUTO-CHARGE] Failed to update client credits:`, clientUpdateError);
      throw clientUpdateError;
    }

    // Update match record
    const { error: updateError } = await supabaseAdmin
      .from("matches")
      .update({
        purchased: true,
        auto_charged_at: new Date().toISOString(),
        cost: cost,
      })
      .eq("id", match_id);

    if (updateError) {
      console.error(`[AUTO-CHARGE] Failed to update match:`, updateError);
      throw updateError;
    }

    // Log the transaction
    await supabaseAdmin.from("payment_activity_log").insert({
      user_id: match.client_id,
      activity_type: "match_auto_charge_credits",
      amount: cost,
      currency: "usd",
      status: "succeeded",
      metadata: {
        match_id: match.id,
        pro_name: match.agents.full_name,
        pricing_tier: match.pricing_tier,
        payment_method: "credits"
      },
    });

    console.log(`[AUTO-CHARGE] Successfully deducted $${cost} in credits for match ${match_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        amount_charged: cost,
        match_id: match_id,
        payment_method: "credits",
        new_balance: match.clients.credits_balance - cost
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("[AUTO-CHARGE] Error:", error);

    // Log failed charge attempt
    try {
      await supabaseAdmin.from("payment_activity_log").insert({
        activity_type: "match_auto_charge_failed",
        status: "failed",
        error_message: error.message,
        metadata: {
          error_stack: error.stack,
        },
      });
    } catch (logError) {
      console.error("[AUTO-CHARGE] Failed to log error:", logError);
    }

    const correlationId = crypto.randomUUID();
    console.error("[AUTO-CHARGE] Error processing charge:", { correlationId, error });
    return new Response(
      JSON.stringify({
        error: "Failed to process payment. Please try again or contact support.",
        correlationId
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

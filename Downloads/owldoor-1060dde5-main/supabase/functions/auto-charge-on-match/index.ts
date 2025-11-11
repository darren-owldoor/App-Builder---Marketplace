import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const { record } = await req.json();
    
    console.log(`[AUTO-CHARGE-TRIGGER] New match created: ${record.id}`);

    // Get client settings to check if auto-charge is enabled
    const { data: client, error: clientError } = await supabaseAdmin
      .from("clients")
      .select("auto_charge_enabled, has_payment_method, credits_balance")
      .eq("id", record.client_id)
      .single();

    if (clientError) {
      console.error(`[AUTO-CHARGE-TRIGGER] Error fetching client:`, clientError);
      return new Response(JSON.stringify({ error: "Failed to fetch client" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Only auto-charge if enabled
    if (!client.auto_charge_enabled) {
      console.log(`[AUTO-CHARGE-TRIGGER] Auto-charge disabled for client`);
      return new Response(JSON.stringify({ skipped: true, reason: "disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Require payment method only if credits balance is 100 or less
    if (!client.has_payment_method && (client.credits_balance || 0) <= 100) {
      console.log(`[AUTO-CHARGE-TRIGGER] Client has no payment method and insufficient credits (${client.credits_balance || 0} <= 100)`);
      return new Response(JSON.stringify({ skipped: true, reason: "no_payment_method_and_low_credits" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log(`[AUTO-CHARGE-TRIGGER] Client approved for auto-charge (has_payment_method: ${client.has_payment_method}, credits_balance: ${client.credits_balance})`);

    // Call the auto-charge function
    console.log(`[AUTO-CHARGE-TRIGGER] Triggering auto-charge for match ${record.id}`);
    
    const { data: chargeResult, error: chargeError } = await supabaseAdmin.functions.invoke(
      "auto-charge-match",
      {
        body: { match_id: record.id, skip_if_no_payment: true },
      }
    );

    if (chargeError) {
      console.error(`[AUTO-CHARGE-TRIGGER] Charge error:`, chargeError);
      return new Response(JSON.stringify({ error: chargeError.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    console.log(`[AUTO-CHARGE-TRIGGER] Charge result:`, chargeResult);

    return new Response(JSON.stringify({ success: true, result: chargeResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("[AUTO-CHARGE-TRIGGER] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

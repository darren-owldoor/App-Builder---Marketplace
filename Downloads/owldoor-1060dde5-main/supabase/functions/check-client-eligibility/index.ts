import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get client data with package info
    const { data: clientData, error: clientError } = await supabaseClient
      .from("clients")
      .select(`
        id,
        credits_balance,
        current_package_id,
        active,
        pricing_packages (
          name,
          monthly_cost,
          leads_per_month
        )
      `)
      .eq("user_id", user.id)
      .single();

    if (clientError) throw clientError;

    const canReceiveLeads = 
      clientData.active && 
      clientData.current_package_id !== null;
    
    const needsPaymentMethod = 
      (clientData.credits_balance || 0) <= 100;

    console.log("Client eligibility check:", {
      clientId: clientData.id,
      canReceiveLeads,
      needsPaymentMethod,
      creditsBalance: clientData.credits_balance,
      hasPackage: !!clientData.current_package_id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        eligible: canReceiveLeads,
        needsPaymentMethod,
        credits: clientData.credits_balance || 0,
        package: clientData.pricing_packages,
        reasons: {
          hasPackage: !!clientData.current_package_id,
          isActive: clientData.active,
          lowCredits: needsPaymentMethod,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error checking client eligibility:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to check eligibility";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

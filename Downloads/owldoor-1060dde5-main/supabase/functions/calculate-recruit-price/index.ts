import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PricingConfig {
  config_type: string;
  tier_name: string;
  min_value: number | null;
  max_value: number | null;
  price_modifier: number;
  modifier_type: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token || "");
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: corsHeaders }
      );
    }

    // Rate limiting check
    const { data: canProceed, error: rateLimitError } = await supabaseClient
      .rpc("check_rate_limit", {
        p_identifier: user.id,
        p_endpoint: "calculate-recruit-price",
        p_max_requests: 10000,
        p_window_minutes: 60,
      });

    if (rateLimitError) {
      console.error("Rate limit check error:", rateLimitError);
    }

    if (!canProceed) {
      // Trigger admin alert
      await fetch(`${supabaseUrl}/functions/v1/send-rate-limit-alert`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
      }).catch(console.error);

      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Admin has been notified. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { recruit_id, client_id, discount_code } = await req.json();

    // Get recruit details
    const { data: recruit, error: recruitError } = await supabaseClient
      .from("pros")
      .select("motivation_score, transactions, created_at")
      .eq("id", recruit_id)
      .single();

    if (recruitError) throw new Error("Recruit not found");

    // Check for admin pricing override
    const { data: override } = await supabaseClient
      .from("admin_pricing_overrides")
      .select("flat_price")
      .eq("client_id", client_id)
      .eq("active", true)
      .maybeSingle();

    if (override) {
      return new Response(
        JSON.stringify({
          base_price: override.flat_price,
          final_price: override.flat_price,
          breakdown: {
            type: "admin_override",
            flat_price: override.flat_price,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get pricing configuration
    const { data: pricingConfig, error: pricingError } = await supabaseClient
      .from("pricing_config")
      .select("*")
      .eq("active", true);

    if (pricingError) throw pricingError;

    // Calculate base price
    const baseConfig = pricingConfig.find((p: PricingConfig) => p.config_type === "base");
    let totalPrice = baseConfig?.price_modifier || 100;
    const breakdown: any = { base: totalPrice };

    // Add motivation add-on (choose highest applicable, not compounding)
    const motivationScore = recruit.motivation_score || 0;
    const motivationConfigs = pricingConfig
      .filter((p: PricingConfig) => p.config_type === "motivation")
      .filter((p: PricingConfig) => 
        motivationScore >= (p.min_value || 0) && 
        motivationScore <= (p.max_value || 999)
      )
      .sort((a: PricingConfig, b: PricingConfig) => b.price_modifier - a.price_modifier);

    if (motivationConfigs.length > 0) {
      const motivationAddon = motivationConfigs[0].price_modifier;
      totalPrice += motivationAddon;
      breakdown.motivation = {
        score: motivationScore,
        addon: motivationAddon,
        tier: motivationConfigs[0].tier_name,
      };
    }

    // Add transaction add-on
    const transactions = recruit.transactions || 0;
    const transactionConfig = pricingConfig
      .filter((p: PricingConfig) => p.config_type === "transactions")
      .find((p: PricingConfig) => 
        transactions >= (p.min_value || 0) && 
        transactions <= (p.max_value || 999999)
      );

    if (transactionConfig) {
      totalPrice += transactionConfig.price_modifier;
      breakdown.transactions = {
        count: transactions,
        addon: transactionConfig.price_modifier,
        tier: transactionConfig.tier_name,
      };
    }

    // Calculate time-based discount
    const createdAt = new Date(recruit.created_at);
    const hoursOld = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    
    const timeDiscountConfigs = pricingConfig
      .filter((p: PricingConfig) => p.config_type === "time_discount")
      .filter((p: PricingConfig) => hoursOld >= (p.min_value || 0))
      .sort((a: PricingConfig, b: PricingConfig) => b.price_modifier - a.price_modifier);

    let timeDiscountAmount = 0;
    if (timeDiscountConfigs.length > 0) {
      const discountPercent = timeDiscountConfigs[0].price_modifier;
      timeDiscountAmount = totalPrice * discountPercent;
      breakdown.time_discount = {
        hours: Math.floor(hoursOld),
        percent: discountPercent * 100,
        amount: timeDiscountAmount,
        tier: timeDiscountConfigs[0].tier_name,
      };
    }

    // Apply discount code if provided
    let codeDiscountAmount = 0;
    if (discount_code) {
      const { data: discountData, error: discountError } = await supabaseClient
        .from("discount_codes")
        .select("*")
        .eq("code", discount_code)
        .eq("active", true)
        .maybeSingle();

      if (discountData && !discountError) {
        const now = new Date();
        const expired = discountData.expires_at && new Date(discountData.expires_at) < now;
        const maxedOut = discountData.max_uses && discountData.current_uses >= discountData.max_uses;

        if (!expired && !maxedOut) {
          if (discountData.discount_type === "percentage") {
            codeDiscountAmount = totalPrice * (discountData.discount_value / 100);
          } else {
            codeDiscountAmount = discountData.discount_value;
          }
          breakdown.discount_code = {
            code: discount_code,
            type: discountData.discount_type,
            value: discountData.discount_value,
            amount: codeDiscountAmount,
          };
        }
      }
    }

    const finalPrice = Math.max(0, totalPrice - timeDiscountAmount - codeDiscountAmount);

    return new Response(
      JSON.stringify({
        base_price: baseConfig?.price_modifier || 100,
        total_before_discounts: totalPrice,
        final_price: finalPrice,
        breakdown,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error calculating price:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

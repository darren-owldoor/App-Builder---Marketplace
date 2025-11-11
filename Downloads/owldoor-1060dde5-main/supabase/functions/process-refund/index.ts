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

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) throw new Error("Unauthorized");

    // Verify staff role
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleData?.role !== "staff" && roleData?.role !== "admin") {
      throw new Error("Insufficient permissions");
    }

    const { payment_id, amount, reason } = await req.json();

    // Get payment details
    const { data: payment, error: paymentError } = await supabaseClient
      .from("payments")
      .select("*")
      .eq("id", payment_id)
      .single();

    if (paymentError) throw paymentError;

    if (!payment.stripe_payment_intent_id) {
      throw new Error("No Stripe payment intent found");
    }

    // Validate refund amount
    const availableAmount = payment.amount - payment.refunded_amount;
    if (amount > availableAmount) {
      throw new Error("Refund amount exceeds available amount");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Process refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripe_payment_intent_id,
      amount: Math.round(amount * 100), // Convert to cents
      reason: reason || undefined,
    });

    // Update payment record
    const { error: updateError } = await supabaseClient
      .from("payments")
      .update({
        refunded_amount: payment.refunded_amount + amount,
        status: refund.status === "succeeded" ? "refunded" : payment.status,
      })
      .eq("id", payment_id);

    if (updateError) throw updateError;

    // Get client details for notification
    const { data: client } = await supabaseClient
      .from("clients")
      .select("email, company_name")
      .eq("id", payment.client_id)
      .single();

    // Send refund notification email
    if (client) {
      await supabaseClient.functions.invoke("send-email-sendgrid", {
        body: {
          to: [client.email],
          bcc: ["hello@owldoor.com"],
          subject: "Refund Processed",
          html: `
            <h2>Refund Confirmation</h2>
            <p>Hello ${client.company_name},</p>
            <p>A refund of <strong>$${amount.toFixed(2)}</strong> has been processed for your payment.</p>
            ${payment.description ? `<p><strong>Original Payment:</strong> ${payment.description}</p>` : ""}
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
            <p>The refund will appear in your account within 5-10 business days.</p>
            <p>Thank you!</p>
          `,
        },
      });
    }

    return new Response(
      JSON.stringify({ success: true, refund }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
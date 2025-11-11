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
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-06-30.basil",
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    
    if (!signature) {
      throw new Error("No signature provided");
    }

    // Verify webhook signature
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.warn("STRIPE_WEBHOOK_SECRET not set, skipping signature verification");
    }

    let event: Stripe.Event;
    
    if (webhookSecret) {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body);
    }

    console.log(`Webhook received: ${event.type}`);

    // Handle checkout session completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`Checkout session completed: ${session.id}`);

      const clientId = session.metadata?.client_id;
      const type = session.metadata?.type;
      const description = session.metadata?.description;

      if (!clientId) {
        console.error("No client_id in session metadata");
        return new Response(JSON.stringify({ error: "No client_id" }), { status: 400 });
      }

      // Handle recruit purchase
      if (type === "recruit_purchase") {
        const recruitId = session.metadata?.recruit_id;
        const matchId = session.metadata?.match_id;
        const pricingTier = session.metadata?.pricing_tier;
        const recruitName = session.metadata?.recruit_name;

        console.log(`Processing recruit purchase: ${recruitId} for client ${clientId}`);

        // Update match to mark as purchased
        const { error: matchError } = await supabase
          .from("matches")
          .update({
            purchased: true,
            purchased_at: new Date().toISOString(),
            purchase_amount: (session.amount_total || 0) / 100,
            pricing_tier: pricingTier,
            package_type: pricingTier,
          })
          .eq("id", matchId)
          .eq("client_id", clientId);

        if (matchError) {
          console.error("Error updating match:", matchError);
          throw matchError;
        }

        console.log(`Match ${matchId} marked as purchased`);

        // Create payment record
        const { error: paymentError } = await supabase
          .from("payments")
          .insert({
            client_id: clientId,
            stripe_payment_intent_id: session.payment_intent as string,
            amount: (session.amount_total || 0) / 100,
            currency: session.currency || "usd",
            status: "succeeded",
            description: `Recruit Purchase: ${recruitName} (${pricingTier})`,
          });

        if (paymentError) {
          console.error("Error creating payment record:", paymentError);
        }

        // Get client email for confirmation
        const { data: clientData } = await supabase
          .from("clients")
          .select("email")
          .eq("id", clientId)
          .single();

        if (clientData?.email) {
          console.log(`Sending recruit purchase confirmation to: ${clientData.email}`);
          try {
            await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email-sendgrid`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              },
              body: JSON.stringify({
                to: clientData.email,
                subject: "Recruit Purchase Confirmed - OwlDoor",
                text: `You've successfully purchased access to ${recruitName} for $${(session.amount_total || 0) / 100}.`,
                html: `
                  <h2>Recruit Purchase Confirmed</h2>
                  <p>Congratulations! You've successfully unlocked a new recruit.</p>
                  <p><strong>Recruit:</strong> ${recruitName}</p>
                  <p><strong>Tier:</strong> ${pricingTier}</p>
                  <p><strong>Amount:</strong> $${(session.amount_total || 0) / 100}</p>
                  <p>You can now view full contact information and reach out directly.</p>
                  <p><a href="${Deno.env.get("SUPABASE_URL")}/broker">View Your Recruits</a></p>
                `
              })
            });
            console.log("Recruit purchase confirmation email sent");
          } catch (emailError) {
            console.error("Error sending confirmation email:", emailError);
          }
        }

        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert({
          client_id: clientId,
          stripe_payment_intent_id: session.payment_intent as string,
          amount: (session.amount_total || 0) / 100, // Convert from cents
          currency: session.currency || "usd",
          status: "succeeded",
          description: description || "Payment via Stripe",
        })
        .select()
        .single();

      if (paymentError) {
        console.error("Error creating payment:", paymentError);
        throw paymentError;
      }

      console.log(`Payment created: ${payment.id}`);

      // Update client credits - fetch current, increment, and update
      const { data: clientData } = await supabase
        .from("clients")
        .select("credits_balance, email")
        .eq("id", clientId)
        .single();

      if (clientData) {
        const newBalance = (clientData.credits_balance || 0) + 1;
        await supabase
          .from("clients")
          .update({ credits_balance: newBalance })
          .eq("id", clientId);
        
        console.log(`Updated client credits: ${newBalance}`);

        // Send payment confirmation email
        if (clientData.email) {
          console.log(`Sending payment confirmation email to: ${clientData.email}`);
          try {
            await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email-sendgrid`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              },
              body: JSON.stringify({
                to: clientData.email,
                subject: "Payment Received - Thank You!",
                text: `Thank you for your payment of $${(session.amount_total || 0) / 100}. Your credit balance has been updated to ${newBalance} credits.`,
                html: `
                  <h2>Payment Received</h2>
                  <p>Thank you for your payment!</p>
                  <p><strong>Amount:</strong> $${(session.amount_total || 0) / 100}</p>
                  <p><strong>Description:</strong> ${description || "Payment via Stripe"}</p>
                  <p><strong>New Credit Balance:</strong> ${newBalance} credits</p>
                  <p>Your payment has been successfully processed.</p>
                `
              })
            });
            console.log("Payment confirmation email sent successfully");
          } catch (emailError) {
            console.error("Error sending payment confirmation email:", emailError);
          }
        }
      }

      // Trigger auto-enrichment
      console.log(`Triggering auto-enrichment for client: ${clientId}`);
      try {
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/auto-enrich-trigger`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({ type: "client_payment", record_id: clientId })
        });
        console.log("Auto-enrichment triggered successfully");
      } catch (enrichError) {
        console.error("Error triggering enrichment:", enrichError);
      }
    }

    // Handle payment intent succeeded (for regular payments)
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`Payment intent succeeded: ${paymentIntent.id}`);

      // Update existing payment record if it exists
      const { error: updateError } = await supabase
        .from("payments")
        .update({ status: "succeeded" })
        .eq("stripe_payment_intent_id", paymentIntent.id);

      if (updateError) {
        console.error("Error updating payment status:", updateError);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

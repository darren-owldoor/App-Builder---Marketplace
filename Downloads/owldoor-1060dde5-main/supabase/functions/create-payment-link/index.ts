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

    // Verify staff role (optional check - allows all authenticated users if no role system)
    const { data: roleData, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    // Only enforce role check if user_roles table exists and has data
    if (!roleError && roleData && roleData.role !== "staff" && roleData.role !== "admin") {
      throw new Error("Insufficient permissions - requires staff or admin role");
    }

    const { client_id, amount, description, send_via, email_message, sms_message } = await req.json();

    // Get client details
    const { data: client, error: clientError } = await supabaseClient
      .from("clients")
      .select("email, phone, company_name")
      .eq("id", client_id)
      .single();

    if (clientError) throw clientError;

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Create payment link in Stripe
    const price = await stripe.prices.create({
      unit_amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      product_data: {
        name: description,
      },
    });

    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: {
        client_id,
        description,
      },
    });

    // Store payment link in database
    const { error: linkError } = await supabaseClient
      .from("payment_links")
      .insert({
        created_by: user.id,
        client_id,
        amount,
        description,
        stripe_payment_link_id: paymentLink.id,
        stripe_payment_link_url: paymentLink.url,
        email_template: email_message,
        sms_template: sms_message,
      });

    if (linkError) throw linkError;

    // Send via email
    if (send_via === "email" || send_via === "both") {
      const emailBody = {
        to: client.email,
        subject: `Payment Request - ${description}`,
        html: `
          <h2>Payment Request</h2>
          <p>Hello ${client.company_name},</p>
          ${email_message ? `<p>${email_message}</p>` : ""}
          <p>You have a payment request for <strong>$${amount.toFixed(2)}</strong>.</p>
          <p><strong>Description:</strong> ${description}</p>
          <p><a href="${paymentLink.url}" style="display: inline-block; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 4px;">Pay Now</a></p>
          <p>Or copy this link: ${paymentLink.url}</p>
          <p>Thank you!</p>
        `,
        context: 'admin',
      };

      const { error: emailError } = await supabaseClient.functions.invoke("send-email-sendgrid", {
        body: emailBody,
        headers: {
          Authorization: authHeader,
        },
      });

      if (emailError) {
        console.error("Email sending failed:", emailError);
        throw new Error(`Failed to send email: ${emailError.message}`);
      }
    }

    // Send via SMS
    if (send_via === "sms" || send_via === "both") {
      if (client.phone) {
        const smsBody = sms_message
          ? `${sms_message}\n\nPay $${amount.toFixed(2)} for ${description}: ${paymentLink.url}`
          : `You have a payment request for $${amount.toFixed(2)} - ${description}. Pay here: ${paymentLink.url}`;

        console.log("Attempting to send SMS to:", client.phone);
        const { data: smsResult, error: smsError } = await supabaseClient.functions.invoke("send-sms-provider", {
          body: {
            to: client.phone,
            message: smsBody,
            context: 'admin',
          },
          headers: {
            Authorization: authHeader,
          },
        });

        if (smsError) {
          console.error("SMS sending failed:", smsError);
          throw new Error(`Failed to send SMS: ${smsError.message}`);
        }

        console.log("SMS sent successfully:", smsResult);
      } else {
        console.log("No phone number available for client");
      }
    }

    return new Response(
      JSON.stringify({ success: true, payment_link: paymentLink.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const correlationId = crypto.randomUUID();
    console.error("Error creating payment link:", { correlationId, error });
    return new Response(
      JSON.stringify({ 
        error: "Failed to create payment link. Please try again.",
        correlationId
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
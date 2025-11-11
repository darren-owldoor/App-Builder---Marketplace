import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");
const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
const ADMIN_PHONE = "+18588886399";
const ADMIN_EMAIL = "admin@owldoor.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get unsent alerts
    const { data: alerts, error: alertError } = await supabaseAdmin
      .from("rate_limit_alerts")
      .select("*")
      .eq("alert_sent", false)
      .order("last_blocked_at", { ascending: false });

    if (alertError) throw alertError;
    if (!alerts || alerts.length === 0) {
      return new Response(JSON.stringify({ message: "No alerts to send" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const alert of alerts) {
      const message = `🚨 RATE LIMIT ALERT\n\nEndpoint: ${alert.endpoint}\nIdentifier: ${alert.identifier}\nBlocked Attempts: ${alert.attempts_blocked}\nLast Blocked: ${new Date(alert.last_blocked_at).toLocaleString()}\n\nImmediate action required.`;

      // Send SMS via Twilio
      try {
        const twilioAuth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
        const smsResponse = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
          {
            method: "POST",
            headers: {
              "Authorization": `Basic ${twilioAuth}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              To: ADMIN_PHONE,
              From: TWILIO_PHONE_NUMBER!,
              Body: message,
            }),
          }
        );

        if (!smsResponse.ok) {
          console.error("SMS send failed:", await smsResponse.text());
        } else {
          console.log("SMS alert sent successfully");
        }
      } catch (smsError) {
        console.error("SMS error:", smsError);
      }

      // Send Email via SendGrid
      try {
        const emailResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${SENDGRID_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: ADMIN_EMAIL }] }],
            from: { email: "alerts@owldoor.com", name: "OwlDoor Security" },
            subject: `🚨 Rate Limit Alert: ${alert.endpoint}`,
            content: [{
              type: "text/html",
              value: `
                <h2>Rate Limit Violation Detected</h2>
                <p><strong>Endpoint:</strong> ${alert.endpoint}</p>
                <p><strong>Identifier:</strong> ${alert.identifier}</p>
                <p><strong>Blocked Attempts:</strong> ${alert.attempts_blocked}</p>
                <p><strong>First Blocked:</strong> ${new Date(alert.first_blocked_at).toLocaleString()}</p>
                <p><strong>Last Blocked:</strong> ${new Date(alert.last_blocked_at).toLocaleString()}</p>
                <hr>
                <p style="color: red;"><strong>Immediate action required to investigate potential abuse.</strong></p>
              `,
            }],
          }),
        });

        if (!emailResponse.ok) {
          console.error("Email send failed:", await emailResponse.text());
        } else {
          console.log("Email alert sent successfully");
        }
      } catch (emailError) {
        console.error("Email error:", emailError);
      }

      // Mark alert as sent
      await supabaseAdmin
        .from("rate_limit_alerts")
        .update({ alert_sent: true })
        .eq("id", alert.id);
    }

    return new Response(
      JSON.stringify({ success: true, alerts_sent: alerts.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending rate limit alerts:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

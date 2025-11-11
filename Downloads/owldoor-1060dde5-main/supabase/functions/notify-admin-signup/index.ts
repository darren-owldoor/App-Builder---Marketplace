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

  try {
    const { user_id, client_name, email, package_name, package_cost } = await req.json();

    if (!user_id || !client_name || !email) {
      throw new Error("Missing required fields");
    }

    // Create Supabase client to get admin emails
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get all admin emails
    const { data: adminRoles, error: adminError } = await supabaseClient
      .from("user_roles")
      .select(`
        user_id,
        profiles:user_id (
          email,
          full_name
        )
      `)
      .eq("role", "admin");

    if (adminError) {
      console.error("Error fetching admins:", adminError);
      throw adminError;
    }

    const adminEmails = adminRoles
      ?.map((role: any) => role.profiles?.email)
      .filter((email): email is string => !!email);

    if (!adminEmails || adminEmails.length === 0) {
      console.warn("No admin emails found");
      // Don't fail if no admins, just log
      return new Response(
        JSON.stringify({ success: true, message: "No admins to notify" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    
    // Send email to all admins using Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "OwlDoor Notifications <onboarding@resend.dev>",
        to: adminEmails,
        subject: `🎉 New Signup: ${client_name} - Payment Added`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h1 style="color: #2d7738; margin-bottom: 20px;">🎉 New Client Signup Complete!</h1>
              
              <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                <h2 style="color: #2d7738; margin: 0 0 10px 0;">Client Details:</h2>
                <p style="margin: 5px 0;"><strong>Name:</strong> ${client_name}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 5px 0;"><strong>User ID:</strong> ${user_id}</p>
              </div>

              ${package_name ? `
                <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                  <h2 style="color: #e65100; margin: 0 0 10px 0;">Package Information:</h2>
                  <p style="margin: 5px 0;"><strong>Package:</strong> ${package_name}</p>
                  <p style="margin: 5px 0;"><strong>Monthly Cost:</strong> $${package_cost}/month</p>
                </div>
              ` : ''}

              <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                <h2 style="color: #1976d2; margin: 0 0 10px 0;">✅ Payment Status:</h2>
                <p style="margin: 5px 0; color: #2e7d32; font-weight: bold;">Payment method successfully added</p>
                <p style="margin: 5px 0; font-size: 14px; color: #666;">The client has completed the signup process and added their payment information.</p>
              </div>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                <p style="margin: 5px 0; color: #666; font-size: 14px;">
                  <strong>Next Steps:</strong> Review the client's information and reach out to welcome them to OwlDoor.
                </p>
              </div>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
                <p style="color: #666; font-size: 12px; margin: 0;">
                  This is an automated notification from OwlDoor CRM
                </p>
              </div>
            </div>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Resend API error:", errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    return new Response(
      JSON.stringify({ success: true, admins_notified: adminEmails.length }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in notify-admin-signup:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

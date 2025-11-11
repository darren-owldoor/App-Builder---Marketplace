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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify admin authentication
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: roles } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!roles || roles.role !== "admin") {
      throw new Error("Admin access required");
    }

    const { client_id } = await req.json();
    if (!client_id) {
      throw new Error("Client ID is required");
    }

    // Get client details
    const { data: client, error: clientError } = await supabaseClient
      .from("clients")
      .select("user_id, email, company_name")
      .eq("id", client_id)
      .single();

    if (clientError || !client) {
      throw new Error("Client not found");
    }

    // Generate a secure token (expires in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create payment setup token
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from("payment_setup_tokens")
      .insert({
        client_id,
        user_id: client.user_id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (tokenError) throw tokenError;

    const origin = req.headers.get("origin") || Deno.env.get("VITE_SUPABASE_URL");
    const paymentLink = `${origin}/payment-setup/${tokenData.id}`;

    console.log(`Payment link generated for client ${client.company_name}: ${paymentLink}`);

    return new Response(
      JSON.stringify({ 
        link: paymentLink,
        expires_at: expiresAt.toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error generating payment link:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
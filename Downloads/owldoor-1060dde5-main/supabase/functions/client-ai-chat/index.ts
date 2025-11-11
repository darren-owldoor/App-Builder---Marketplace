import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();

    // Get user from auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Rate limiting: Check recent messages
    const { data: recentMessages, error: checkError } = await supabaseClient
      .from("ai_chat_logs")
      .select("created_at")
      .eq("user_id", user.id)
      .gte("created_at", new Date(Date.now() - 60000).toISOString()) // Last minute
      .order("created_at", { ascending: false });

    if (checkError) {
      console.error("Error checking rate limit:", checkError);
    }

    // Allow max 10 messages per minute
    if (recentMessages && recentMessages.length >= 10) {
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded. Please wait a moment before sending more messages." 
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Get client data for context
    const { data: clientData } = await supabaseClient
      .from("clients")
      .select("*")
      .eq("id", user.id)
      .single();

    // Build system prompt with context
    const systemPrompt = `You are a helpful AI assistant for OwlDoor, a real estate recruiting platform. 
You're helping a client named ${clientData?.contact_name || "the user"}.

Key information about this client:
- Credits balance: ${clientData?.credits_balance || 0}
- Active recruits: You can check their dashboard
- Company: ${clientData?.company || "Not specified"}

You can help with:
- Questions about their recruits and matches
- Billing and credits information
- Profile and account settings
- How to use the platform
- General real estate recruiting advice

Be concise, friendly, and professional. If you don't know something specific about their account, suggest they check the relevant section of their dashboard.`;

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      throw new Error("AI service temporarily unavailable");
    }

    const aiData = await aiResponse.json();
    const response = aiData.choices[0]?.message?.content || "I'm having trouble responding right now. Please try again.";

    // Log the chat interaction
    await supabaseClient.from("ai_chat_logs").insert({
      user_id: user.id,
      message,
      response,
    });

    return new Response(
      JSON.stringify({ response }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in client-ai-chat:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

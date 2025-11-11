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

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting check
    const { data: canProceed, error: rateLimitError } = await supabase
      .rpc("check_rate_limit", {
        p_identifier: user.id,
        p_endpoint: "research-lead",
        p_max_requests: 5000,
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

    const { pro_id, client_id } = await req.json();

    if (!pro_id || !client_id) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch pro data
    const { data: proData, error: proError } = await supabase
      .from("pros")
      .select("*")
      .eq("id", pro_id)
      .single();

    if (proError || !proData) {
      return new Response(
        JSON.stringify({ error: "Pro not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build research prompt
    const researchPrompt = `You are a real estate recruitment research assistant. Research the following professional and provide comprehensive insights:

Name: ${proData.full_name}
Email: ${proData.email || "N/A"}
Phone: ${proData.phone || "N/A"}
Location: ${proData.cities?.join(", ") || "N/A"}, ${proData.states?.join(", ") || "N/A"}
Brokerage: ${proData.brokerage || "N/A"}
Type: ${proData.pro_type || "N/A"}
Experience: ${proData.experience || "N/A"} years
Transactions: ${proData.transactions || "N/A"}
Total Sales: $${proData.total_sales || "N/A"}

RESEARCH TASKS:
1. Search for their professional profiles on Zillow, Realtor.com, and other real estate platforms
2. Look for social media presence (LinkedIn, Facebook business pages)
3. Check for any awards, certifications, or recognition
4. Find reviews or testimonials about their work
5. Identify their specialties and market focus
6. Note any team affiliations or leadership roles
7. Discover unique selling points or competitive advantages

Provide your findings in the following JSON structure:
{
  "online_profiles": {
    "zillow": "URL or 'Not found'",
    "realtor_com": "URL or 'Not found'",
    "linkedin": "URL or 'Not found'",
    "facebook": "URL or 'Not found'",
    "other": []
  },
  "credentials": {
    "certifications": [],
    "awards": [],
    "specialties": []
  },
  "market_presence": {
    "review_count": 0,
    "average_rating": 0,
    "recent_sales": [],
    "market_areas": []
  },
  "unique_insights": [],
  "recruiting_notes": "Brief summary of why this candidate stands out and how to approach them"
}`;

    // Call Lovable AI for research
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an expert real estate recruitment researcher. Provide detailed, actionable intelligence based on web searches and public data.",
          },
          {
            role: "user",
            content: researchPrompt,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", errorText);
      return new Response(
        JSON.stringify({ error: "AI research failed", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const researchContent = aiData.choices?.[0]?.message?.content;

    if (!researchContent) {
      return new Response(
        JSON.stringify({ error: "No research data returned" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse AI response (handle both JSON and text responses)
    let researchData;
    let aiNotes = researchContent;
    
    try {
      // Try to extract JSON from the response
      const jsonMatch = researchContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        researchData = JSON.parse(jsonMatch[0]);
        aiNotes = researchData.recruiting_notes || researchContent;
      } else {
        researchData = { raw_research: researchContent };
      }
    } catch (e) {
      researchData = { raw_research: researchContent };
    }

    // Save research to database
    const { data: savedResearch, error: saveError } = await supabase
      .from("lead_research")
      .upsert(
        {
          pro_id,
          client_id,
          research_data: researchData,
          ai_notes: aiNotes,
          sources: {
            method: "ai_research",
            model: "google/gemini-2.5-flash",
            timestamp: new Date().toISOString(),
          },
          last_researched_at: new Date().toISOString(),
        },
        {
          onConflict: "pro_id,client_id",
        }
      )
      .select()
      .single();

    if (saveError) {
      console.error("Error saving research:", saveError);
      return new Response(
        JSON.stringify({ error: "Failed to save research", details: saveError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        research: savedResearch,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in research-lead function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

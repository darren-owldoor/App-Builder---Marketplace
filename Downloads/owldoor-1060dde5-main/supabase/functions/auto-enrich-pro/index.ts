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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { pro_id } = await req.json();

    if (!pro_id) {
      throw new Error("pro_id is required");
    }

    console.log(`[AUTO-ENRICH] Starting enrichment for pro ${pro_id}`);

    // Get pro details
    const { data: pro, error: proError } = await supabaseAdmin
      .from("pros")
      .select("*")
      .eq("id", pro_id)
      .single();

    if (proError || !pro) {
      throw new Error(`Pro not found: ${proError?.message}`);
    }

    // Check if already enriched recently (within last 7 days)
    if (pro.last_enriched_at) {
      const lastEnriched = new Date(pro.last_enriched_at);
      const daysSince = (Date.now() - lastEnriched.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) {
        console.log(`[AUTO-ENRICH] Pro was enriched ${daysSince.toFixed(1)} days ago, skipping`);
        return new Response(JSON.stringify({ success: true, skipped: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // Build enrichment prompt for Claude
    const prompt = `You are an AI assistant for OwlDoor.com, a real estate professional recruitment platform. 
Analyze this real estate professional's profile and provide enrichment data.

Current Profile:
- Name: ${pro.full_name || 'Unknown'}
- Email: ${pro.email || 'N/A'}
- Phone: ${pro.phone || 'N/A'}
- Brokerage: ${pro.brokerage || 'N/A'}
- City: ${pro.cities?.[0] || 'N/A'}
- State: ${pro.states?.[0] || 'N/A'}
- Experience: ${pro.experience || 'N/A'} years
- Transactions: ${pro.transactions || 'N/A'}
- License Type: ${pro.license_type || 'N/A'}

TASK: Based on this information, search for and provide:
1. Missing profile fields (bio, specializations, designations)
2. Zillow profile data if available
3. LinkedIn URL if not present
4. Estimated annual volume and transaction count if missing
5. Any additional professional details

Return your findings in JSON format with these fields:
{
  "bio": "brief professional bio",
  "specializations": ["spec1", "spec2"],
  "designations": ["designation1"],
  "linkedin_url": "url or null",
  "zillow_profile_url": "url or null",
  "estimated_volume": number or null,
  "estimated_transactions": number or null,
  "additional_notes": "any other findings"
}`;

    // Call Claude via Anthropic API
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      console.log("[AUTO-ENRICH] No Anthropic API key, skipping");
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "no_api_key" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      console.error("[AUTO-ENRICH] Claude API error:", await anthropicResponse.text());
      throw new Error("Failed to get enrichment from Claude");
    }

    const anthropicData = await anthropicResponse.json();
    const enrichmentText = anthropicData.content[0].text;
    
    console.log("[AUTO-ENRICH] Claude response:", enrichmentText);

    // Parse JSON response
    let enrichmentData;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = enrichmentText.match(/```json\n([\s\S]*?)\n```/) || 
                       enrichmentText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : enrichmentText;
      enrichmentData = JSON.parse(jsonStr);
    } catch (e) {
      console.error("[AUTO-ENRICH] Failed to parse enrichment data:", e);
      enrichmentData = { additional_notes: enrichmentText };
    }

    // Update pro with enrichment data
    const updates: any = {
      last_enriched_at: new Date().toISOString(),
    };

    if (enrichmentData.bio && !pro.bio) {
      updates.bio = enrichmentData.bio;
    }

    if (enrichmentData.specializations && (!pro.specializations || pro.specializations.length === 0)) {
      updates.specializations = enrichmentData.specializations;
    }

    if (enrichmentData.designations && (!pro.designations || pro.designations.length === 0)) {
      updates.designations = enrichmentData.designations;
    }

    if (enrichmentData.linkedin_url && !pro.linkedin_url) {
      updates.linkedin_url = enrichmentData.linkedin_url;
    }

    if (enrichmentData.zillow_profile_url && !pro.profile_url) {
      updates.profile_url = enrichmentData.zillow_profile_url;
    }

    if (enrichmentData.estimated_volume && !pro.total_volume) {
      updates.total_volume = enrichmentData.estimated_volume;
    }

    if (enrichmentData.estimated_transactions && !pro.transactions) {
      updates.transactions = enrichmentData.estimated_transactions;
    }

    // Add enrichment notes to existing notes
    if (enrichmentData.additional_notes) {
      const enrichmentNote = `\n\n--- OwlDoor.com AI Enrichment (${new Date().toLocaleDateString()}) ---\n${enrichmentData.additional_notes}`;
      updates.notes = (pro.notes || "") + enrichmentNote;
    }

    // Update pro record
    const { error: updateError } = await supabaseAdmin
      .from("pros")
      .update(updates)
      .eq("id", pro_id);

    if (updateError) {
      console.error("[AUTO-ENRICH] Failed to update pro:", updateError);
      throw updateError;
    }

    console.log("[AUTO-ENRICH] Successfully enriched pro", { updates });

    return new Response(
      JSON.stringify({
        success: true,
        enriched: true,
        updates,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("[AUTO-ENRICH] Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to enrich pro",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

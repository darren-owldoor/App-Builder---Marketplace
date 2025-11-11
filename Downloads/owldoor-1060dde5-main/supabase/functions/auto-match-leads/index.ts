import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting to prevent abuse
async function checkRateLimit(identifier: string, supabase: any): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_identifier: identifier,
    p_endpoint: 'auto-match-leads',
    p_max_requests: 10,
    p_window_minutes: 60
  });
  
  if (error) {
    console.error('Rate limit check error:', error);
    return true; // Allow on error to prevent blocking legitimate requests
  }
  
  return data;
}

interface Pro {
  id: string;
  pro_type: 'real_estate_agent' | 'mortgage_officer';
  full_name: string;
  email: string;
  phone: string;
  pipeline_stage: string;
  
  // Geographic
  cities: string[];
  states: string[];
  zip_codes: string[];
  counties: string[];
  primary_neighborhoods?: string[];
  latitude?: number;
  longitude?: number;
  
  // Real Estate Agent Fields
  experience?: number;
  transactions?: number;
  total_volume_12mo?: number;
  transactions_12mo?: number;
  qualification_score?: number;
  wants?: string[];
  motivation?: number; // Motivation score 1-10
  needs?: string;
  specializations?: string[];
  buyer_percentage?: number;
  seller_percentage?: number;
  
  // Mortgage Officer Fields
  nmls_id?: string;
  loan_types_specialized?: string[];
  purchase_percentage?: number;
  refinance_percentage?: number;
  avg_close_time_days?: number;
  on_time_close_rate?: number;
  state_licenses?: any[];
  provides_leads_to_agents?: boolean;
  co_marketing_available?: boolean;
  annual_loan_volume?: number;
}

interface Client {
  id: string;
  client_type: 'real_estate' | 'mortgage';
  company_name: string;
  active: boolean;
  credits_balance: number;
  monthly_spend_limit: number;
  current_month_spend: number;
  
  // Geographic
  cities: string[];
  states: string[];
  zip_codes: string[];
  latitude?: number;
  longitude?: number;
  
  // Preferences
  preferences?: any;
  wants?: string;
  needs?: string;
  provides?: string[]; // What the team provides to agents
}

interface MatchScore {
  pro_id: string;
  client_id: string;
  score: number;
  breakdown: {
    geographic: number;
    performance: number;
    specialization: number;
    type_specific: number;
    bonus: number;
  };
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Rate limiting check to prevent abuse
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const canProceed = await checkRateLimit(clientIp, supabase);
    
    if (!canProceed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🎯 Starting auto-match process...`);

    // ============================================
    // STEP 1: GET MATCH-READY PROS
    // ============================================
    const { data: pros, error: prosError } = await supabase
      .from("pros")
      .select("*")
      .eq("pipeline_stage", "match_ready")
      .in("status", ["active", "verified", "qualified"]);

    if (prosError) {
      console.error("❌ Error fetching pros:", prosError);
      throw prosError;
    }

    console.log(`✅ Found ${pros?.length || 0} match-ready pros`);

    // ============================================
    // STEP 2: GET ELIGIBLE CLIENTS (NO MORE BIDS!)
    // ============================================
    // Clients with credits auto-buy until they hit monthly spending cap
    const { data: eligibleClients, error: clientsError } = await supabase
      .from("clients")
      .select("id, credits_balance, monthly_spend_limit, current_month_spend, client_type, company_name, provides, zip_codes, cities, states, latitude, longitude")
      .eq("active", true)
      .gt("credits_balance", 0); // Must have credits to receive leads

    if (clientsError) {
      console.error("❌ Error fetching clients:", clientsError);
      throw clientsError;
    }

    console.log(`✅ Found ${eligibleClients?.length || 0} eligible clients (active with $${eligibleClients?.reduce((sum, c) => sum + (c.credits_balance || 0), 0)} in credits)`);

    if (!pros || pros.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No match-ready pros found",
          matches_created: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!eligibleClients || eligibleClients.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No eligible clients found",
          matches_created: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // STEP 3: AUTO-MATCH (100% BUY WITH CREDITS)
    // ============================================
    const matches: MatchScore[] = [];
    let skippedTypeIncompatible = 0;
    let skippedNoOverlap = 0;
    let skippedCriteria = 0;
    let skippedSpendLimit = 0;

    for (const pro of pros as Pro[]) {
      console.log(`\n🔍 Processing pro: ${pro.full_name} (${pro.pro_type})`);

      // ========================================
      // PAID LEAD VALIDATION (CRITICAL)
      // Paid leads MUST have either motivation > 5 OR both wants AND needs filled out
      // ========================================
      const hasMotivation = pro.motivation !== null && pro.motivation !== undefined && pro.motivation > 5;
      const hasWants = pro.wants && Array.isArray(pro.wants) && pro.wants.length > 0;
      const hasNeeds = pro.needs && pro.needs.trim().length > 0;
      
      if (!hasMotivation && !(hasWants && hasNeeds)) {
        console.log(`  ⏭️  Skipping - Must have motivation > 5 OR both wants AND needs (Required for paid leads)`);
        skippedCriteria++;
        continue;
      }

      for (const client of eligibleClients as Client[]) {
        // ========================================
        // TYPE COMPATIBILITY CHECK (CRITICAL)
        // ========================================
        if (!areTypesCompatible(pro.pro_type, client.client_type)) {
          skippedTypeIncompatible++;
          continue;
        }

        // ========================================
        // CHECK MONTHLY SPENDING LIMIT
        // ========================================
        const estimatedCost = 300; // Average cost estimate
        if (client.monthly_spend_limit && client.current_month_spend && 
            (client.current_month_spend + estimatedCost) > client.monthly_spend_limit) {
          console.log(`  ⏭️  Skipping ${client.company_name} - Would exceed monthly spend limit`);
          skippedSpendLimit++;
          continue;
        }

        // ========================================
        // CHECK GEOGRAPHIC OVERLAP (DISTANCE-BASED)
        // ========================================
        let hasGeographicMatch = false;
        let matchDistance = 0;
        
        // Priority 1: Distance-based matching using lat/lng (most accurate)
        if (pro.latitude && pro.longitude && client.latitude && client.longitude) {
          matchDistance = calculateDistance(
            pro.latitude,
            pro.longitude,
            client.latitude,
            client.longitude
          );
          
          // Match if within 50 miles
          if (matchDistance <= 50) {
            hasGeographicMatch = true;
            console.log(`  ✅ Distance match: ${matchDistance.toFixed(1)} miles from ${client.company_name}`);
          }
        }
        
        // Fallback: Array-based matching (for legacy data without coordinates)
        if (!hasGeographicMatch) {
          const hasZipOverlap = client.zip_codes && pro.zip_codes && 
            client.zip_codes.some(z => pro.zip_codes?.includes(z));
          const hasCityMatch = client.cities && pro.cities && 
            client.cities.some(c => pro.cities?.includes(c));
          const hasStateMatch = client.states && pro.states && 
            client.states.some(s => pro.states?.includes(s));

          if (hasZipOverlap || hasCityMatch || hasStateMatch) {
            hasGeographicMatch = true;
            console.log(`  ✅ Legacy array match with ${client.company_name}`);
          }
        }
        
        if (!hasGeographicMatch) {
          skippedNoOverlap++;
          continue;
        }

        // ========================================
        // CHECK IF MATCH ALREADY EXISTS
        // ========================================
        const { data: existingMatch } = await supabase
          .from("matches")
          .select("id")
          .eq("pro_id", pro.id)
          .eq("client_id", client.id)
          .maybeSingle();

        if (existingMatch) {
          console.log(`  ⏭️  Match already exists with ${client.company_name}`);
          continue;
        }

        // ========================================
        // CALCULATE SIMPLE MATCH SCORE
        // ========================================
        const matchScore = calculateDirectMatchScore(pro, client);

        console.log(`  📊 Match score: ${matchScore.score}/100`);
        console.log(`     - Geographic: ${matchScore.breakdown.geographic}`);
        console.log(`     - Performance: ${matchScore.breakdown.performance}`);

        matches.push(matchScore);
        console.log(`  ✅ Match created with ${client.company_name}!`);
      }
    }

    console.log(`\n📊 Matching Summary:`);
    console.log(`   - Pros processed: ${pros.length}`);
    console.log(`   - Clients checked: ${eligibleClients.length}`);
    console.log(`   - Type mismatches: ${skippedTypeIncompatible}`);
    console.log(`   - No geographic overlap: ${skippedNoOverlap}`);
    console.log(`   - Failed criteria: ${skippedCriteria}`);
    console.log(`   - Spend limit reached: ${skippedSpendLimit}`);
    console.log(`   - Valid matches: ${matches.length}`);

    // ============================================
    // STEP 4: INSERT MATCHES INTO DATABASE
    // ============================================
    if (matches.length > 0) {
      const matchRecords = matches.map((m) => ({
        pro_id: m.pro_id,
        client_id: m.client_id,
        match_score: m.score,
        match_type: 'lead_purchase',
        status: 'pending',
        score_breakdown: m.breakdown,
        created_at: new Date().toISOString(),
      }));

      const { data: insertedMatches, error: matchError } = await supabase
        .from("matches")
        .insert(matchRecords)
        .select();

      if (matchError) {
        console.error("❌ Error inserting matches:", matchError);
        throw matchError;
      }

      console.log(`✅ Inserted ${insertedMatches?.length || 0} matches`);

      // ========================================
      // STEP 4.5: AUTO-CHARGE ALL MATCHES (100% AUTO-BUY)
      // ========================================
      if (insertedMatches && insertedMatches.length > 0) {
        console.log(`\n💰 Auto-charging ALL matches (credits auto-buy)...`);
        
        for (const match of insertedMatches) {
          try {
            const { data: client } = await supabase
              .from("clients")
              .select("company_name, credits_balance")
              .eq("id", match.client_id)
              .single();

            console.log(`  💳 Auto-charging ${client?.company_name} for match ${match.id}`);
            
            // Call auto-charge-match function (deducts from credits)
            const { error: chargeError } = await supabase.functions.invoke("auto-charge-match", {
              body: { match_id: match.id },
            });

            if (chargeError) {
              console.error(`  ❌ Auto-charge failed for ${client?.company_name}:`, chargeError);
              // Continue processing other matches even if one fails
            } else {
              console.log(`  ✅ Successfully auto-charged ${client?.company_name}`);
            }
          } catch (error) {
            console.error(`  ❌ Error during auto-charge:`, error);
            // Continue processing other matches
          }
        }
      }

      // ========================================
      // STEP 5: UPDATE PRO PIPELINE STAGE
      // ========================================
      const proIdsMatched = [...new Set(matches.map((m) => m.pro_id))];
      
      const { error: updateError } = await supabase
        .from("pros")
        .update({ pipeline_stage: "matched" })
        .in("id", proIdsMatched);

      if (updateError) {
        console.error("❌ Error updating pro stages:", updateError);
      } else {
        console.log(`✅ Updated ${proIdsMatched.length} pros to 'matched' stage`);
      }
    }

    // ============================================
    // RETURN RESULTS
    // ============================================
    return new Response(
      JSON.stringify({
        success: true,
        message: `Auto-matching complete`,
        stats: {
          pros_processed: pros.length,
          clients_checked: eligibleClients.length,
          type_mismatches: skippedTypeIncompatible,
          no_overlap: skippedNoOverlap,
          criteria_failed: skippedCriteria,
          spend_limit_reached: skippedSpendLimit,
          matches_created: matches.length,
        },
        matches: matches.map(m => ({
          pro_id: m.pro_id,
          client_id: m.client_id,
          score: m.score,
        })),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ Fatal error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate distance between two lat/lng points using Haversine formula
 * Returns distance in miles
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if pro type matches client type
 */
function areTypesCompatible(
  proType: string,
  clientType: string
): boolean {
  return (
    (proType === 'real_estate_agent' && clientType === 'real_estate') ||
    (proType === 'mortgage_officer' && clientType === 'mortgage')
  );
}

/**
 * Calculate match score with distance-based geographic scoring
 */
function calculateDirectMatchScore(pro: Pro, client: Client): MatchScore {
  let geoScore = 0;
  let perfScore = 0;

  // Geographic scoring (0-50 points) - Distance-based
  if (pro.latitude && pro.longitude && client.latitude && client.longitude) {
    const distance = calculateDistance(
      pro.latitude,
      pro.longitude,
      client.latitude,
      client.longitude
    );
    
    // Score based on proximity (closer = higher score)
    if (distance <= 5) {
      geoScore = 50; // Within 5 miles = perfect
    } else if (distance <= 10) {
      geoScore = 45; // Within 10 miles = excellent
    } else if (distance <= 25) {
      geoScore = 35; // Within 25 miles = good
    } else if (distance <= 50) {
      geoScore = 25; // Within 50 miles = fair
    } else {
      geoScore = 10; // Beyond 50 miles = minimal
    }
  } else {
    // Fallback to array-based scoring for legacy data
    const zipOverlap = client.zip_codes && pro.zip_codes ? 
      client.zip_codes.filter(z => pro.zip_codes?.includes(z)).length : 0;
    const cityOverlap = client.cities && pro.cities ? 
      client.cities.filter(c => pro.cities?.includes(c)).length : 0;
    const stateOverlap = client.states && pro.states ? 
      client.states.filter(s => pro.states?.includes(s)).length : 0;

    geoScore += Math.min(zipOverlap * 5, 30); // Max 30 for zips
    geoScore += Math.min(cityOverlap * 5, 15); // Max 15 for cities
    geoScore += Math.min(stateOverlap * 5, 5);  // Max 5 for states
  }

  // Performance scoring (0-50 points)
  if (pro.pro_type === 'real_estate_agent') {
    perfScore += Math.min((pro.transactions || 0) * 2, 20); // Max 20 for transactions
    perfScore += Math.min((pro.total_volume_12mo || 0) / 500000, 20); // Max 20 for volume
    perfScore += Math.min((pro.qualification_score || 0) / 10, 10); // Max 10 for qualification
  } else if (pro.pro_type === 'mortgage_officer') {
    perfScore += Math.min((pro.annual_loan_volume || 0) / 1000000, 30); // Max 30 for volume
    perfScore += Math.min((pro.on_time_close_rate || 0) / 5, 20); // Max 20 for close rate
  }

  const totalScore = Math.min(geoScore + perfScore, 100);

  return {
    pro_id: pro.id,
    client_id: client.id,
    score: totalScore,
    breakdown: {
      geographic: geoScore,
      performance: perfScore,
      specialization: 0,
      type_specific: 0,
      bonus: 0,
    },
  };
}

// ========================================
// GEOGRAPHIC MATCHING HELPERS
// ========================================

function hasZipOverlap(proZips: string[], clientZips: string[]): boolean {
  if (!proZips || !clientZips) return false;
  return proZips.some((z) => clientZips.includes(z));
}

function hasCityMatch(proCities: string[], clientCities: string[]): boolean {
  if (!proCities || !clientCities) return false;
  return proCities.some((c) =>
    clientCities.some((cc) => c.toLowerCase() === cc.toLowerCase())
  );
}

function hasStateMatch(proStates: string[], clientStates: string[]): boolean {
  if (!proStates || !clientStates) return false;
  return proStates.some((s) => clientStates.includes(s));
}

function hasCityAndStateMatch(
  proCities: string[],
  proStates: string[],
  clientCities: string[],
  clientStates: string[]
): boolean {
  return hasCityMatch(proCities, clientCities) && hasStateMatch(proStates, clientStates);
}

function hasArrayOverlap(arr1?: string[], arr2?: string[]): boolean {
  if (!arr1 || !arr2) return false;
  return arr1.some((item) => arr2.includes(item));
}

function getArrayOverlapCount(arr1?: string[], arr2?: string[]): number {
  if (!arr1 || !arr2) return 0;
  return arr1.filter((item) => arr2.includes(item)).length;
}

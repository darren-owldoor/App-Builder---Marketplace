import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Pro {
  id: string;
  pro_type: 'real_estate_agent' | 'mortgage_officer';
  full_name: string;
  email: string;
  phone: string;
  pipeline_stage: string;
  cities: string[];
  states: string[];
  zip_codes: string[];
  counties: string[];
  primary_neighborhoods?: string[];
  experience?: number;
  transactions?: number;
  total_volume_12mo?: number;
  transactions_12mo?: number;
  qualification_score?: number;
  wants?: string[];
  needs?: string;
  motivation?: number;
  specializations?: string[];
  buyer_percentage?: number;
  seller_percentage?: number;
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
  cities: string[];
  states: string[];
  zip_codes: string[];
  preferences?: any;
  wants?: string;
  needs?: string;
  provides?: string[];
  bids?: Bid[];
}

interface Bid {
  id: string;
  client_id: string;
  cities: string[];
  states: string[];
  zip_codes: string[];
  bid_amount: number;
  max_leads_per_month: number;
  preferences: any;
  active: boolean;
  pro_type?: string;
  min_experience?: number;
  min_transactions?: number;
  min_volume?: number;
  coverage_data?: any;
}

interface MatchPreview {
  pro: {
    id: string;
    name: string;
    email: string;
    type: string;
    location: string;
    experience?: number;
    transactions?: number;
    volume?: number;
    motivation?: number;
    wants?: string[];
  };
  client: {
    id: string;
    name: string;
    type: string;
    credits: number;
    wants?: string;
    needs?: string;
    provides?: string[]; // What the team provides
    company_name?: string;
    contact_name?: string;
    brokerage?: string;
    email?: string;
    phone?: string;
    cities?: string[];
    states?: string[];
    zip_codes?: string[];
  };
  bid: {
    id: string;
    amount: number;
    coverage: string;
  };
  score: number;
  breakdown: {
    geographic: number;
    performance: number;
    specialization: number;
    type_specific: number;
    bonus: number;
  };
  match_reason: string;
  would_create: boolean;
  block_reason?: string;
  perfect_match?: boolean; // If all 3 wants are matched
  wants_match_count?: number; // How many wants matched
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { client_id } = await req.json();

    console.log("🔍 Starting match preview...");
    if (client_id) {
      console.log(`   Filtering for client: ${client_id}`);
    }

    // Get match-ready pros
    const { data: pros, error: prosError } = await supabase
      .from("pros")
      .select("*")
      .eq("pipeline_stage", "match_ready")
      .in("status", ["active", "verified", "qualified"]);

    if (prosError) throw prosError;

    // Get eligible clients with ALL fields
    let clientQuery = supabase
      .from("clients")
      .select("*")
      .eq("active", true)
      .gt("credits_balance", 0)
      .not("current_package_id", "is", null);

    if (client_id) {
      clientQuery = clientQuery.eq("id", client_id);
    }

    const { data: eligibleClients, error: clientsError } = await clientQuery;
    if (clientsError) throw clientsError;

    if (!eligibleClients || eligibleClients.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          previews: [],
          summary: {
            total_pros: pros?.length || 0,
            eligible_clients: 0,
            potential_matches: 0,
            would_create: 0,
            blocked: 0,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get active bids
    const eligibleClientIds = eligibleClients.map(c => c.id);
    const { data: bids, error: bidsError } = await supabase
      .from("bids")
      .select("*")
      .in("client_id", eligibleClientIds)
      .eq("active", true);

    if (bidsError) throw bidsError;

    const previews: MatchPreview[] = [];
    let wouldCreate = 0;
    let blocked = 0;

    for (const pro of (pros || []) as Pro[]) {
      // Check motivation/wants/needs requirement
      const hasMotivation = pro.motivation !== null && pro.motivation !== undefined && pro.motivation > 5;
      const hasWants = pro.wants && Array.isArray(pro.wants) && pro.wants.length > 0;
      const hasNeeds = pro.needs && pro.needs.trim().length > 0;
      
      if (!hasMotivation && !(hasWants && hasNeeds)) {
        previews.push({
          pro: {
            id: pro.id,
            name: pro.full_name,
            email: pro.email,
            type: pro.pro_type,
            location: `${pro.cities?.[0] || ''}, ${pro.states?.[0] || ''}`,
            experience: pro.experience,
            transactions: pro.transactions_12mo,
            volume: pro.total_volume_12mo,
            motivation: pro.motivation,
            wants: pro.wants,
          },
          client: { id: '', name: 'N/A', type: '', credits: 0, wants: '', needs: '' },
          bid: { id: '', amount: 0, coverage: '' },
          score: 0,
          breakdown: { geographic: 0, performance: 0, specialization: 0, type_specific: 0, bonus: 0 },
          match_reason: '',
          would_create: false,
          block_reason: 'Must have motivation > 5 OR both wants AND needs (required for paid leads)',
        });
        blocked++;
        continue;
      }

      for (const bid of (bids || []) as Bid[]) {
        const client = eligibleClients.find(c => c.id === bid.client_id);
        if (!client) continue;

        // Type compatibility
        const bidProType = bid.pro_type || 'real_estate';
        if (!areTypesCompatible(pro.pro_type, bidProType === 'real_estate' ? 'real_estate' : 'mortgage')) {
          previews.push({
            pro: {
              id: pro.id,
              name: pro.full_name,
              email: pro.email,
              type: pro.pro_type,
              location: `${pro.cities?.[0] || ''}, ${pro.states?.[0] || ''}`,
              experience: pro.experience,
              transactions: pro.transactions_12mo,
              volume: pro.total_volume_12mo,
              motivation: pro.motivation,
              wants: pro.wants,
            },
            client: {
              id: client.id,
              name: client.company_name || client.contact_name,
              type: client.client_type,
              credits: client.credits_balance,
              wants: client.wants,
              needs: client.needs,
              provides: client.provides,
              company_name: client.company_name,
              contact_name: client.contact_name,
              brokerage: client.brokerage,
              email: client.email,
              phone: client.phone,
              cities: client.cities,
              states: client.states,
              zip_codes: client.zip_codes,
            },
            bid: {
              id: bid.id,
              amount: bid.bid_amount,
              coverage: `${bid.cities?.length || 0} cities, ${bid.states?.length || 0} states`,
            },
            score: 0,
            breakdown: { geographic: 0, performance: 0, specialization: 0, type_specific: 0, bonus: 0 },
            match_reason: '',
            would_create: false,
            block_reason: `Type mismatch: Pro is ${pro.pro_type}, Bid requires ${bidProType}`,
          });
          blocked++;
          continue;
        }

        // Check criteria
        if (bid.min_experience && pro.experience && pro.experience < bid.min_experience) {
          previews.push({
            pro: {
              id: pro.id,
              name: pro.full_name,
              email: pro.email,
              type: pro.pro_type,
              location: `${pro.cities?.[0] || ''}, ${pro.states?.[0] || ''}`,
              experience: pro.experience,
              transactions: pro.transactions_12mo,
              volume: pro.total_volume_12mo,
              motivation: pro.motivation,
              wants: pro.wants,
            },
            client: {
              id: client.id,
              name: client.company_name || client.contact_name,
              type: client.client_type,
              credits: client.credits_balance,
              wants: client.wants,
              needs: client.needs,
              provides: client.provides,
              company_name: client.company_name,
              contact_name: client.contact_name,
              brokerage: client.brokerage,
              email: client.email,
              phone: client.phone,
              cities: client.cities,
              states: client.states,
              zip_codes: client.zip_codes,
            },
            bid: {
              id: bid.id,
              amount: bid.bid_amount,
              coverage: `${bid.cities?.length || 0} cities, ${bid.states?.length || 0} states`,
            },
            score: 0,
            breakdown: { geographic: 0, performance: 0, specialization: 0, type_specific: 0, bonus: 0 },
            match_reason: '',
            would_create: false,
            block_reason: `Experience too low: ${pro.experience} < ${bid.min_experience} years required`,
          });
          blocked++;
          continue;
        }

        if (bid.min_transactions && pro.transactions_12mo && pro.transactions_12mo < bid.min_transactions) {
          previews.push({
            pro: {
              id: pro.id,
              name: pro.full_name,
              email: pro.email,
              type: pro.pro_type,
              location: `${pro.cities?.[0] || ''}, ${pro.states?.[0] || ''}`,
              experience: pro.experience,
              transactions: pro.transactions_12mo,
              volume: pro.total_volume_12mo,
              motivation: pro.motivation,
              wants: pro.wants,
            },
            client: {
              id: client.id,
              name: client.company_name || client.contact_name,
              type: client.client_type,
              credits: client.credits_balance,
              wants: client.wants,
              needs: client.needs,
              provides: client.provides,
              company_name: client.company_name,
              contact_name: client.contact_name,
              brokerage: client.brokerage,
              email: client.email,
              phone: client.phone,
              cities: client.cities,
              states: client.states,
              zip_codes: client.zip_codes,
            },
            bid: {
              id: bid.id,
              amount: bid.bid_amount,
              coverage: `${bid.cities?.length || 0} cities, ${bid.states?.length || 0} states`,
            },
            score: 0,
            breakdown: { geographic: 0, performance: 0, specialization: 0, type_specific: 0, bonus: 0 },
            match_reason: '',
            would_create: false,
            block_reason: `Transactions too low: ${pro.transactions_12mo} < ${bid.min_transactions} required`,
          });
          blocked++;
          continue;
        }

        // Check existing match
        const { data: existingMatch } = await supabase
          .from("matches")
          .select("id")
          .eq("pro_id", pro.id)
          .eq("bid_id", bid.id)
          .maybeSingle();

        if (existingMatch) {
          previews.push({
            pro: {
              id: pro.id,
              name: pro.full_name,
              email: pro.email,
              type: pro.pro_type,
              location: `${pro.cities?.[0] || ''}, ${pro.states?.[0] || ''}`,
              experience: pro.experience,
              transactions: pro.transactions_12mo,
              volume: pro.total_volume_12mo,
              motivation: pro.motivation,
              wants: pro.wants,
            },
            client: {
              id: client.id,
              name: client.company_name || client.contact_name,
              type: client.client_type,
              credits: client.credits_balance,
              wants: client.wants,
              needs: client.needs,
              provides: client.provides,
              company_name: client.company_name,
              contact_name: client.contact_name,
              brokerage: client.brokerage,
              email: client.email,
              phone: client.phone,
              cities: client.cities,
              states: client.states,
              zip_codes: client.zip_codes,
            },
            bid: {
              id: bid.id,
              amount: bid.bid_amount,
              coverage: `${bid.cities?.length || 0} cities, ${bid.states?.length || 0} states`,
            },
            score: 0,
            breakdown: { geographic: 0, performance: 0, specialization: 0, type_specific: 0, bonus: 0 },
            match_reason: '',
            would_create: false,
            block_reason: 'Match already exists',
          });
          blocked++;
          continue;
        }

        // Calculate score
        const matchScore = calculateMatchScoreForBid(pro, bid, client);

        if (matchScore.score < 20) {
          previews.push({
            pro: {
              id: pro.id,
              name: pro.full_name,
              email: pro.email,
              type: pro.pro_type,
              location: `${pro.cities?.[0] || ''}, ${pro.states?.[0] || ''}`,
              experience: pro.experience,
              transactions: pro.transactions_12mo,
              volume: pro.total_volume_12mo,
              motivation: pro.motivation,
              wants: pro.wants,
            },
            client: {
              id: client.id,
              name: client.company_name || client.contact_name,
              type: client.client_type,
              credits: client.credits_balance,
              wants: client.wants,
              needs: client.needs,
              provides: client.provides,
              company_name: client.company_name,
              contact_name: client.contact_name,
              brokerage: client.brokerage,
              email: client.email,
              phone: client.phone,
              cities: client.cities,
              states: client.states,
              zip_codes: client.zip_codes,
            },
            bid: {
              id: bid.id,
              amount: bid.bid_amount,
              coverage: `${bid.cities?.length || 0} cities, ${bid.states?.length || 0} states`,
            },
            score: matchScore.score,
            breakdown: matchScore.breakdown,
            match_reason: getMatchReason(matchScore.breakdown),
            would_create: false,
            block_reason: `Score too low: ${matchScore.score} < 20 minimum`,
          });
          blocked++;
          continue;
        }

        // Calculate match count for display
        let wantsMatchCount = 0;
        if (client.provides && Array.isArray(client.provides) && pro.wants && Array.isArray(pro.wants)) {
          for (const want of pro.wants) {
            if (client.provides.some((p: string) => 
              p.toLowerCase() === want.toLowerCase() ||
              p.toLowerCase().includes(want.toLowerCase()) ||
              want.toLowerCase().includes(p.toLowerCase())
            )) {
              wantsMatchCount++;
            }
          }
        }

        // Would create!
        previews.push({
          pro: {
            id: pro.id,
            name: pro.full_name,
            email: pro.email,
            type: pro.pro_type,
            location: `${pro.cities?.[0] || ''}, ${pro.states?.[0] || ''}`,
            experience: pro.experience,
            transactions: pro.transactions_12mo,
            volume: pro.total_volume_12mo,
            motivation: pro.motivation,
            wants: pro.wants,
          },
          client: {
            id: client.id,
            name: client.company_name || client.contact_name,
            type: client.client_type,
            credits: client.credits_balance,
            wants: client.wants,
            needs: client.needs,
            provides: client.provides,
            company_name: client.company_name,
            contact_name: client.contact_name,
            brokerage: client.brokerage,
            email: client.email,
            phone: client.phone,
            cities: client.cities,
            states: client.states,
            zip_codes: client.zip_codes,
          },
          bid: {
            id: bid.id,
            amount: bid.bid_amount,
            coverage: `${bid.cities?.length || 0} cities, ${bid.states?.length || 0} states`,
          },
          score: matchScore.score,
          breakdown: matchScore.breakdown,
          match_reason: getMatchReason(matchScore.breakdown),
          would_create: true,
          perfect_match: wantsMatchCount === 3 && pro.wants?.length === 3,
          wants_match_count: wantsMatchCount,
        });
        wouldCreate++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        previews,
        summary: {
          total_pros: pros?.length || 0,
          eligible_clients: eligibleClients.length,
          potential_matches: previews.length,
          would_create: wouldCreate,
          blocked: blocked,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper functions (copied from auto-match-leads)
function areTypesCompatible(proType: string, clientType: string): boolean {
  return (
    (proType === 'real_estate_agent' && clientType === 'real_estate') ||
    (proType === 'mortgage_officer' && clientType === 'mortgage')
  );
}

function calculateMatchScoreForBid(pro: Pro, bid: Bid, client: any): any {
  if (pro.pro_type === 'real_estate_agent') {
    return calculateREAgentScoreForBid(pro, bid, client);
  }
  return { score: 0, breakdown: { geographic: 0, performance: 0, specialization: 0, type_specific: 0, bonus: 0 } };
}

function calculateREAgentScoreForBid(pro: Pro, bid: Bid, client: any): any {
  const breakdown = { geographic: 0, performance: 0, specialization: 0, type_specific: 0, bonus: 0 };
  
  let hasLocationMatch = false;
  if (hasZipOverlap(pro.zip_codes, bid.zip_codes)) {
    breakdown.geographic = 40;
    hasLocationMatch = true;
  } else if (hasArrayOverlap(pro.primary_neighborhoods, bid.cities)) {
    breakdown.geographic = 35;
    hasLocationMatch = true;
  } else if (hasCityAndStateMatch(pro.cities, pro.states, bid.cities, bid.states)) {
    breakdown.geographic = 30;
    hasLocationMatch = true;
  } else if (hasCityMatch(pro.cities, bid.cities)) {
    breakdown.geographic = 20;
    hasLocationMatch = true;
  } else if (hasStateMatch(pro.states, bid.states)) {
    breakdown.geographic = 10;
    hasLocationMatch = true;
  }

  if (!hasLocationMatch) {
    return { score: 0, breakdown: { geographic: 0, performance: 0, specialization: 0, type_specific: 0, bonus: 0 } };
  }

  if (pro.total_volume_12mo) {
    if (pro.total_volume_12mo >= 5000000) breakdown.performance += 15;
    else if (pro.total_volume_12mo >= 2000000) breakdown.performance += 12;
    else if (pro.total_volume_12mo >= 1000000) breakdown.performance += 9;
    else if (pro.total_volume_12mo >= 500000) breakdown.performance += 6;
  }

  if (pro.transactions_12mo) {
    if (pro.transactions_12mo >= 30) breakdown.performance += 10;
    else if (pro.transactions_12mo >= 20) breakdown.performance += 7;
    else if (pro.transactions_12mo >= 10) breakdown.performance += 5;
  }

  // PROVIDES/WANTS SCORING - What team offers vs what agent wants
  if (client.provides && Array.isArray(client.provides) && client.provides.length > 0 && 
      pro.wants && Array.isArray(pro.wants) && pro.wants.length > 0) {
    
    let matchCount = 0;
    for (const want of pro.wants) {
      if (client.provides.some((p: string) => 
        p.toLowerCase() === want.toLowerCase() ||
        p.toLowerCase().includes(want.toLowerCase()) ||
        want.toLowerCase().includes(p.toLowerCase())
      )) {
        matchCount++;
      }
    }
    
    // Score based on how many wants are matched
    if (matchCount === 3 && pro.wants.length === 3) {
      // PERFECT MATCH - all 3 wants matched
      breakdown.specialization += 15;
      breakdown.bonus += 10; // Extra bonus for perfect match
    } else if (matchCount === 2) {
      breakdown.specialization += 10;
    } else if (matchCount === 1) {
      breakdown.specialization += 5;
    }
  }

  if (pro.motivation && pro.motivation >= 8) breakdown.bonus += 10;
  else if (pro.motivation && pro.motivation >= 6) breakdown.bonus += 5;

  const score = breakdown.geographic + breakdown.performance + breakdown.specialization + breakdown.type_specific + breakdown.bonus;
  return { score, breakdown };
}

function hasZipOverlap(arr1?: string[], arr2?: string[]): boolean {
  if (!arr1 || !arr2) return false;
  return arr1.some(z => arr2.includes(z));
}

function hasArrayOverlap(arr1?: string[], arr2?: string[]): boolean {
  if (!arr1 || !arr2) return false;
  return arr1.some(item => arr2.some(item2 => item.toLowerCase() === item2.toLowerCase()));
}

function hasCityAndStateMatch(cities1?: string[], states1?: string[], cities2?: string[], states2?: string[]): boolean {
  return hasCityMatch(cities1, cities2) && hasStateMatch(states1, states2);
}

function hasCityMatch(cities1?: string[], cities2?: string[]): boolean {
  if (!cities1 || !cities2) return false;
  return cities1.some(c => cities2.some(c2 => c.toLowerCase() === c2.toLowerCase()));
}

function hasStateMatch(states1?: string[], states2?: string[]): boolean {
  if (!states1 || !states2) return false;
  return states1.some(s => states2.some(s2 => s.toLowerCase() === s2.toLowerCase()));
}

function getMatchReason(breakdown: any): string {
  const reasons = [];
  if (breakdown.geographic >= 30) reasons.push(`Strong geo match (${breakdown.geographic}pts)`);
  else if (breakdown.geographic > 0) reasons.push(`Geo match (${breakdown.geographic}pts)`);
  if (breakdown.performance >= 15) reasons.push(`High performer (${breakdown.performance}pts)`);
  else if (breakdown.performance > 0) reasons.push(`Performance (${breakdown.performance}pts)`);
  if (breakdown.bonus > 0) reasons.push(`Motivation bonus (${breakdown.bonus}pts)`);
  return reasons.join(', ') || 'Basic match';
}

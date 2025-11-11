import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FieldDefinition {
  field_name: string;
  field_type: string;
  use_ai_matching: boolean;
  matching_weight: number;
  allowed_values: string[] | null;
}

interface MatchBreakdown {
  total_score: number;
  field_scores: Array<{
    field_name: string;
    score: number;
    max_score: number;
    match_type: string;
    details: string;
  }>;
  geographic_score: number;
  performance_score: number;
  ai_semantic_score: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { pro_id, client_id, use_ai } = await req.json();

    console.log(`🤖 AI-Powered Matching: Pro ${pro_id} with Client ${client_id}`);

    // Fetch field definitions
    const { data: fieldDefs, error: fieldDefsError } = await supabase
      .from("field_definitions")
      .select("*")
      .eq("active", true)
      .gt("matching_weight", 0)
      .order("matching_weight", { ascending: false });

    if (fieldDefsError) throw fieldDefsError;

    console.log(`📋 Loaded ${fieldDefs?.length || 0} matchable field definitions`);

    // Fetch pro data
    const { data: pro, error: proError } = await supabase
      .from("pros")
      .select("*")
      .eq("id", pro_id)
      .single();

    if (proError) throw proError;

    // Fetch client data
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", client_id)
      .single();

    if (clientError) throw clientError;

    // Calculate match using intelligent matcher
    const breakdown = await calculateIntelligentMatch(
      pro,
      client,
      fieldDefs as FieldDefinition[],
      use_ai || false
    );

    console.log(`✅ Match calculated: ${breakdown.total_score}/100`);
    console.log(`   - Geographic: ${breakdown.geographic_score}`);
    console.log(`   - Performance: ${breakdown.performance_score}`);
    console.log(`   - AI Semantic: ${breakdown.ai_semantic_score}`);

    return new Response(
      JSON.stringify({
        success: true,
        pro_id,
        client_id,
        breakdown,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ Error:", error);
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

async function calculateIntelligentMatch(
  pro: any,
  client: any,
  fieldDefs: FieldDefinition[],
  useAI: boolean
): Promise<MatchBreakdown> {
  const breakdown: MatchBreakdown = {
    total_score: 0,
    field_scores: [],
    geographic_score: 0,
    performance_score: 0,
    ai_semantic_score: 0,
  };

  const totalWeight = fieldDefs.reduce((sum, f) => sum + f.matching_weight, 0);

  for (const field of fieldDefs) {
    const proValue = pro[field.field_name];
    const clientValue = client[field.field_name];

    const fieldScore = await scoreField(
      field,
      proValue,
      clientValue,
      useAI
    );

    const weightedScore = (fieldScore.score / 100) * field.matching_weight;

    breakdown.field_scores.push({
      field_name: field.field_name,
      score: weightedScore,
      max_score: field.matching_weight,
      match_type: fieldScore.match_type,
      details: fieldScore.details,
    });

    // Categorize scores
    if (isGeographicField(field.field_name)) {
      breakdown.geographic_score += weightedScore;
    } else if (isPerformanceField(field.field_name)) {
      breakdown.performance_score += weightedScore;
    } else if (fieldScore.match_type === 'semantic') {
      breakdown.ai_semantic_score += weightedScore;
    }

    breakdown.total_score += weightedScore;
  }

  // Normalize to 0-100 scale
  breakdown.total_score = totalWeight > 0 
    ? Math.round((breakdown.total_score / totalWeight) * 100)
    : 0;

  return breakdown;
}

async function scoreField(
  field: FieldDefinition,
  value1: any,
  value2: any,
  useAI: boolean
): Promise<{ score: number; match_type: string; details: string }> {
  if (value1 === null || value1 === undefined || value2 === null || value2 === undefined) {
    return { score: 0, match_type: 'none', details: 'Missing value(s)' };
  }

  switch (field.field_type) {
    case 'array':
    case 'multi_select':
      return scoreArrayFields(value1, value2);
    
    case 'number':
    case 'currency':
      return scoreNumericFields(value1, value2);
    
    case 'text':
    case 'textarea':
      return await scoreTextFields(field, value1, value2, useAI);
    
    case 'boolean':
      return scoreBooleanFields(value1, value2);
    
    case 'select':
    case 'enum':
      return scoreSelectFields(value1, value2);
    
    default:
      return { score: 0, match_type: 'none', details: 'Unknown type' };
  }
}

async function scoreTextFields(
  field: FieldDefinition,
  text1: string,
  text2: string,
  useAI: boolean
): Promise<{ score: number; match_type: string; details: string }> {
  const str1 = String(text1).toLowerCase().trim();
  const str2 = String(text2).toLowerCase().trim();

  if (str1 === str2) {
    return { score: 100, match_type: 'exact', details: 'Exact match' };
  }

  // Use AI if enabled for this field
  if (useAI && field.use_ai_matching) {
    try {
      const result = await callSemanticMatching(str1, str2, field.field_name);
      return {
        score: Math.round(result.score * 100),
        match_type: 'semantic',
        details: result.reasoning,
      };
    } catch (error) {
      console.error(`AI matching failed for ${field.field_name}:`, error);
    }
  }

  // Fallback to simple similarity
  const longerStr = str1.length > str2.length ? str1 : str2;
  const shorterStr = str1.length > str2.length ? str2 : str1;
  
  if (longerStr.includes(shorterStr)) {
    const score = Math.round((shorterStr.length / longerStr.length) * 70);
    return { score, match_type: 'semantic', details: `${score}% similarity` };
  }

  return { score: 0, match_type: 'semantic', details: 'No similarity' };
}

async function callSemanticMatching(
  text1: string,
  text2: string,
  context: string
): Promise<{ score: number; reasoning: string }> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: 'You are a semantic matching expert. Compare two texts and return a similarity score (0-1) and brief reasoning.',
        },
        {
          role: 'user',
          content: `Compare these two "${context}" values and rate their semantic similarity from 0 (completely different) to 1 (identical meaning):\n\nText 1: ${text1}\n\nText 2: ${text2}\n\nRespond with JSON: {"score": 0.0-1.0, "reasoning": "brief explanation"}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    const parsed = JSON.parse(content);
    return {
      score: Math.max(0, Math.min(1, parsed.score)),
      reasoning: parsed.reasoning || 'AI semantic comparison',
    };
  } catch {
    // Fallback if JSON parsing fails
    return { score: 0.5, reasoning: 'Unable to parse AI response' };
  }
}

function scoreArrayFields(
  arr1: any[],
  arr2: any[]
): { score: number; match_type: string; details: string } {
  const array1 = Array.isArray(arr1) ? arr1 : [];
  const array2 = Array.isArray(arr2) ? arr2 : [];

  if (array1.length === 0 || array2.length === 0) {
    return { score: 0, match_type: 'overlap', details: 'Empty array(s)' };
  }

  const normalized1 = array1.map(v => String(v).toLowerCase().trim());
  const normalized2 = array2.map(v => String(v).toLowerCase().trim());

  const intersection = normalized1.filter(v => normalized2.includes(v));
  const union = [...new Set([...normalized1, ...normalized2])];

  const overlapCount = intersection.length;
  const totalCount = union.length;
  const score = totalCount > 0 ? Math.round((overlapCount / totalCount) * 100) : 0;

  return {
    score,
    match_type: 'overlap',
    details: `${overlapCount}/${totalCount} items match`,
  };
}

function scoreNumericFields(
  num1: number,
  num2: number
): { score: number; match_type: string; details: string } {
  const n1 = Number(num1);
  const n2 = Number(num2);

  if (isNaN(n1) || isNaN(n2)) {
    return { score: 0, match_type: 'range', details: 'Invalid number(s)' };
  }

  if (n1 === n2) {
    return { score: 100, match_type: 'exact', details: 'Exact match' };
  }

  const difference = Math.abs(n1 - n2);
  const average = (n1 + n2) / 2;
  const percentDiff = average !== 0 ? (difference / average) * 100 : 100;

  let score = 0;
  if (percentDiff < 10) score = 90;
  else if (percentDiff < 25) score = 70;
  else if (percentDiff < 50) score = 50;
  else if (percentDiff < 75) score = 30;
  else if (percentDiff < 100) score = 10;

  return {
    score,
    match_type: 'range',
    details: `${percentDiff.toFixed(1)}% difference`,
  };
}

function scoreBooleanFields(
  bool1: boolean,
  bool2: boolean
): { score: number; match_type: string; details: string } {
  const match = bool1 === bool2;
  return {
    score: match ? 100 : 0,
    match_type: 'exact',
    details: match ? 'Match' : 'No match',
  };
}

function scoreSelectFields(
  val1: string,
  val2: string
): { score: number; match_type: string; details: string } {
  const str1 = String(val1).toLowerCase().trim();
  const str2 = String(val2).toLowerCase().trim();
  const match = str1 === str2;

  return {
    score: match ? 100 : 0,
    match_type: 'exact',
    details: match ? `Both: ${val1}` : `${val1} vs ${val2}`,
  };
}

function isGeographicField(fieldName: string): boolean {
  return ['cities', 'states', 'zip_codes', 'counties', 'primary_neighborhoods'].includes(fieldName);
}

function isPerformanceField(fieldName: string): boolean {
  return [
    'experience',
    'transactions',
    'total_volume_12mo',
    'transactions_12mo',
    'annual_loan_volume',
    'qualification_score',
  ].includes(fieldName);
}

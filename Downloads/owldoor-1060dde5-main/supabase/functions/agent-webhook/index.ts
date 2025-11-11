import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

interface AgentLeadPayload {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  brokerage?: string;
  license?: string;
  experience?: number;
  transactions?: number;
  total_volume?: number;
  total_units?: number;
  buyer_volume?: number;
  buyer_units?: number;
  buyer_percentage?: number;
  seller_volume?: number;
  seller_units?: number;
  seller_percentage?: number;
  dual_volume?: number;
  dual_units?: number;
  cities?: string[];
  counties?: string[];
  states?: string[];
  zip_codes?: string[];
  address?: string;
  linkedin_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  website_url?: string;
  profile_url?: string;
  notes?: string;
}

const normalizePhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  return `+${cleaned}`;
};

const calculateQualificationScore = (
  transactions: number = 0,
  volume: number = 0,
  experience: number = 0
): number => {
  let score = 0;
  
  // Volume scoring (0-40 points)
  if (volume >= 50000000) score += 40;
  else if (volume >= 25000000) score += 30;
  else if (volume >= 10000000) score += 20;
  else if (volume >= 5000000) score += 10;
  
  // Transaction scoring (0-30 points)
  if (transactions >= 50) score += 30;
  else if (transactions >= 25) score += 20;
  else if (transactions >= 10) score += 10;
  else if (transactions >= 5) score += 5;
  
  // Experience scoring (0-30 points)
  if (experience >= 10) score += 30;
  else if (experience >= 5) score += 20;
  else if (experience >= 3) score += 10;
  else if (experience >= 1) score += 5;
  
  return Math.min(score, 100);
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate webhook secret
    const webhookSecret = Deno.env.get('AGENT_WEBHOOK_SECRET');
    const providedSecret = req.headers.get('x-webhook-secret');

    if (!webhookSecret) {
      console.error('AGENT_WEBHOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (providedSecret !== webhookSecret) {
      console.error('Invalid webhook secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: AgentLeadPayload = await req.json();
    console.log('Received agent lead payload:', JSON.stringify(payload, null, 2));

    // Validate required fields
    if (!payload.first_name || !payload.last_name || !payload.phone) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: first_name, last_name, and phone are required' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(payload.phone);
    const fullName = `${payload.first_name} ${payload.last_name}`.trim();

    // Calculate qualification score
    const qualificationScore = calculateQualificationScore(
      payload.transactions,
      payload.total_volume,
      payload.experience
    );

    // Determine pipeline stage based on score
    let pipelineStage = 'new';
    if (qualificationScore >= 70) pipelineStage = 'qualified';
    else if (qualificationScore >= 40) pipelineStage = 'qualifying';

    // Prepare lead data
    const leadData = {
      first_name: payload.first_name,
      last_name: payload.last_name,
      full_name: fullName,
      phone: normalizedPhone,
      email: payload.email || `${normalizedPhone.replace(/\+/g, '')}@temp.owldoor.com`,
      lead_type: 'real_estate_agent',
      source: 'model-match',
      brokerage: payload.brokerage,
      license: payload.license,
      experience: payload.experience,
      transactions: payload.transactions,
      total_volume: payload.total_volume,
      total_units: payload.total_units,
      buyer_volume: payload.buyer_volume,
      buyer_units: payload.buyer_units,
      buyer_percentage: payload.buyer_percentage,
      seller_volume: payload.seller_volume,
      seller_units: payload.seller_units,
      seller_percentage: payload.seller_percentage,
      dual_volume: payload.dual_volume,
      dual_units: payload.dual_units,
      cities: payload.cities,
      counties: payload.counties,
      states: payload.states,
      zip_codes: payload.zip_codes,
      address: payload.address,
      linkedin_url: payload.linkedin_url,
      facebook_url: payload.facebook_url,
      instagram_url: payload.instagram_url,
      twitter_url: payload.twitter_url,
      website_url: payload.website_url,
      profile_url: payload.profile_url,
      notes: payload.notes,
      qualification_score: qualificationScore,
      pipeline_stage: pipelineStage,
      pipeline_type: 'staff',
      status: 'new',
    };

    // Check if agent exists by phone
    const { data: existingLead } = await supabase
      .from('pros')
      .select('id')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    let result;
    if (existingLead) {
      // Update existing agent
      const { data, error } = await supabase
        .from('pros')
        .update(leadData)
        .eq('id', existingLead.id)
        .select()
        .single();

      if (error) throw error;
      
      result = {
        success: true,
        action: 'updated',
        lead: data,
        message: 'Agent lead updated successfully'
      };
      console.log('Updated existing lead:', existingLead.id);
    } else {
      // Create new agent
      const { data, error } = await supabase
        .from('pros')
        .insert(leadData)
        .select()
        .single();

      if (error) throw error;
      
      result = {
        success: true,
        action: 'created',
        lead: data,
        message: 'Agent lead created successfully'
      };
      console.log('Created new lead:', data.id);
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error processing agent lead:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

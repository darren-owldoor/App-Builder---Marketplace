import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

interface AgentLeadData {
  // Required fields - support both camelCase and snake_case
  first_name?: string;
  firstName?: string;
  last_name?: string;
  lastName?: string;
  email?: string;
  Email?: string;
  phone?: string;
  Phone?: string;
  
  // Client assignment fields
  client_email?: string;
  client_phone?: string;
  lead_price?: number;
  
  // Contact Links
  linkedin_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  youtube_url?: string;
  website_url?: string;
  
  // Professional Information
  company?: string;
  brokerage?: string;
  address?: string;
  
  // Volume Metrics
  total_volume?: number | string;
  total_units?: number;
  transactions?: number;
  buyer_volume?: number | string;
  buyer_financed?: number | string;
  buyer_units?: number;
  seller_volume?: number | string;
  seller_financed?: number | string;
  seller_units?: number;
  dual_volume?: number | string;
  dual_units?: number;
  
  // Percentage Metrics
  Buyer_Percentage?: number | string;
  Seller_Percentage?: number | string;
  percent_financed?: number | string;
  seller_side_percentage?: number | string;
  purchase_percentage?: number | string;
  conventional_percentage?: number | string;
  
  // Relationship Data
  top_lender?: string;
  top_lender_share?: number | string;
  top_lender_volume?: number | string;
  top_originator?: string;
  top_originator_share?: number | string;
  top_originator_volume?: number | string;
  
  // Calculated Metrics
  transactions_per_year?: number;
  
  // Location Data
  cities?: string[];
  states?: string[];
  
  // Metadata
  source?: string;
  date?: string;
  notes?: string;
  
  // Legacy fields
  state?: string;
  city?: string;
  zip_code?: string;
  zipCode?: string;
  years_experience?: number;
  interest_level?: number;
}

const normalizePhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  return phone;
};

const calculateQualificationScore = (
  transactions: number = 0,
  yearsExp: number = 0,
  interest: number = 5
): number => {
  const transactionScore = Math.min(transactions * 10, 40);
  const experienceScore = Math.min(yearsExp * 5, 30);
  const interestScore = interest * 6;
  return Math.min(transactionScore + experienceScore + interestScore, 100);
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication - accept webhook secret, Anthropic API key, OR valid Supabase JWT
    const webhookSecret = Deno.env.get('AGENT_LEAD_WEBHOOK_SECRET');
    const providedSecret = req.headers.get('x-webhook-secret');
    const authHeader = req.headers.get('authorization');
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');

    let isAuthenticated = false;
    
    // Check webhook secret
    if (webhookSecret && providedSecret === webhookSecret) {
      isAuthenticated = true;
      console.log('Authenticated via webhook secret');
    }

    // Check Anthropic API key
    if (!isAuthenticated && anthropicKey && authHeader) {
      const bearerToken = authHeader.replace('Bearer ', '');
      if (bearerToken === anthropicKey) {
        isAuthenticated = true;
        console.log('Authenticated via Anthropic API key');
      }
    }

    // Check Supabase JWT token (for admin/internal calls)
    if (!isAuthenticated && authHeader) {
      try {
        const supabaseAuth = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
          { global: { headers: { Authorization: authHeader } } }
        );
        
        const { data: { user }, error } = await supabaseAuth.auth.getUser();
        
        if (user && !error) {
          isAuthenticated = true;
          console.log('Authenticated via Supabase JWT token');
        }
      } catch (error) {
        console.log('JWT validation failed:', error);
      }
    }

    if (!isAuthenticated) {
      console.error('Unauthorized: No valid authentication provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Provide x-webhook-secret, valid JWT token, or Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Agent lead webhook received');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Parse incoming data
    const leadData: AgentLeadData = await req.json();
    console.log('Received lead data:', { ...leadData, phone: '***', Phone: '***' });

    // Normalize field names (support both camelCase and snake_case)
    const first_name = leadData.first_name || leadData.firstName;
    const last_name = leadData.last_name || leadData.lastName;
    const phone = leadData.phone || leadData.Phone;
    const email = leadData.email || leadData.Email;
    const company = leadData.company || leadData.brokerage;
    const brokerage = leadData.brokerage || leadData.company;
    
    // Model Match arrays vs legacy single values
    const cities = leadData.cities || (leadData.city ? [leadData.city] : null);
    const states = leadData.states || (leadData.state ? [leadData.state] : null);
    
    // Get transactions - Model Match sends total transactions directly
    const transactions = leadData.transactions || leadData.total_units || leadData.transactions_per_year || 0;
    
    // Parse numeric values from strings (handle "$1,234.56" format)
    const parseNumeric = (val: number | string | undefined): number | null => {
      if (!val) return null;
      if (typeof val === 'number') return val;
      const cleaned = val.replace(/[$,]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? null : parsed;
    };
    
    const parsePercentage = (val: number | string | undefined): number | null => {
      if (!val) return null;
      if (typeof val === 'number') return val;
      const cleaned = val.replace('%', '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? null : parsed;
    };

    // Validate required fields
    if (!first_name || !last_name || !phone) {
      console.error('Missing required fields:', { first_name, last_name, phone });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: first_name, last_name, phone' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phone);
    console.log('Normalized phone:', normalizedPhone);

    // Generate full name
    const full_name = `${first_name} ${last_name}`.trim();

    // Generate email if not provided
    const finalEmail = email || `${first_name.toLowerCase()}.${last_name.toLowerCase()}@placeholder.com`;

    // Calculate qualification score
    const qualificationScore = calculateQualificationScore(
      transactions,
      leadData.years_experience || 0,
      leadData.interest_level || 5
    );

    // Determine status based on qualification score
    let status = 'new';
    if (qualificationScore >= 70) {
      status = 'qualified';
    } else if (qualificationScore >= 40) {
      status = 'qualifying';
    }

    // Check if pro already exists by phone number
    const { data: existingLead, error: checkError } = await supabaseClient
      .from('pros')
      .select('id')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing lead:', checkError);
      throw checkError;
    }

    let result;
    if (existingLead) {
      // Update existing pro
      console.log('Updating existing pro:', existingLead.id);
      const { data, error } = await supabaseClient
        .from('pros')
        .update({
          first_name,
          last_name,
          full_name,
          email: finalEmail,
          company,
          brokerage,
          cities,
          states,
          transactions,
          address: leadData.address,
          // Contact Links
          linkedin_url: leadData.linkedin_url,
          facebook_url: leadData.facebook_url,
          instagram_url: leadData.instagram_url,
          twitter_url: leadData.twitter_url,
          youtube_url: leadData.youtube_url,
          website_url: leadData.website_url,
          // Volume Metrics
          total_volume: parseNumeric(leadData.total_volume),
          total_units: leadData.total_units,
          buyer_volume: parseNumeric(leadData.buyer_volume),
          buyer_financed: parseNumeric(leadData.buyer_financed),
          buyer_units: leadData.buyer_units,
          seller_volume: parseNumeric(leadData.seller_volume),
          seller_financed: parseNumeric(leadData.seller_financed),
          seller_units: leadData.seller_units,
          dual_volume: parseNumeric(leadData.dual_volume),
          dual_units: leadData.dual_units,
          // Percentage Metrics
          buyer_percentage: parsePercentage(leadData.Buyer_Percentage),
          seller_percentage: parsePercentage(leadData.Seller_Percentage),
          percent_financed: parsePercentage(leadData.percent_financed),
          seller_side_percentage: parsePercentage(leadData.seller_side_percentage),
          purchase_percentage: parsePercentage(leadData.purchase_percentage),
          conventional_percentage: parsePercentage(leadData.conventional_percentage),
          // Relationship Data
          top_lender: leadData.top_lender,
          top_lender_share: parsePercentage(leadData.top_lender_share),
          top_lender_volume: parseNumeric(leadData.top_lender_volume),
          top_originator: leadData.top_originator,
          top_originator_share: parsePercentage(leadData.top_originator_share),
          top_originator_volume: parseNumeric(leadData.top_originator_volume),
          // Calculated Metrics
          transactions_per_year: leadData.transactions_per_year,
          // Metadata
          date: leadData.date ? new Date(leadData.date).toISOString() : null,
          pipeline_stage: 'new',
          pipeline_type: 'staff',
          qualification_score: qualificationScore,
          status,
          notes: leadData.notes,
          source: leadData.source || 'webhook',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingLead.id)
        .select()
        .single();

      if (error) throw error;
      result = { action: 'updated', lead: data };
    } else {
      // Create new pro
      console.log('Creating new pro');
      const { data, error } = await supabaseClient
        .from('pros')
        .insert({
          first_name,
          last_name,
          full_name,
          email: finalEmail,
          phone: normalizedPhone,
          company,
          brokerage,
          cities,
          states,
          transactions,
          address: leadData.address,
          // Contact Links
          linkedin_url: leadData.linkedin_url,
          facebook_url: leadData.facebook_url,
          instagram_url: leadData.instagram_url,
          twitter_url: leadData.twitter_url,
          youtube_url: leadData.youtube_url,
          website_url: leadData.website_url,
          // Volume Metrics
          total_volume: parseNumeric(leadData.total_volume),
          total_units: leadData.total_units,
          buyer_volume: parseNumeric(leadData.buyer_volume),
          buyer_financed: parseNumeric(leadData.buyer_financed),
          buyer_units: leadData.buyer_units,
          seller_volume: parseNumeric(leadData.seller_volume),
          seller_financed: parseNumeric(leadData.seller_financed),
          seller_units: leadData.seller_units,
          dual_volume: parseNumeric(leadData.dual_volume),
          dual_units: leadData.dual_units,
          // Percentage Metrics
          buyer_percentage: parsePercentage(leadData.Buyer_Percentage),
          seller_percentage: parsePercentage(leadData.Seller_Percentage),
          percent_financed: parsePercentage(leadData.percent_financed),
          seller_side_percentage: parsePercentage(leadData.seller_side_percentage),
          purchase_percentage: parsePercentage(leadData.purchase_percentage),
          conventional_percentage: parsePercentage(leadData.conventional_percentage),
          // Relationship Data
          top_lender: leadData.top_lender,
          top_lender_share: parsePercentage(leadData.top_lender_share),
          top_lender_volume: parseNumeric(leadData.top_lender_volume),
          top_originator: leadData.top_originator,
          top_originator_share: parsePercentage(leadData.top_originator_share),
          top_originator_volume: parseNumeric(leadData.top_originator_volume),
          // Calculated Metrics
          transactions_per_year: leadData.transactions_per_year,
          // Metadata
          date: leadData.date ? new Date(leadData.date).toISOString() : null,
          pipeline_stage: 'new',
          pipeline_type: 'staff',
          qualification_score: qualificationScore,
          status,
          notes: leadData.notes,
          source: leadData.source || 'webhook',
        })
        .select()
        .single();

      if (error) throw error;
      result = { action: 'created', lead: data };
    }

    // Handle client assignment if specified
    let matchCreated = false;
    const clientEmail = leadData.client_email;
    const clientPhone = leadData.client_phone;
    const leadPrice = leadData.lead_price;
    
    if (clientEmail || clientPhone) {
      try {
        // Find client by email or phone
        let clientQuery = supabaseClient.from('clients').select('id, active');
        if (clientEmail) {
          clientQuery = clientQuery.eq('email', clientEmail);
        } else if (clientPhone) {
          clientQuery = clientQuery.eq('phone', normalizePhoneNumber(clientPhone));
        }
        
        const { data: client } = await clientQuery.maybeSingle();
        
        if (client && client.active !== false) {
          // Check if match already exists
          const { data: existingMatch } = await supabaseClient
            .from('matches')
            .select('id')
            .eq('pro_id', result.lead.id)
            .eq('client_id', client.id)
            .maybeSingle();
          
          if (!existingMatch) {
            // Create match
            const { error: matchError } = await supabaseClient
              .from('matches')
              .insert({
                pro_id: result.lead.id,
                client_id: client.id,
                status: 'pending',
                match_score: qualificationScore,
                lead_price: leadPrice || null
              });
            
            if (!matchError) {
              matchCreated = true;
              console.log('Match created with client:', client.id);
            }
          }
        }
      } catch (assignError) {
        console.error('Error assigning to client:', assignError);
      }
    }

    console.log(`Lead ${result.action} successfully:`, result.lead.id);

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
        match_created: matchCreated,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error processing agent lead:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

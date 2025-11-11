import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authenticated user (if any)
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    let clientId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && user) {
        userId = user.id;
        
        // Get client ID if user is a client
        const { data: clientData } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', userId)
          .single();
        
        if (clientData) {
          clientId = clientData.id;
        }
      }
    }

    // Get query parameters
    const url = new URL(req.url);
    const pricingTier = url.searchParams.get('pricing_tier');

    // Fetch all match_ready pros using service role (bypasses RLS)
    let query = supabase
      .from('pros')
      .select('id, pricing_tier, qualification_score, transactions, experience, states, cities, full_name, first_name, email, phone, brokerage, image_url')
      .eq('pipeline_stage', 'match_ready')
      .order('qualification_score', { ascending: false });

    if (pricingTier && pricingTier !== 'all') {
      query = query.eq('pricing_tier', pricingTier);
    }

    const { data: pros, error: prosError } = await query;

    if (prosError) {
      console.error('Error fetching pros:', prosError);
      throw prosError;
    }

    // If user is a client, get their unlocked agents
    let unlockedProIds: string[] = [];
    if (clientId) {
      const { data: unlocks } = await supabase
        .from('agent_unlocks')
        .select('pro_id')
        .eq('client_id', clientId);
      
      if (unlocks) {
        unlockedProIds = unlocks.map(u => u.pro_id);
      }
    }

    // Filter data based on unlock status
    const filteredPros = pros?.map(pro => {
      const isUnlocked = unlockedProIds.includes(pro.id);
      
      if (isUnlocked) {
        // Return full data for unlocked agents
        return {
          ...pro,
          isUnlocked: true
        };
      } else {
        // Return only non-PII data for locked agents
        return {
          id: pro.id,
          pricing_tier: pro.pricing_tier,
          qualification_score: pro.qualification_score,
          transactions: pro.transactions,
          experience: pro.experience,
          states: pro.states,
          cities: pro.cities,
          // PII fields are null for locked agents
          full_name: null,
          first_name: null,
          email: null,
          phone: null,
          brokerage: null,
          image_url: null,
          isUnlocked: false
        };
      }
    });

    return new Response(
      JSON.stringify({ data: filteredPros }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error in get-agents function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

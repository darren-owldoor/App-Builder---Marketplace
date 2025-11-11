import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { type, record_id } = await req.json();

    if (type === 'client_payment') {
      // Enrich client after payment
      const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('id', record_id)
        .single();

      if (client && !client.preferences?.pdl_enrichment) {
        const params: any = {};
        // Send ALL available fields to maximize match probability
        if (client.company_name) params.name = client.company_name;
        if (client.email) params.email = client.email;
        if (client.profile_url) params.profile = client.profile_url;
        
        // Build location from available data
        const locationParts = [];
        if (client.cities && client.cities.length > 0) locationParts.push(client.cities[0]);
        if (client.states && client.states.length > 0) locationParts.push(client.states[0]);
        if (locationParts.length > 0) params.location = locationParts.join(', ');

        console.log('Enriching client with params:', params);

        if (Object.keys(params).length > 0) {
          const { error: enrichError } = await supabase.functions.invoke('pdl-enrich', {
            body: { action: 'enrich', type: 'company', params, recordId: record_id }
          });
          // 404 from PDL is expected - it means no data available, not an actual error
          if (enrichError && enrichError.message && !enrichError.message.includes('404')) {
            console.error('Enrichment error:', enrichError);
          }
        }
      }
    } else if (type === 'lead_qualifying') {
      // Enrich pro when reaching qualifying stage
      const { data: lead } = await supabase
        .from('pros')
        .select('*')
        .eq('id', record_id)
        .single();

      if (lead && (!lead.notes || !lead.notes.includes('PDL Enrichment Data'))) {
        const params: any = {};
        // Send ALL available fields to maximize match probability
        if (lead.email) params.email = lead.email;
        if (lead.phone) params.phone = lead.phone;
        if (lead.first_name) params.first_name = lead.first_name;
        if (lead.last_name) params.last_name = lead.last_name;
        if (lead.company) params.company = lead.company;
        if (lead.match_to) params.job_title = lead.match_to;
        if (lead.profile_url) params.profile = lead.profile_url;
        
        // Build location from available data
        const locationParts = [];
        if (lead.cities && lead.cities.length > 0) locationParts.push(lead.cities[0]);
        if (lead.states && lead.states.length > 0) locationParts.push(lead.states[0]);
        if (locationParts.length > 0) params.location = locationParts.join(', ');

        console.log('Enriching lead with params:', params);

        if (Object.keys(params).length > 0) {
          const { error: enrichError } = await supabase.functions.invoke('pdl-enrich', {
            body: { action: 'enrich', type: 'person', params, recordId: record_id }
          });
          // 404 from PDL is expected - it means no data available, not an actual error
          if (enrichError && enrichError.message && !enrichError.message.includes('404')) {
            console.error('Enrichment error:', enrichError);
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Auto-enrich error:', error);
    return new Response(JSON.stringify({ error: 'Failed to trigger enrichment' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500
    });
  }
});

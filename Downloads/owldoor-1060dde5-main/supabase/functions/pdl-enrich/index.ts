import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PDL_API_KEY = Deno.env.get('PDL_API_KEY');
const PDL_BASE_URL = 'https://api.peopledatalabs.com/v5';

interface PersonSearchParams {
  first_name?: string;
  last_name?: string;
  company?: string;
  location?: string;
  job_title?: string;
  phone?: string;
  email?: string;
}

interface CompanySearchParams {
  name?: string;
  website?: string;
  location?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, type, params, recordId } = await req.json();
    
    console.log(`PDL Action: ${action}, Type: ${type}, Record ID: ${recordId}`);

    let endpoint = '';
    let requestBody: any = {};

    // Determine endpoint based on action and type
    if (action === 'search') {
      if (type === 'person') {
        endpoint = `${PDL_BASE_URL}/person/search`;
        requestBody = {
          query: buildPersonSearchQuery(params),
          size: params.limit || 10,
          pretty: true
        };
      } else if (type === 'company') {
        endpoint = `${PDL_BASE_URL}/company/search`;
        requestBody = {
          query: buildCompanySearchQuery(params),
          size: params.limit || 10,
          pretty: true
        };
      }
    } else if (action === 'enrich') {
      if (type === 'person') {
        endpoint = `${PDL_BASE_URL}/person/enrich`;
        requestBody = params;
      } else if (type === 'company') {
        endpoint = `${PDL_BASE_URL}/company/enrich`;
        requestBody = params;
      }
    }

    // Make request to PeopleDataLabs API
    const pdlResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': PDL_API_KEY || '',
      },
      body: JSON.stringify(requestBody),
    });

    if (!pdlResponse.ok) {
      const errorText = await pdlResponse.text();
      
      // 404 is expected when PDL has no data - treat as success with no results
      if (pdlResponse.status === 404) {
        console.log('PDL has no data for this record (404) - this is expected');
        return new Response(
          JSON.stringify({ status: 404, message: 'No data found', data: null }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      // For other errors, return actual error
      console.error('PDL API Error:', errorText);
      return new Response(
        JSON.stringify({ error: `PDL API error: ${errorText}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: pdlResponse.status }
      );
    }

    const pdlData = await pdlResponse.json();
    console.log('PDL Response received, status:', pdlData.status);

    // If recordId is provided and action is enrich, update the database
    if (recordId && action === 'enrich' && pdlData.status === 200) {
      const enrichedData = pdlData.data;
      
      if (type === 'person' && enrichedData) {
        // Update lead with enriched data
        const updateData: any = {
          updated_at: new Date().toISOString(),
        };

        // Map PDL data to lead fields
        if (enrichedData.job_title) updateData.match_to = enrichedData.job_title;
        if (enrichedData.job_company_name) updateData.company = enrichedData.job_company_name;
        if (enrichedData.location_name) {
          // Extract location components
          const locationParts = enrichedData.location_name.split(',');
          if (locationParts.length > 0) {
            updateData.cities = [locationParts[0].trim()];
          }
          if (locationParts.length > 1) {
            updateData.states = [locationParts[locationParts.length - 1].trim()];
          }
        }
        if (enrichedData.experience) {
          updateData.experience = enrichedData.experience.length;
        }
        if (enrichedData.skills) {
          updateData.skills = enrichedData.skills.slice(0, 10);
        }

        // Store full PDL data in notes as JSON for reference
        const existingLead = await supabase.from('pros').select('notes').eq('id', recordId).single();
        const existingNotes = existingLead.data?.notes || '';
        updateData.notes = `${existingNotes}\n\n--- PDL Enrichment Data (${new Date().toISOString()}) ---\n${JSON.stringify(enrichedData, null, 2)}`;

        const { error: updateError } = await supabase
          .from('pros')
          .update(updateData)
          .eq('id', recordId);

        if (updateError) {
          console.error('Error updating lead:', updateError);
        } else {
          console.log('Lead updated successfully with PDL data');
        }
      } else if (type === 'company' && enrichedData) {
        // Update client with enriched data
        const updateData: any = {
          updated_at: new Date().toISOString(),
        };

        if (enrichedData.name) updateData.company_name = enrichedData.name;
        if (enrichedData.location) {
          const location = enrichedData.location;
          if (location.locality) updateData.cities = [location.locality];
          if (location.region) updateData.states = [location.region];
        }
        if (enrichedData.employee_count) {
          // Store in preferences or custom field
          updateData.preferences = {
            ...(updateData.preferences || {}),
            employee_count: enrichedData.employee_count
          };
        }

        // Store full PDL data in preferences
        updateData.preferences = {
          ...(updateData.preferences || {}),
          pdl_enrichment: enrichedData,
          pdl_enrichment_date: new Date().toISOString()
        };

        const { error: updateError } = await supabase
          .from('clients')
          .update(updateData)
          .eq('id', recordId);

        if (updateError) {
          console.error('Error updating client:', updateError);
        } else {
          console.log('Client updated successfully with PDL data');
        }
      }
    }

    return new Response(
      JSON.stringify(pdlData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in pdl-enrich function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function buildPersonSearchQuery(params: PersonSearchParams): any {
  const must: any[] = [];

  if (params.email) {
    must.push({ term: { emails: params.email } });
  }
  if (params.phone) {
    must.push({ term: { phone_numbers: params.phone } });
  }
  if (params.first_name) {
    must.push({ term: { first_name: params.first_name } });
  }
  if (params.last_name) {
    must.push({ term: { last_name: params.last_name } });
  }
  if (params.company) {
    must.push({ term: { 'job_company_name': params.company } });
  }
  if (params.job_title) {
    must.push({ term: { 'job_title': params.job_title } });
  }
  if (params.location) {
    must.push({ term: { 'location_name': params.location } });
  }

  return { bool: { must } };
}

function buildCompanySearchQuery(params: CompanySearchParams): any {
  const must: any[] = [];

  if (params.name) {
    must.push({ term: { name: params.name } });
  }
  if (params.website) {
    must.push({ term: { website: params.website } });
  }
  if (params.location) {
    must.push({ term: { 'location.name': params.location } });
  }

  return { bool: { must } };
}

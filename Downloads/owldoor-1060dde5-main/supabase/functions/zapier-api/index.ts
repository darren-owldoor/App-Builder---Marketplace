import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

// Normalize phone number to consistent format: +1XXXXXXXXXX
const normalizePhoneNumber = (phone: string): string => {
  if (!phone) return '';
  
  // Remove all non-numeric characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Remove + if it's not at the start
  if (cleaned.indexOf('+') > 0) {
    cleaned = cleaned.replace(/\+/g, '');
  }
  
  // Handle different formats
  if (cleaned.startsWith('+1') && cleaned.length === 12) {
    // Already in correct format: +1XXXXXXXXXX
    return cleaned;
  } else if (cleaned.startsWith('1') && cleaned.length === 11) {
    // Format: 1XXXXXXXXXX -> +1XXXXXXXXXX
    return '+' + cleaned;
  } else if (cleaned.startsWith('+') && cleaned.length === 12) {
    // Format: +1XXXXXXXXXX (already correct)
    return cleaned;
  } else if (cleaned.length === 10) {
    // Format: XXXXXXXXXX -> +1XXXXXXXXXX
    return '+1' + cleaned;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // Format: 1XXXXXXXXXX -> +1XXXXXXXXXX
    return '+' + cleaned;
  }
  
  // If none of the above, return cleaned version with +1 prefix
  return '+1' + cleaned.replace(/^\+?1?/, '');
};

interface ApiRequest {
  action: 'list_leads' | 'create_lead' | 'list_clients' | 'create_client' | 'find_lead' | 'find_client';
  data?: any;
  filters?: any;
  page?: number;
  limit?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract API key from Authorization header only (more secure than query params)
    const apiKey = req.headers.get('x-api-key') || req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      console.error('No API key provided');
      return new Response(
        JSON.stringify({ error: 'API key is required in x-api-key or Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash the provided API key for comparison
    console.log('Validating API key');
    const apiKeyHash = Array.from(
      new Uint8Array(
        await crypto.subtle.digest('SHA-256', new TextEncoder().encode(apiKey))
      )
    ).map(b => b.toString(16).padStart(2, '0')).join('');
    
    const { data: keyData, error: keyError } = await supabase
      .from('zapier_api_keys')
      .select('user_id, id')
      .eq('api_key_hash', apiKeyHash)
      .eq('active', true)
      .single();

    if (keyError || !keyData) {
      console.error('Invalid API key:', keyError);
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update last_used_at
    await supabase
      .from('zapier_api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyData.id);

    const userId = keyData.user_id;
    console.log('API key validated for user:', userId);

    // Parse request body - handle empty body
    let requestBody: ApiRequest;
    try {
      const text = await req.text();
      if (!text || text.trim() === '') {
        console.error('Empty request body received');
        return new Response(
          JSON.stringify({ 
            error: 'Request body is required. Please send a JSON body with an "action" field.',
            success: false 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      requestBody = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body. Please send valid JSON with an "action" field.',
          success: false 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, data, filters, page = 1, limit = 100 } = requestBody;

    // Validate required action field
    if (!action) {
      console.error('Missing action field in request body:', requestBody);
      return new Response(
        JSON.stringify({ 
          error: 'Missing required field: action. Valid actions are: list_leads, create_lead, find_lead, list_clients, create_client, find_client',
          success: false 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Helper function to convert string to array
    const toArray = (value: any): any => {
      if (!value) return value;
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') {
        return value.split(',').map((item: string) => item.trim()).filter(Boolean);
      }
      return value;
    };

    let result;
    let responseData;

    switch (action) {
      case 'list_leads':
        console.log('Listing leads for user:', userId, `(page ${page}, limit ${limit})`);
        
        const offset = (page - 1) * limit;
        
        let leadsQuery = supabase
          .from('pros')
          .select('*', { count: 'exact' })
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (filters) {
          // Map singular to plural field names
          const fieldMap: { [key: string]: string } = {
            'city': 'cities',
            'state': 'states',
            'county': 'counties',
            'zip_code': 'zip_codes',
            'tag': 'tags',
            'want': 'wants',
            'skill': 'skills'
          };
          
          Object.keys(filters).forEach(key => {
            const mappedKey = fieldMap[key] || key;
            const value = filters[key];
            
            // Handle array columns with contains
            if (['cities', 'states', 'counties', 'zip_codes', 'tags', 'wants', 'skills'].includes(mappedKey)) {
              leadsQuery = leadsQuery.contains(mappedKey, [value]);
            } else {
              leadsQuery = leadsQuery.eq(mappedKey, value);
            }
          });
        }

        result = await leadsQuery.range(offset, offset + limit - 1);
        
        if (result.error) throw result.error;
        
        responseData = {
          data: result.data,
          pagination: {
            page,
            limit,
            total: result.count || 0,
            total_pages: Math.ceil((result.count || 0) / limit),
            has_more: offset + limit < (result.count || 0),
          }
        };
        break;

      case 'create_lead':
        console.log('Creating lead for user:', userId);
        if (!data) {
          throw new Error('Lead data is required');
        }

        // Parse comma-separated fields into arrays
        const parsedLeadData: any = { ...data };
        
        // Normalize field names (singular to plural) and convert to arrays
        if (data.city && !data.cities) parsedLeadData.cities = toArray(data.city);
        if (data.state && !data.states) parsedLeadData.states = toArray(data.state);
        if (data.county && !data.counties) parsedLeadData.counties = toArray(data.county);
        if (data.zip_code && !data.zip_codes) parsedLeadData.zip_codes = toArray(data.zip_code);
        if (data.tag && !data.tags) parsedLeadData.tags = toArray(data.tag);
        if (data.want && !data.wants) parsedLeadData.wants = toArray(data.want);
        if (data.skill && !data.skills) parsedLeadData.skills = toArray(data.skill);
        
        // Parse plural field arrays if they exist as strings
        if (parsedLeadData.cities) parsedLeadData.cities = toArray(parsedLeadData.cities);
        if (parsedLeadData.states) parsedLeadData.states = toArray(parsedLeadData.states);
        if (parsedLeadData.counties) parsedLeadData.counties = toArray(parsedLeadData.counties);
        if (parsedLeadData.zip_codes) parsedLeadData.zip_codes = toArray(parsedLeadData.zip_codes);
        if (parsedLeadData.tags) parsedLeadData.tags = toArray(parsedLeadData.tags);
        if (parsedLeadData.wants) parsedLeadData.wants = toArray(parsedLeadData.wants);
        if (parsedLeadData.skills) parsedLeadData.skills = toArray(parsedLeadData.skills);
        
        // Normalize other field names
        if (data.profile && !data.profile_url) parsedLeadData.profile_url = data.profile;
        if (data.image && !data.image_url) parsedLeadData.image_url = data.image;
        if (data.Phone && !data.phone) parsedLeadData.phone = data.Phone;
        if (data.Motivation && !data.motivation) parsedLeadData.motivation = data.Motivation;
        if (data.company_name && !data.company) parsedLeadData.company = data.company_name;
        if (data.transactions && !data.transactions_per_year) parsedLeadData.transactions_per_year = data.transactions;
        if (data.yearly_sales && !data.transactions) parsedLeadData.transactions = data.yearly_sales;
        if (data.user_type && !data.pro_type) parsedLeadData.pro_type = data.user_type;
        
        // Remove singular field names after normalization
        delete parsedLeadData.city;
        delete parsedLeadData.state;
        delete parsedLeadData.county;
        delete parsedLeadData.zip_code;
        delete parsedLeadData.tag;
        delete parsedLeadData.want;
        delete parsedLeadData.skill;
        
        // Normalize lead_type values (case-insensitive)
        if (data.lead_type) {
          const leadTypeString = String(data.lead_type).toLowerCase();
          const leadTypeMap: { [key: string]: string } = {
            'real estate agent': 'real_estate_agent',
            'mortgage lender': 'mortgage_officer',
            'mortgage officer': 'mortgage_officer',
            'agent': 'real_estate_agent',
            'broker': 'mortgage_officer',
            'realtor': 'real_estate_agent',
            'loan officer': 'mortgage_officer'
          };
          parsedLeadData.lead_type = leadTypeMap[leadTypeString] || 'real_estate_agent'; // default to real_estate_agent if unknown
        }

        // Parse numeric fields
        if (parsedLeadData.transactions) parsedLeadData.transactions = parseInt(parsedLeadData.transactions);
        if (parsedLeadData.transactions_per_year) parsedLeadData.transactions_per_year = parseInt(parsedLeadData.transactions_per_year);
        if (parsedLeadData.yearly_sales) parsedLeadData.yearly_sales = parseInt(parsedLeadData.yearly_sales);
        if (parsedLeadData.experience) parsedLeadData.experience = parseInt(parsedLeadData.experience);
        if (parsedLeadData.total_sales) parsedLeadData.total_sales = parseFloat(parsedLeadData.total_sales);
        if (parsedLeadData.motivation) parsedLeadData.motivation = parseInt(parsedLeadData.motivation);
        if (parsedLeadData.qualification_score) parsedLeadData.qualification_score = parseInt(parsedLeadData.qualification_score);
        if (parsedLeadData.radius) parsedLeadData.radius = parseInt(parsedLeadData.radius);
        if (parsedLeadData.avg_sale) parsedLeadData.avg_sale = parseFloat(parsedLeadData.avg_sale);
        if (parsedLeadData.price_per_lead) parsedLeadData.price_per_lead = parseFloat(parsedLeadData.price_per_lead);
        if (parsedLeadData.buyer_units) parsedLeadData.buyer_units = parseInt(parsedLeadData.buyer_units);
        if (parsedLeadData.buyer_volume) parsedLeadData.buyer_volume = parseFloat(parsedLeadData.buyer_volume);
        
        // Parse boolean fields
        if (parsedLeadData.interested_in_opportunities !== undefined) {
          const val = String(parsedLeadData.interested_in_opportunities).toLowerCase();
          parsedLeadData.interested_in_opportunities = val === 'true' || val === '1' || val === 'yes';
        }

        const leadData: any = {
          ...parsedLeadData,
          phone: normalizePhoneNumber(parsedLeadData.phone),
          user_id: userId,
        };

        // Auto-generate full_name from first_name and last_name if provided
        if (data.first_name || data.last_name) {
          leadData.full_name = `${data.first_name || ''} ${data.last_name || ''}`.trim();
        }
        // Or split full_name into first_name and last_name if only full_name provided
        else if (data.full_name && !data.first_name && !data.last_name) {
          const nameParts = data.full_name.split(' ');
          leadData.first_name = nameParts[0] || '';
          leadData.last_name = nameParts.slice(1).join(' ') || '';
        }

        // Filter to only valid lead table columns
        const validLeadColumns = [
          'full_name', 'first_name', 'last_name', 'email', 'phone', 'lead_type',
          'status', 'pipeline_stage', 'pipeline_type', 'qualification_score',
          'source', 'notes', 'image_url', 'profile_url', 'company', 'brokerage',
          'license_type', 'state_license', 'license', 'experience', 'transactions',
          'total_sales', 'motivation', 'radius', 'cities', 'states', 'counties',
          'zip_codes', 'wants', 'skills', 'tags', 'team', 'user_id',
          'company_name', 'transactions_per_year', 'yearly_sales', 'avg_sale',
          'price_per_lead', 'interested_in_opportunities', 'needs', 'pro_type',
          'nmls_id', 'buyer_units', 'buyer_volume', 'primary_neighborhoods'
        ];
        
        const filteredLeadData = Object.keys(leadData)
          .filter(key => validLeadColumns.includes(key))
          .reduce((obj: any, key) => {
            obj[key] = leadData[key];
            return obj;
          }, {});

        result = await supabase
          .from('pros')
          .insert([filteredLeadData])
          .select()
          .single();

        if (result.error) throw result.error;
        responseData = result.data;
        break;

      case 'find_lead':
        console.log('Finding lead for user:', userId);
        if (!filters || !filters.email) {
          throw new Error('Email filter is required');
        }

        result = await supabase
          .from('pros')
          .select('*')
          .eq('user_id', userId)
          .eq('email', filters.email)
          .maybeSingle();

        if (result.error) throw result.error;
        responseData = result.data;
        break;

      case 'list_clients':
        console.log('Listing clients for user:', userId, `(page ${page}, limit ${limit})`);
        
        const clientOffset = (page - 1) * limit;
        
        let clientsQuery = supabase
          .from('clients')
          .select('*', { count: 'exact' })
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (filters) {
          // Map singular to plural field names
          const fieldMap: { [key: string]: string } = {
            'city': 'cities',
            'state': 'states',
            'zip_code': 'zip_codes',
            'tag': 'tags'
          };
          
          Object.keys(filters).forEach(key => {
            const mappedKey = fieldMap[key] || key;
            const value = filters[key];
            
            // Handle array columns with contains
            if (['cities', 'states', 'zip_codes', 'tags'].includes(mappedKey)) {
              clientsQuery = clientsQuery.contains(mappedKey, [value]);
            } else {
              clientsQuery = clientsQuery.eq(mappedKey, value);
            }
          });
        }

        result = await clientsQuery.range(clientOffset, clientOffset + limit - 1);
        
        if (result.error) throw result.error;
        
        responseData = {
          data: result.data,
          pagination: {
            page,
            limit,
            total: result.count || 0,
            total_pages: Math.ceil((result.count || 0) / limit),
            has_more: clientOffset + limit < (result.count || 0),
          }
        };
        break;

      case 'create_client':
        console.log('Creating client for user:', userId);
        if (!data) {
          throw new Error('Client data is required');
        }

        // Parse comma-separated fields into arrays
        const parsedClientData: any = { ...data };
        
        // Convert all array fields
        if (parsedClientData.zip_codes) parsedClientData.zip_codes = toArray(parsedClientData.zip_codes);
        if (parsedClientData.tags) parsedClientData.tags = toArray(parsedClientData.tags);
        if (parsedClientData.states) parsedClientData.states = toArray(parsedClientData.states);
        if (parsedClientData.cities) parsedClientData.cities = toArray(parsedClientData.cities);
        if (parsedClientData.designations) parsedClientData.designations = toArray(parsedClientData.designations);
        if (parsedClientData.languages) parsedClientData.languages = toArray(parsedClientData.languages);
        if (parsedClientData.skills) parsedClientData.skills = toArray(parsedClientData.skills);

        const clientData: any = {
          ...parsedClientData,
          user_id: userId,
        };

        // Auto-generate contact_name from first_name and last_name if provided
        if (data.first_name || data.last_name) {
          clientData.contact_name = `${data.first_name || ''} ${data.last_name || ''}`.trim();
        }
        // Or split contact_name into first_name and last_name if only contact_name provided
        else if (data.contact_name && !data.first_name && !data.last_name) {
          const nameParts = data.contact_name.split(' ');
          clientData.first_name = nameParts[0] || '';
          clientData.last_name = nameParts.slice(1).join(' ') || '';
        }

        result = await supabase
          .from('clients')
          .insert([clientData])
          .select()
          .single();

        if (result.error) throw result.error;
        responseData = result.data;
        break;

      case 'find_client':
        console.log('Finding client for user:', userId);
        if (!filters || !filters.email) {
          throw new Error('Email filter is required');
        }

        result = await supabase
          .from('clients')
          .select('*')
          .eq('agent_id', userId)
          .eq('email', filters.email)
          .maybeSingle();

        if (result.error) throw result.error;
        responseData = result.data;
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    console.log('Action completed successfully:', action);
    return new Response(
      JSON.stringify({ success: true, data: responseData }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in zapier-api function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
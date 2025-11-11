import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { Logger } from '../_shared/logger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schemas
// Helper function to parse arrays from strings
const parseArrayField = (value: any): string[] | null => {
  if (!value) return null;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value.split(',').map(v => v.trim()).filter(v => v.length > 0);
  }
  return null;
};

// Decode Wants multi-select values to standardized format
const decodeWantsField = (value: any): string[] | null => {
  const parsedArray = parseArrayField(value);
  if (!parsedArray) return null;
  
  const wantsMapping: Record<string, string> = {
    'free leads': 'Free Leads',
    'freeleads': 'Free Leads',
    'high splits': 'High Splits',
    'highsplits': 'High Splits',
    'free crm & tech': 'Free CRM & Tech',
    'free crm and tech': 'Free CRM & Tech',
    'freecrm&tech': 'Free CRM & Tech',
    'great atmosphere': 'Great Atmosphere',
    'greatatmosphere': 'Great Atmosphere',
    'coaching': 'Coaching',
    "isa's (dialers)": "ISA's (dialers)",
    'isas': "ISA's (dialers)",
    'dialers': "ISA's (dialers)",
    'referrals': 'Referrals',
    'none of the above': 'none of the above',
    'noneoftheabove': 'none of the above',
    'all of the above': 'all of the above',
    'alloftheabove': 'all of the above',
  };
  
  return parsedArray.map(item => {
    const normalized = item.toLowerCase().trim();
    return wantsMapping[normalized] || item; // Return original if no mapping found
  });
};

const leadSchema = z.object({
  full_name: z.string().max(200).optional(),
  name: z.string().max(200).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(20).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(2).optional(),
  zip_code: z.string().max(10).optional(),
  zipCode: z.string().max(10).optional(),
  status: z.string().max(50).optional(),
  pipeline_stage: z.string().max(50).optional(),
  // Intelligent matching fields
  qualification_score: z.number().min(0).max(100).optional(),
  client_id: z.string().uuid().optional(),
  client_email: z.string().email().optional(),
  client_phone: z.string().optional(),
  price_per_lead: z.number().optional(),
  // Field definition dynamic fields
  field_data: z.record(z.any()).optional(),
  // Legacy smart qualification fields
  qualification_data: z.record(z.any()).optional(),
});

const clientSchema = z.object({
  email: z.string().email().max(255),
  contact_name: z.string().max(200).optional(),
  name: z.string().max(200).optional(),
  company_name: z.string().max(200).optional(),
  phone: z.string().max(20).optional(),
});

const userSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().max(200).optional(),
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
});

const importDataSchema = z.object({
  entity_type: z.enum(['users', 'leads', 'agents', 'staff', 'clients']),
  data: z.array(z.record(z.any())).min(1).max(1000),
  user_id: z.string().uuid().optional(),
});

interface ImportData {
  entity_type: 'users' | 'leads' | 'agents' | 'staff' | 'clients';
  data: any[];
  user_id?: string;
}

Deno.serve(async (req) => {
  const startTime = Date.now();
  const logger = new Logger({ endpoint: 'zapier-import' });
  
  logger.request(req.method, new URL(req.url).pathname);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    
    logger.info('Processing import request', { ipAddress });
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Rate limiting: 100 imports per minute per IP
    const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
      p_identifier: ipAddress,
      p_endpoint: 'zapier-import',
      p_max_requests: 100,
      p_window_minutes: 1
    });

    if (!rateLimitOk) {
      logger.warn('Rate limit exceeded', { ipAddress });
      const response = new Response(
        JSON.stringify({ error: 'Too many import requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      logger.response(429, Date.now() - startTime);
      return response;
    }

    // Extract and validate API key
    const apiKey = req.headers.get('x-api-key') || req.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      console.error('No API key provided');
      return new Response(
        JSON.stringify({ error: 'API key is required in x-api-key or Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash the API key with SHA-256
    const apiKeyHash = Array.from(
      new Uint8Array(
        await crypto.subtle.digest('SHA-256', new TextEncoder().encode(apiKey))
      )
    ).map(b => b.toString(16).padStart(2, '0')).join('');

    // Validate API key using hash
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

    const authenticatedUserId = keyData.user_id;

    const rawData = await req.json();

    // Validate request structure
    const validationResult = importDataSchema.safeParse(rawData);
    if (!validationResult.success) {
      logger.error('Validation failed', validationResult.error);
      const response = new Response(
        JSON.stringify({ 
          error: 'Invalid request data',
          details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
      logger.response(400, Date.now() - startTime);
      return response;
    }

    const { entity_type, data, user_id }: ImportData = validationResult.data;

    // Validate individual records based on entity type
    if (entity_type === 'leads' || entity_type === 'agents') {
      for (let i = 0; i < data.length; i++) {
        const result = leadSchema.safeParse(data[i]);
        if (!result.success) {
          return new Response(
            JSON.stringify({ 
              error: `Invalid lead/agent data at index ${i}`,
              details: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    } else if (entity_type === 'clients') {
      for (let i = 0; i < data.length; i++) {
        const result = clientSchema.safeParse(data[i]);
        if (!result.success) {
          logger.error(`Invalid client data at index ${i}`, result.error);
          const response = new Response(
            JSON.stringify({ 
              error: `Invalid client data at index ${i}`,
              details: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
          logger.response(400, Date.now() - startTime);
          return response;
        }
      }
    } else if (entity_type === 'staff' || entity_type === 'users') {
      for (let i = 0; i < data.length; i++) {
        const result = userSchema.safeParse(data[i]);
        if (!result.success) {
          logger.error(`Invalid user data at index ${i}`, result.error);
          const response = new Response(
            JSON.stringify({ 
              error: `Invalid user data at index ${i}`,
              details: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
          logger.response(400, Date.now() - startTime);
          return response;
        }
      }
    }

    logger.info('All records validated successfully');

    let insertResult;
    let tableName = '';

    switch (entity_type) {
      case 'leads':
      case 'agents':
        tableName = 'pros';
        // Process leads/agents data into pros table with intelligent matching support
        const processedLeads = await Promise.all(data.map(async (lead) => {
          // Log ALL incoming fields FIRST
          const incomingFieldNames = Object.keys(lead);
          logger.info('🔍 RAW INCOMING FIELDS FROM ZAPIER', { 
            totalFields: incomingFieldNames.length,
            fieldNames: incomingFieldNames,
            sampleData: lead 
          });

          // Helper to normalize field names from Zapier (strip "Data " prefix, convert to lowercase with underscores)
          const normalizeFieldName = (fieldName: string): string => {
            return fieldName
              .replace(/^Data\s+/i, '') // Remove "Data " prefix
              .trim()
              .toLowerCase()
              .replace(/\s+/g, '_'); // Replace spaces with underscores
          };

          // Normalize all incoming field keys
          const normalizedLead: any = {};
          for (const [key, value] of Object.entries(lead)) {
            const normalizedKey = normalizeFieldName(key);
            normalizedLead[normalizedKey] = value;
            logger.info(`Field mapping: "${key}" → "${normalizedKey}"`, { value });
          }

          // Handle client lookup by email or phone
          let resolvedClientId = normalizedLead.client_id;
          if (!resolvedClientId && (normalizedLead.client_email || normalizedLead.client_phone)) {
            logger.info('Looking up client', { 
              client_email: normalizedLead.client_email, 
              client_phone: normalizedLead.client_phone 
            });
            
            let clientQuery = supabase.from('clients').select('id');
            if (normalizedLead.client_email) {
              clientQuery = clientQuery.eq('email', normalizedLead.client_email);
            } else if (normalizedLead.client_phone) {
              clientQuery = clientQuery.eq('phone', normalizedLead.client_phone);
            }
            
            const { data: clientData } = await clientQuery.single();
            if (clientData) {
              resolvedClientId = clientData.id;
              logger.info('Found client', { client_id: resolvedClientId });
            } else {
              logger.warn('Client not found', { 
                client_email: normalizedLead.client_email, 
                client_phone: normalizedLead.client_phone 
              });
            }
          }

          // Map common field name variations to pros table columns
          const fieldMapping: Record<string, string> = {
            // Experience & Licensing
            'years_licensed': 'experience',
            'years_experience': 'experience',
            'how_long_licensed': 'experience',
            
            // Transactions
            'transactions': 'transactions_per_year',
            'homes_sold': 'transactions_per_year',
            'annual_transactions': 'transactions_per_year',
            'transactions_12mo': 'transactions_12mo',
            
            // Contact
            'phone_2': 'phone2',
            'email_2': 'email2',
            
            // URLs & Images
            'photo_url': 'image_url',
            
            // Price & Volume
            'lead_price': 'lead_price',
            'price_per_lead': 'lead_price',
            'total_volume_12mo': 'total_volume_12mo',
            'average_sale_price': 'avg_sale_price',
            'avg_sale': 'avg_sale_price',
            
            // Location
            'service_radius_miles': 'radius',
            'full_address': 'full_address',
            
            // License
            'state_licenses': 'license_states',
            
            // Misc mappings
            'biggest_challenge': 'notes',
            'main_goal': 'wants',
            'timeline': 'notes',
            'current_split': 'notes',
            'brokerage_values': 'wants',
            'contact_preference': 'preferred_contact_method',
          };

          // Array fields that should be parsed
          const arrayFields = ['tags', 'zip_codes', 'cities', 'states', 'counties', 'skills', 'languages', 'designations', 'wants'];

          const baseData: any = {
            full_name: normalizedLead.full_name || normalizedLead.name || '',
            email: normalizedLead.email || `${Date.now()}@placeholder.com`,
            phone: normalizedLead.phone || normalizedLead.phone_2 || `+1${Date.now().toString().slice(-10)}`,
            cities: parseArrayField(normalizedLead.city || normalizedLead.cities),
            states: parseArrayField(normalizedLead.state || normalizedLead.states),
            zip_codes: parseArrayField(normalizedLead.zip_code || normalizedLead.zipcode || normalizedLead.zip_codes),
            tags: parseArrayField(normalizedLead.tags),
            status: normalizedLead.status || normalizedLead.original_status || 'new',
            pipeline_stage: normalizedLead.pipeline_stage || 'new',
            pipeline_type: 'staff',
            pro_type: normalizedLead.pro_type || normalizedLead.user_type || 'real_estate_agent',
            source: 'zapier',
            company: normalizedLead.company || normalizedLead.brokerage || normalizedLead.lender_name || null,
            brokerage: normalizedLead.brokerage || normalizedLead.company || normalizedLead.lender_name || null,
            wants: decodeWantsField(normalizedLead.wants),
          };

          // Track unmapped fields to store in additional_data
          const unmappedFields: Record<string, any> = {};

          // Map field_data fields to pros columns
          if (normalizedLead.field_data) {
            logger.info('Processing field_data', { field_data: normalizedLead.field_data });
            
            for (const [key, value] of Object.entries(normalizedLead.field_data)) {
              const normalizedKey = normalizeFieldName(key);
              const mappedKey = fieldMapping[normalizedKey] || normalizedKey;
              
              // Handle array fields
              if (mappedKey === 'wants') {
                baseData[mappedKey] = decodeWantsField(value);
              } else if (arrayFields.includes(mappedKey)) {
                baseData[mappedKey] = parseArrayField(value);
              } else {
                baseData[mappedKey] = value;
              }
            }
          }

          // Known pros table columns (to determine what goes in baseData vs unmappedFields)
          const prosColumns = [
            // Basic Info
            'full_name', 'first_name', 'last_name', 'email', 'email2', 'phone', 'phone2',
            
            // Location
            'cities', 'states', 'zip_codes', 'counties', 'address', 'full_address',
            'primary_neighborhoods', 'farm_areas', 'coverage_areas', 'radius',
            
            // Professional
            'pro_type', 'brokerage', 'company', 'license_number', 'license_type', 'license_states',
            'nmls_id', 'nmls_verified', 'nmls_verified_at', 'lender_name', 'lender_company_nmls',
            
            // Experience & Stats
            'experience', 'transactions', 'transactions_per_year', 'transactions_12mo',
            'total_sales', 'total_volume_12mo', 'avg_sale_price', 'average_sale_price', 'average_deal',
            
            // Volume Metrics
            'buyer_volume', 'buyer_units', 'buyer_financed', 'buyer_percentage',
            'seller_volume', 'seller_units', 'seller_financed', 'seller_percentage',
            'dual_volume', 'dual_units', 'total_volume', 'total_units',
            
            // Percentages
            'percent_financed', 'purchase_percentage', 'conventional_percentage', 
            'seller_side_percentage', 'refinance_percentage', 'on_time_close_rate', 'response_rate',
            
            // Relationships
            'top_lender', 'top_lender_share', 'top_lender_volume',
            'top_originator', 'top_originator_share', 'top_originator_volume',
            
            // Loan Officer Specific
            'loan_types_specialized', 'loan_purposes', 'client_types_served',
            'avg_close_time_days', 'monthly_loan_volume', 'annual_loan_volume',
            'avg_loan_size', 'loans_closed_12mo', 'provides_leads_to_agents',
            'co_marketing_available', 'partnership_fee_structure', 'accepts_agent_partnerships',
            'max_loans_per_month', 'accepting_new_partners',
            
            // Property & Market
            'property_types', 'low_price_point', 'high_price_point', 'price_range',
            'price_range_min', 'price_range_max', 'dom', 'list_to_sell_ratio',
            'price_reductions', 'off_market_deals', 'luxury_volume', 'commercial_volume',
            'rental_volume', 'last_sale_date',
            
            // Profile & Media
            'image_url', 'bio', 'specialization', 'specializations', 'designations',
            'certifications', 'awards', 'languages', 'skills', 'team_size',
            'website_url', 'linkedin_url', 'facebook_url', 'twitter_url', 'instagram_url',
            'tiktok_url', 'youtube_url', 'homes_com_url', 'realtor_com_url', 'profile_url',
            
            // Status & Engagement
            'status', 'pipeline_stage', 'pipeline_type', 'original_status', 'source',
            'qualification_score', 'motivation', 'engagement_score', 'profile_completeness',
            'profile_views', 'times_contacted', 'contact_attempts', 'last_viewed_at',
            
            // Flags & Booleans
            'has_photo', 'has_bio', 'is_claimed', 'open_to_company_offers',
            'interested_in_opportunities', 'matching_completed', 'market_coverage_completed',
            'profile_completed', 'onboarding_completed', 'nmls_verified',
            
            // Lead & Client Info
            'client_email', 'client_phone', 'lead_price', 'lead_source',
            
            // Timestamps
            'date', 'date_scraped', 'claimed_at', 'became_lead_at', 'last_form_submission_at',
            'last_contacted_at', 'last_responded_at', 'last_viewed_at',
            
            // Contact & UTM
            'best_time_to_contact', 'preferred_contact_method', 'form_submission_count',
            'utm_source', 'utm_campaign', 'utm_medium', 'ip_address', 'signup_ip',
            'user_agent', 'referrer_url',
            
            // Other
            'tags', 'notes', 'wants', 'match_to'
          ];

          // Also check for fields directly on normalized lead object (not in field_data)
          for (const [key, value] of Object.entries(normalizedLead)) {
            if (['field_data', 'qualification_score', 'client_id', 'client_email', 'client_phone', 'price_per_lead', 'lead_price', 'full_name', 'name', 'email', 'phone', 'phone_2', 'city', 'cities', 'state', 'states', 'zip_code', 'zipcode', 'zip_codes', 'status', 'original_status', 'pipeline_stage', 'tags', 'wants', 'pro_type', 'user_type', 'brokerage', 'company', 'lender_name'].includes(key)) {
              continue; // Skip already processed fields
            }
            
            const mappedKey = fieldMapping[key] || key;
            
            // Check if this maps to a known pros column
            if (prosColumns.includes(mappedKey) && baseData[mappedKey] === undefined) {
              // Handle array fields
              if (mappedKey === 'wants') {
                baseData[mappedKey] = decodeWantsField(value);
              } else if (arrayFields.includes(mappedKey)) {
                baseData[mappedKey] = parseArrayField(value);
              } else {
                baseData[mappedKey] = value;
              }
            } else if (!prosColumns.includes(mappedKey)) {
              // Store unmapped fields separately
              unmappedFields[key] = value;
              logger.info('Storing unmapped field', { field: key, mappedKey });
            }
          }

          // Store all unmapped fields in additional_data JSONB column
          if (Object.keys(unmappedFields).length > 0) {
            baseData.additional_data = unmappedFields;
            logger.info('⚠️ UNMAPPED FIELDS stored in additional_data', { 
              count: Object.keys(unmappedFields).length,
              unmappedFieldNames: Object.keys(unmappedFields),
              unmappedData: unmappedFields
            });
          }
          
          // Log what's actually going into the database
          logger.info('✅ FINAL DATA for database', {
            mappedFields: Object.keys(baseData).filter(k => k !== 'additional_data'),
            hasAdditionalData: !!baseData.additional_data,
            additionalDataFieldCount: baseData.additional_data ? Object.keys(baseData.additional_data).length : 0
          });

          // Calculate qualification score if not provided
          let qualScore = normalizedLead.qualification_score;
          if (qualScore === undefined && (baseData.experience || baseData.transactions_per_year)) {
            const exp = parseInt(baseData.experience) || 0;
            const trans = parseInt(baseData.transactions_per_year) || 0;
            
            // Basic scoring: 0-100 scale
            const expScore = Math.min(exp * 5, 30); // Max 30 points for experience (6+ years)
            const transScore = Math.min(trans * 2, 40); // Max 40 points for transactions (20+ deals)
            const motivationScore = normalizedLead.timeline === 'Within 30 days' ? 30 : 
                                   normalizedLead.timeline === '1-3 months' ? 20 : 10;
            
            qualScore = Math.min(expScore + transScore + motivationScore, 100);
            logger.info('Calculated qualification score', { 
              experience: exp, 
              transactions: trans, 
              score: qualScore 
            });
          }

          baseData.qualification_score = qualScore || 0;

          // Auto-qualify leads with score >= 50
          if (baseData.qualification_score >= 50 && baseData.pipeline_stage === 'new') {
            baseData.pipeline_stage = 'match_ready';
            logger.info('Auto-qualifying lead', { 
              score: baseData.qualification_score,
              name: baseData.full_name 
            });
          }

          logger.info('Final processed lead data', { 
            baseData,
            qualification_score: baseData.qualification_score,
            pipeline_stage: baseData.pipeline_stage,
            resolved_client_id: resolvedClientId
          });

          // Store resolved client_id for match creation
          return { ...baseData, _resolved_client_id: resolvedClientId };
        }));
        
        // Search for existing pros and update or insert
        const prosToProcess: any[] = [];
        for (const processedLead of processedLeads) {
          const { _resolved_client_id, ...leadData } = processedLead;
          
          // Search for existing pro by phone first, then email
          let existingPro = null;
          if (leadData.phone) {
            const { data } = await supabase
              .from('pros')
              .select('id')
              .eq('phone', leadData.phone)
              .maybeSingle();
            existingPro = data;
          }
          
          if (!existingPro && leadData.email) {
            const { data } = await supabase
              .from('pros')
              .select('id')
              .eq('email', leadData.email)
              .maybeSingle();
            existingPro = data;
          }
          
          if (existingPro) {
            // Update existing pro
            logger.info('Found existing pro, updating', { 
              proId: existingPro.id,
              phone: leadData.phone,
              email: leadData.email
            });
            
            await supabase
              .from('pros')
              .update(leadData)
              .eq('id', existingPro.id);
            
            prosToProcess.push({
              id: existingPro.id,
              ...leadData,
              _resolved_client_id,
              _isExisting: true
            });
          } else {
            // Insert new pro
            logger.info('Creating new pro', { 
              phone: leadData.phone,
              email: leadData.email
            });
            
            const { data, error } = await supabase
              .from('pros')
              .insert(leadData)
              .select()
              .single();
            
            if (error) {
              logger.error('Error inserting pro', { error });
              continue;
            }
            
            prosToProcess.push({
              ...data,
              _resolved_client_id,
              _isExisting: false
            });
          }
        }
        
        insertResult = { data: prosToProcess, error: null };

        // If client_id is provided or resolved, create matches automatically
        if (insertResult.data && insertResult.data.length > 0) {
          const matchesToCreate = [];
          
          for (let i = 0; i < processedLeads.length; i++) {
            const processedLead = processedLeads[i];
            const originalLead = data[i];
            const proId = (insertResult.data as any[])[i]?.id;
            
            // Use resolved client_id or the original one
            const clientId = processedLead._resolved_client_id || originalLead.client_id;
            
            if (proId && clientId) {
              const matchData: any = {
                pro_id: proId,
                client_id: clientId,
                match_score: originalLead.qualification_score || processedLead.qualification_score || 0,
                status: 'pending',
              };

              // Add price if provided
              if (originalLead.price_per_lead !== undefined) {
                matchData.price_per_lead = originalLead.price_per_lead;
              }

              matchesToCreate.push(matchData);
            }
          }
          
          if (matchesToCreate.length > 0) {
            logger.info(`Creating ${matchesToCreate.length} client matches`);
            const { data: createdMatches, error: matchError } = await supabase
              .from('matches')
              .insert(matchesToCreate)
              .select('id, client_id, pro_id, pricing_tier, cost');
            
            if (matchError) {
              logger.error('Error creating matches', { error: matchError });
            }
            
            // AUTO-PURCHASE: Check each client's credits and auto-purchase if they have enough
            if (createdMatches && createdMatches.length > 0) {
              logger.info(`Auto-purchasing ${createdMatches.length} matches...`);
              
              // Get unique client IDs
              const uniqueClientIds = [...new Set(createdMatches.map(m => m.client_id))];
              
              // Get client credits for all clients
              const { data: clients } = await supabase
                .from('clients')
                .select('id, credits_balance, credits_used, current_month_spend')
                .in('id', uniqueClientIds);
              
              const clientsMap = new Map(clients?.map(c => [c.id, c]) || []);
              
              // Process each match for auto-purchase
              const matchUpdates = [];
              const clientUpdates = new Map();
              const activityLogs = [];
              
              for (const match of createdMatches) {
                const client = clientsMap.get(match.client_id);
                if (!client) continue;
                
                // Calculate cost based on pricing tier
                const cost = match.cost || (
                  match.pricing_tier === 'premium' ? 500 :
                  match.pricing_tier === 'qualified' ? 300 : 50
                );
                
                // Check if client has enough credits
                if (client.credits_balance >= cost) {
                  logger.info(`Auto-purchasing match ${match.id} for $${cost}`, {
                    clientId: client.id,
                    currentBalance: client.credits_balance
                  });
                  
                  // Track this purchase
                  matchUpdates.push({
                    id: match.id,
                    purchased: true,
                    cost: cost,
                    auto_charged_at: new Date().toISOString()
                  });
                  
                  // Update client's running totals
                  if (!clientUpdates.has(client.id)) {
                    clientUpdates.set(client.id, {
                      id: client.id,
                      credits_balance: client.credits_balance,
                      credits_used: client.credits_used || 0,
                      current_month_spend: client.current_month_spend || 0,
                      totalCharges: 0
                    });
                  }
                  
                  const clientUpdate = clientUpdates.get(client.id);
                  clientUpdate.credits_balance -= cost;
                  clientUpdate.credits_used += cost;
                  clientUpdate.current_month_spend += cost;
                  clientUpdate.totalCharges += cost;
                  
                  // Log activity
                  activityLogs.push({
                    user_id: client.id,
                    activity_type: 'match_auto_charge_credits',
                    amount: cost,
                    currency: 'usd',
                    status: 'succeeded',
                    metadata: {
                      match_id: match.id,
                      pro_id: match.pro_id,
                      pricing_tier: match.pricing_tier,
                      payment_method: 'credits',
                      source: 'zapier_import'
                    }
                  });
                } else {
                  logger.warn(`Insufficient credits for match ${match.id}`, {
                    clientId: client.id,
                    required: cost,
                    available: client.credits_balance
                  });
                }
              }
              
              // Batch update all matches
              if (matchUpdates.length > 0) {
                logger.info(`Updating ${matchUpdates.length} matches as purchased`);
                for (const update of matchUpdates) {
                  await supabase
                    .from('matches')
                    .update({
                      purchased: update.purchased,
                      cost: update.cost,
                      auto_charged_at: update.auto_charged_at
                    })
                    .eq('id', update.id);
                }
              }
              
              // Batch update all client balances
              if (clientUpdates.size > 0) {
                logger.info(`Updating ${clientUpdates.size} client credit balances`);
                for (const [clientId, update] of clientUpdates) {
                  await supabase
                    .from('clients')
                    .update({
                      credits_balance: update.credits_balance,
                      credits_used: update.credits_used,
                      current_month_spend: update.current_month_spend
                    })
                    .eq('id', clientId);
                  
                  logger.info(`Client ${clientId} charged $${update.totalCharges}, new balance: $${update.credits_balance}`);
                }
              }
              
              // Log all activity
              if (activityLogs.length > 0) {
                await supabase.from('payment_activity_log').insert(activityLogs);
              }
              
              logger.info(`Auto-purchase complete: ${matchUpdates.length}/${createdMatches.length} matches purchased`);
            }
            
            // Also create ai_leads records for AI Recruiting Hub
            const aiLeadsToCreate = [];
            for (let i = 0; i < matchesToCreate.length; i++) {
              const match = matchesToCreate[i];
              const insertedPro = (insertResult.data as any[])[i];
              
              if (insertedPro && match.client_id) {
                aiLeadsToCreate.push({
                  client_id: match.client_id,
                  pro_id: match.pro_id,
                  phone: insertedPro.phone || '',
                  email: insertedPro.email,
                  first_name: insertedPro.first_name,
                  last_name: insertedPro.last_name,
                  stage: 'new_lead',
                  status: 'new',
                  match_score: match.match_score || 0,
                  ai_active: true,
                });
              }
            }
            
            if (aiLeadsToCreate.length > 0) {
              logger.info(`Creating ${aiLeadsToCreate.length} AI leads`);
              await supabase.from('ai_leads').insert(aiLeadsToCreate);
            }
            
            // AUTO-ENRICH: Trigger background enrichment for all new pros
            for (const proData of insertResult.data) {
              if (proData.id && !proData._isExisting) {
                logger.info(`Triggering auto-enrichment for pro ${proData.id}`);
                
                // Fire and forget - don't wait for enrichment
                fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/auto-enrich-pro`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
                  },
                  body: JSON.stringify({ pro_id: proData.id })
                }).catch((err: Error) => {
                  logger.error('Error triggering auto-enrichment', { error: err.message });
                });
              }
            }
          }
        }
        break;

      case 'clients':
        tableName = 'clients';
        // For clients, we need to create auth users first
        const clientResults = [];
        for (const client of data) {
          // Generate cryptographically secure password
          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
          const passwordArray = new Uint8Array(16);
          crypto.getRandomValues(passwordArray);
          const securePassword = Array.from(passwordArray)
            .map(x => chars[x % chars.length])
            .join('');

          // Create auth user
          const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: client.email,
            password: securePassword,
            email_confirm: true,
          });

          if (authError || !authUser.user) {
            console.error('Error creating auth user:', authError);
            continue;
          }

          // Insert client record
          const { error: clientError } = await supabase.from('clients').insert({
            user_id: authUser.user.id,
            email: client.email,
            contact_name: client.contact_name || client.name || '',
            company_name: client.company_name || '',
            phone: client.phone || null,
          });

          if (!clientError) {
            clientResults.push(authUser.user.id);
          }
        }
        
        insertResult = { error: null, data: clientResults };
        break;

      case 'staff':
      case 'users':
        // For staff/users, create auth users and assign roles
        const userResults = [];
        for (const user of data) {
          // Generate cryptographically secure password
          const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
          const passwordArray = new Uint8Array(16);
          crypto.getRandomValues(passwordArray);
          const securePassword = Array.from(passwordArray)
            .map(x => chars[x % chars.length])
            .join('');

          const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: user.email,
            password: securePassword,
            email_confirm: true,
          });

          if (authError || !authUser.user) {
            console.error('Error creating auth user:', authError);
            continue;
          }

          // Assign role
          const role = entity_type === 'staff' ? 'staff' : 'lead';
          await supabase.from('user_roles').insert({
            user_id: authUser.user.id,
            role: role,
          });

          userResults.push(authUser.user.id);
        }
        
        insertResult = { error: null, data: userResults };
        tableName = 'users';
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid entity_type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Check if any pros were successfully processed
    if (!insertResult.data || insertResult.data.length === 0) {
      console.error('No pros were successfully processed');
      
      // Log the error
      await supabase.from('zapier_logs').insert({
        user_id: authenticatedUserId,
        action: 'import',
        entity_type,
        entity_count: 0,
        status: 'error',
        error_message: 'No pros were successfully processed',
      });

      return new Response(
        JSON.stringify({ error: 'No pros were successfully processed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log success
    await supabase.from('zapier_logs').insert({
      user_id: authenticatedUserId,
      action: 'import',
      entity_type,
      entity_count: data.length,
      status: 'success',
    });

    logger.info('Import completed successfully', {
      imported: data.length,
      entity_type,
    });

    const response = new Response(
      JSON.stringify({ 
        success: true, 
        imported: data.length,
        entity_type,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
    logger.response(200, Date.now() - startTime, { imported: data.length });
    return response;

  } catch (error: any) {
    logger.error('Zapier import error', error);
    const response = new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    logger.response(500, Date.now() - startTime);
    return response;
  }
});

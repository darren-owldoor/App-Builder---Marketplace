import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation schema for lead import
const leadValidationSchema = z.object({
  full_name: z.string().trim().min(1).max(200),
  phone: z.string().min(10).max(20),
  email: z.string().email().max(255).optional().nullable(),
  first_name: z.string().max(100).optional().nullable(),
  last_name: z.string().max(100).optional().nullable(),
  cities: z.union([z.string(), z.array(z.string())]).optional().nullable(),
  states: z.union([z.string(), z.array(z.string())]).optional().nullable(),
  counties: z.union([z.string(), z.array(z.string())]).optional().nullable(),
  zip_codes: z.union([z.string(), z.array(z.string())]).optional().nullable(),
  radius: z.union([z.number(), z.string()]).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  brokerage: z.string().max(200).optional().nullable(),
  license_type: z.string().max(100).optional().nullable(),
  state_license: z.string().max(100).optional().nullable(),
  license: z.string().max(100).optional().nullable(),
  transactions: z.number().int().min(0).max(10000).optional().nullable(),
  years_experience: z.number().int().min(0).max(80).optional().nullable(),
  experience: z.number().int().min(0).max(80).optional().nullable(),
  interest_level: z.number().int().min(0).max(10).optional().nullable(),
  motivation: z.number().int().min(0).max(10).optional().nullable(),
  total_sales: z.number().min(0).max(1000000000).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  wants: z.string().max(1000).optional().nullable(),
  skills: z.string().max(1000).optional().nullable(),
  profile_url: z.string().url().max(500).optional().nullable(),
  image_url: z.string().url().max(500).optional().nullable(),
  source: z.string().max(100).optional().nullable(),
  status: z.string().max(50).optional().nullable(),
});

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

interface LeadData {
  full_name?: string;
  'Full Name'?: string;
  name?: string;
  phone?: string;
  Phone?: string;
  email?: string;
  Email?: string;
  city?: string;
  cities?: string | string[];
  City?: string;
  Cities?: string | string[];
  state?: string;
  states?: string | string[];
  State?: string;
  States?: string | string[];
  county?: string;
  counties?: string | string[];
  County?: string;
  Counties?: string | string[];
  zip_code?: string;
  zip_codes?: string | string[];
  'Zip Code'?: string;
  'Zip Codes'?: string | string[];
  radius?: number | string;
  Radius?: number | string;
  company?: string;
  Company?: string;
  brokerage?: string;
  Brokerage?: string;
  license_type?: string;
  'License Type'?: string;
  licenseType?: string;
  state_license?: string;
  'State License'?: string;
  stateLicense?: string;
  license?: string;
  License?: string;
  transactions?: number;
  Transactions?: number;
  years_experience?: number;
  'Years Experience'?: number;
  'Years Exp'?: number;
  experience?: number;
  Experience?: number;
  interest_level?: number;
  'Interest Level'?: number;
  '1-10 Interest'?: number;
  motivation?: number;
  Motivation?: number;
  total_sales?: number;
  'Total Sales'?: number;
  notes?: string;
  Notes?: string;
  wants?: string;
  Wants?: string;
  skills?: string;
  Skills?: string;
  profile?: string;
  Profile?: string;
  profile_url?: string;
  'Profile URL'?: string;
  image?: string;
  Image?: string;
  image_url?: string;
  'Image URL'?: string;
  source?: string;
  Source?: string;
  status?: string;
  Status?: string;
  'Pipeline Stage'?: string;
}

// Normalize field names from various formats
const normalizeLeadData = (data: any): {
  full_name: string;
  phone: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  cities?: string | string[];
  states?: string | string[];
  counties?: string | string[];
  zip_codes?: string | string[];
  radius?: number;
  company?: string;
  brokerage?: string;
  license_type?: string;
  state_license?: string;
  license?: string;
  transactions?: number;
  years_experience?: number;
  experience?: number;
  interest_level?: number;
  motivation?: number;
  total_sales?: number;
  notes?: string;
  wants?: string;
  skills?: string;
  profile_url?: string;
  image_url?: string;
  source?: string;
  status?: string;
  // Direct assignment fields
  client_email?: string;
  client_phone?: string;
  lead_price?: number;
} => {
  return {
    full_name: data.full_name || data['Full Name'] || data.name || '',
    phone: normalizePhoneNumber(data.phone || data.Phone || ''),
    email: data.email || data.Email,
    first_name: data.first_name || data['First Name'],
    last_name: data.last_name || data['Last Name'],
    cities: data.cities || data.Cities || data.city || data.City,
    states: data.states || data.States || data.state || data.State,
    counties: data.counties || data.Counties || data.county || data.County,
    zip_codes: data.zip_codes || data['Zip Codes'] || data.zip_code || data['Zip Code'],
    radius: data.radius || data.Radius,
    company: data.company || data.Company,
    brokerage: data.brokerage || data.Brokerage,
    license_type: data.license_type || data['License Type'] || data.licenseType,
    state_license: data.state_license || data['State License'] || data.stateLicense,
    license: data.license || data.License,
    transactions: data.transactions || data.Transactions,
    years_experience: data.years_experience || data['Years Experience'] || data['Years Exp'],
    experience: data.experience || data.Experience,
    interest_level: data.interest_level || data['Interest Level'] || data['1-10 Interest'],
    motivation: data.motivation || data.Motivation,
    total_sales: data.total_sales || data['Total Sales'],
    notes: data.notes || data.Notes,
    wants: data.wants || data.Wants,
    skills: data.skills || data.Skills,
    profile_url: data.profile_url || data['Profile URL'] || data.profile || data.Profile,
    image_url: data.image_url || data['Image URL'] || data.image || data.Image,
    source: data.source || data.Source,
    status: data.status || data.Status || data['Pipeline Stage'],
    // Direct assignment fields
    client_email: data.client_email || data['Client Email'] || data.clientEmail,
    client_phone: data.client_phone || data['Client Phone'] || data.clientPhone,
    lead_price: data.lead_price || data['Lead Price'] || data.leadPrice,
  };
}

const calculateQualificationScore = (
  transactions: number = 0,
  yearsExp: number = 0,
  interest: number = 5
): number => {
  let score = 0;
  
  // Transaction score (0-40 points)
  if (transactions >= 20) score += 40;
  else if (transactions >= 10) score += 30;
  else if (transactions >= 5) score += 20;
  else score += 10;
  
  // Experience score (0-30 points)
  if (yearsExp >= 10) score += 30;
  else if (yearsExp >= 5) score += 20;
  else if (yearsExp >= 2) score += 10;
  
  // Interest level (0-30 points)
  score += Math.round((interest / 10) * 30);
  
  return Math.min(score, 100);
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const rawData: LeadData = await req.json();
    
    console.log('Received lead data from Zapier/Google Sheets:', rawData);

    // Normalize field names to handle Google Sheets variations
    const leadData = normalizeLeadData(rawData);

    // Validate required fields
    if (!leadData.full_name || !leadData.phone) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: full_name and phone are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate data with zod schema
    const validationResult = leadValidationSchema.safeParse({
      ...leadData,
      transactions: leadData.transactions || null,
      years_experience: leadData.years_experience || null,
      experience: leadData.experience || null,
      interest_level: leadData.interest_level || null,
      motivation: leadData.motivation || null,
      total_sales: leadData.total_sales || null,
    });

    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed',
          details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Calculate qualification score
    const qualificationScore = calculateQualificationScore(
      leadData.transactions || 0,
      leadData.years_experience || 0,
      leadData.interest_level || 5
    );

    // Use provided status or calculate based on qualification score
    let status = 'new';
    let pipeline_stage = 'new';
    
    if (leadData.status) {
      // Accept status from import (e.g., "Qualified", "Match Ready")
      status = leadData.status.toLowerCase().replace(/\s+/g, '_');
      pipeline_stage = status;
    } else {
      // Auto-calculate if not provided
      if (qualificationScore >= 70) {
        status = 'qualified';
        pipeline_stage = 'match_ready'; // Auto-match qualified leads
      } else if (qualificationScore >= 50) {
        status = 'qualifying';
        pipeline_stage = 'qualifying';
      }
    }

    // Generate email if not provided (with sanitization)
    const sanitizedName = leadData.full_name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '.')
      .slice(0, 50);
    
    const email = leadData.email?.trim() 
      ? leadData.email.trim() 
      : `${sanitizedName}@placeholder.com`;

    // Helper function to convert to array with length limits
    const toArray = (value: any, maxItems: number = 100): string[] => {
      if (!value) return [];
      if (Array.isArray(value)) return value.slice(0, maxItems);
      if (typeof value === 'string') {
        return value.split(',').map(v => v.trim()).filter(Boolean).slice(0, maxItems);
      }
      return [];
    };

    // Check if pro already exists by phone number
    const { data: existingLead } = await supabase
      .from('pros')
      .select('id, user_id')
      .eq('phone', leadData.phone)
      .maybeSingle();

    if (existingLead) {
      // Update existing pro
      const { error: updateError } = await supabase
        .from('pros')
        .update({
          full_name: leadData.full_name,
          first_name: leadData.first_name || null,
          last_name: leadData.last_name || null,
          email: email,
          cities: toArray(leadData.cities, 50),
          states: toArray(leadData.states, 20),
          counties: toArray(leadData.counties, 20),
          zip_codes: toArray(leadData.zip_codes, 100),
          radius: leadData.radius ? Math.max(0, Math.min(1000, parseInt(String(leadData.radius)))) : null,
          company: leadData.company || null,
          brokerage: leadData.brokerage || null,
          license_type: leadData.license_type || null,
          state_license: leadData.state_license || null,
          license: leadData.license || null,
          qualification_score: qualificationScore,
          status: status,
          pipeline_stage: pipeline_stage,
          notes: leadData.notes ? String(leadData.notes).slice(0, 5000) : null,
          transactions: leadData.transactions ? Math.max(0, Math.min(10000, leadData.transactions)) : null,
          experience: leadData.experience || leadData.years_experience ? Math.max(0, Math.min(80, leadData.experience || leadData.years_experience || 0)) : null,
          total_sales: leadData.total_sales ? Math.max(0, Math.min(1000000000, leadData.total_sales)) : null,
          motivation: leadData.motivation || leadData.interest_level ? Math.max(0, Math.min(10, leadData.motivation || leadData.interest_level || 0)) : null,
          wants: leadData.wants ? leadData.wants.split(',').map(w => w.trim()).slice(0, 50) : null,
          skills: leadData.skills ? leadData.skills.split(',').map(s => s.trim()).slice(0, 50) : null,
          profile_url: leadData.profile_url || null,
          image_url: leadData.image_url || null,
        })
        .eq('id', existingLead.id);

      if (updateError) {
        const correlationId = crypto.randomUUID();
        console.error('Error updating lead:', { correlationId, updateError });
        return new Response(
          JSON.stringify({ error: 'Failed to update lead. Please try again.', correlationId }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Handle client assignment if specified
      let matchCreated = false;
      if (leadData.client_email || leadData.client_phone) {
        try {
          // Find client by email or phone
          let clientQuery = supabase.from('clients').select('id');
          if (leadData.client_email) {
            clientQuery = clientQuery.eq('email', leadData.client_email);
          } else if (leadData.client_phone) {
            clientQuery = clientQuery.eq('phone', leadData.client_phone);
          }
          
          const { data: client } = await clientQuery.maybeSingle();
          
          if (client) {
            // Check if match already exists
            const { data: existingMatch } = await supabase
              .from('matches')
              .select('id')
              .eq('pro_id', existingLead.id)
              .eq('client_id', client.id)
              .maybeSingle();
            
            if (!existingMatch) {
              // Create match
              const { error: matchError } = await supabase
                .from('matches')
                .insert({
                  pro_id: existingLead.id,
                  client_id: client.id,
                  status: 'pending',
                  match_score: qualificationScore,
                  lead_price: leadData.lead_price || null
                });
              
              if (!matchError) {
                matchCreated = true;
              }
            }
          }
        } catch (assignError) {
          console.error('Error assigning to client:', assignError);
        }
      }

      // Trigger auto-match if pipeline_stage is match_ready and no specific client was assigned
      if (pipeline_stage === 'match_ready' && !matchCreated) {
        try {
          console.log('🎯 Triggering auto-match for updated lead...');
          const supabaseUrl = Deno.env.get('SUPABASE_URL');
          const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
          
          await fetch(`${supabaseUrl}/functions/v1/auto-match-leads`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            }
          });
        } catch (matchError) {
          console.error('Error triggering auto-match:', matchError);
        }
      }

      console.log('Successfully updated lead:', leadData.full_name);
      return new Response(
        JSON.stringify({ 
          success: true, 
          action: 'updated',
          lead_id: existingLead.id,
          match_created: matchCreated,
          message: 'Lead updated successfully' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create new pro
    const { data: newLead, error: insertError } = await supabase
      .from('pros')
      .insert({
        full_name: leadData.full_name,
        first_name: leadData.first_name || null,
        last_name: leadData.last_name || null,
        email: email,
        phone: leadData.phone,
        cities: toArray(leadData.cities, 50),
        states: toArray(leadData.states, 20),
        counties: toArray(leadData.counties, 20),
        zip_codes: toArray(leadData.zip_codes, 100),
        radius: leadData.radius ? Math.max(0, Math.min(1000, parseInt(String(leadData.radius)))) : null,
        company: leadData.company || null,
        brokerage: leadData.brokerage || null,
        license_type: leadData.license_type || null,
        state_license: leadData.state_license || null,
        license: leadData.license || null,
        qualification_score: qualificationScore,
        status: status,
        pipeline_stage: pipeline_stage,
        source: leadData.source || 'Zapier',
        user_id: null,
        notes: leadData.notes ? String(leadData.notes).slice(0, 5000) : null,
        transactions: leadData.transactions ? Math.max(0, Math.min(10000, leadData.transactions)) : null,
        experience: leadData.experience || leadData.years_experience ? Math.max(0, Math.min(80, leadData.experience || leadData.years_experience || 0)) : null,
        total_sales: leadData.total_sales ? Math.max(0, Math.min(1000000000, leadData.total_sales)) : null,
        motivation: leadData.motivation || leadData.interest_level ? Math.max(0, Math.min(10, leadData.motivation || leadData.interest_level || 0)) : null,
        wants: leadData.wants ? leadData.wants.split(',').map(w => w.trim()).slice(0, 50) : null,
        skills: leadData.skills ? leadData.skills.split(',').map(s => s.trim()).slice(0, 50) : null,
        profile_url: leadData.profile_url || null,
        image_url: leadData.image_url || null,
      })
      .select()
      .single();

    if (insertError) {
      const correlationId = crypto.randomUUID();
      console.error('Error inserting lead:', { correlationId, insertError });
      return new Response(
        JSON.stringify({ error: 'Failed to create lead. Please try again.', correlationId }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Handle client assignment if specified
    let matchCreated = false;
    if (leadData.client_email || leadData.client_phone) {
      try {
        // Find client by email or phone
        let clientQuery = supabase.from('clients').select('id, active');
        if (leadData.client_email) {
          clientQuery = clientQuery.eq('email', leadData.client_email);
        } else if (leadData.client_phone) {
          clientQuery = clientQuery.eq('phone', leadData.client_phone);
        }
        
        const { data: client } = await clientQuery.maybeSingle();
        
        if (client && client.active !== false) {
          // Create match
          const { error: matchError } = await supabase
            .from('matches')
            .insert({
              pro_id: newLead.id,
              client_id: client.id,
              status: 'pending',
              match_score: qualificationScore,
              lead_price: leadData.lead_price || null
            });
          
          if (!matchError) {
            matchCreated = true;
            console.log('Match created with client:', client.id);
          }
        }
      } catch (assignError) {
        console.error('Error assigning to client:', assignError);
      }
    }

    // Trigger auto-match if pipeline_stage is match_ready and no specific client was assigned
    if (pipeline_stage === 'match_ready' && !matchCreated) {
      try {
        console.log('🎯 Triggering auto-match for new lead...');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        await fetch(`${supabaseUrl}/functions/v1/auto-match-leads`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (matchError) {
        console.error('Error triggering auto-match:', matchError);
      }
    }

    console.log('Successfully created lead:', leadData.full_name);
    return new Response(
      JSON.stringify({ 
        success: true, 
        action: 'created',
        lead_id: newLead.id,
        match_created: matchCreated,
        message: 'Lead created successfully' 
      }),
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error processing lead:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

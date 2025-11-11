import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify API key authentication
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify API key exists and get user
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('api_keys')
      .select('user_id, active')
      .eq('key', apiKey)
      .single();

    if (apiKeyError || !apiKeyData || !apiKeyData.active) {
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'leads'; // leads, pros, or clients

    // Fetch custom fields for this user
    const { data: customFields, error: fieldsError } = await supabase
      .from('custom_fields')
      .select('*')
      .eq('user_id', apiKeyData.user_id)
      .eq('record_type', type)
      .eq('is_active', true)
      .order('field_order', { ascending: true });

    if (fieldsError) throw fieldsError;

    // Transform to Zapier Field schema
    const zapierFields = customFields.map(field => {
      const baseField: any = {
        key: field.field_name,
        label: field.label,
        helpText: field.description || undefined,
        required: field.required || false,
        altersDynamicFields: false,
      };

      // Map field types to Zapier types
      switch (field.field_type) {
        case 'text':
        case 'email':
        case 'phone':
        case 'url':
          baseField.type = 'string';
          break;
        case 'textarea':
          baseField.type = 'text';
          break;
        case 'number':
          baseField.type = 'number';
          break;
        case 'date':
          baseField.type = 'datetime';
          break;
        case 'boolean':
          baseField.type = 'boolean';
          break;
        case 'dropdown':
          baseField.type = 'string';
          if (field.options && Array.isArray(field.options)) {
            baseField.choices = field.options.map((opt: string) => ({
              value: opt,
              label: opt,
              sample: opt
            }));
          }
          break;
        case 'multi_select':
          baseField.type = 'string';
          baseField.list = true;
          if (field.options && Array.isArray(field.options)) {
            baseField.choices = field.options.map((opt: string) => ({
              value: opt,
              label: opt,
              sample: opt
            }));
          }
          break;
        default:
          baseField.type = 'string';
      }

      // Add placeholder if exists
      if (field.placeholder) {
        baseField.placeholder = field.placeholder;
      }

      // Add default value if exists
      if (field.default_value !== null && field.default_value !== undefined) {
        baseField.default = field.default_value;
      }

      return baseField;
    });

    // Add standard fields that are always available
    const standardFields = [
      {
        key: 'ai_zap_help',
        label: 'AI Zap Help',
        type: 'text',
        required: false,
        helpText: 'Describe what you want AI to do with this record (e.g., "Qualify this lead", "Send personalized intro", "Find matching pros")'
      },
      {
        key: 'full_name',
        label: 'Full Name',
        type: 'string',
        required: true,
        helpText: 'Full name of the person'
      },
      {
        key: 'email',
        label: 'Email',
        type: 'string',
        required: false,
        helpText: 'Email address'
      },
      {
        key: 'phone',
        label: 'Phone',
        type: 'string',
        required: false,
        helpText: 'Phone number in E.164 format (+1XXXXXXXXXX)'
      },
      {
        key: 'cities',
        label: 'Cities',
        type: 'string',
        list: true,
        required: false,
        helpText: 'List of cities (comma-separated)'
      },
      {
        key: 'states',
        label: 'States',
        type: 'string',
        list: true,
        required: false,
        helpText: 'List of state codes (comma-separated)'
      },
      {
        key: 'zip_codes',
        label: 'Zip Codes',
        type: 'string',
        list: true,
        required: false,
        helpText: 'List of zip codes (comma-separated)'
      },
      {
        key: 'tags',
        label: 'Tags',
        type: 'string',
        list: true,
        required: false,
        helpText: 'List of tags (comma-separated)'
      },
      {
        key: 'notes',
        label: 'Notes',
        type: 'text',
        required: false,
        helpText: 'Additional notes or comments'
      }
    ];

    // Type-specific fields
    if (type === 'leads' || type === 'pros') {
      standardFields.push(
        {
          key: 'brokerage',
          label: 'Brokerage',
          type: 'string',
          required: false,
          helpText: 'Brokerage or company name'
        },
        {
          key: 'license_type',
          label: 'License Type',
          type: 'string',
          required: false,
          helpText: 'Type of license (e.g., Real Estate Agent, Broker)'
        },
        {
          key: 'years_experience',
          label: 'Years of Experience',
          type: 'number',
          required: false,
          helpText: 'Number of years in the industry'
        },
        {
          key: 'transactions',
          label: 'Annual Transactions',
          type: 'number',
          required: false,
          helpText: 'Number of transactions per year'
        }
      );
    }

    // Combine standard + custom fields
    const allFields = [...standardFields, ...zapierFields];

    return new Response(
      JSON.stringify(allFields),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching dynamic fields:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

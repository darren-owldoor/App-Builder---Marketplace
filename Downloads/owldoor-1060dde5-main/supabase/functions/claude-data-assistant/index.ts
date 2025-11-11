import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  type: 'database_schema' | 'data_cleaning' | 'directory_structure' | 'custom';
  query?: string;
  context?: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) throw new Error('Unauthorized');

    // Check admin/staff access
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const hasAccess = roles?.some(r => r.role === 'admin' || r.role === 'staff');
    if (!hasAccess) throw new Error('Admin or staff access required');

    const { type, query, context }: AnalysisRequest = await req.json();
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) throw new Error('Anthropic API key not configured');

    // Gather relevant data based on type
    let systemPrompt = '';
    let analysisData: any = {};

    if (type === 'database_schema') {
      // Get table statistics
      const { data: prosCount } = await supabase.from('pros').select('id', { count: 'exact', head: true });
      const { data: clientsCount } = await supabase.from('clients').select('id', { count: 'exact', head: true });
      const { data: leadsCount } = await supabase.from('leads').select('id', { count: 'exact', head: true });
      const { data: matchesCount } = await supabase.from('matches').select('id', { count: 'exact', head: true });

      // Sample data for quality analysis
      const { data: prosSample } = await supabase.from('pros').select('*').limit(5);
      const { data: leadsSample } = await supabase.from('leads').select('*').limit(5);

      analysisData = {
        counts: { prosCount, clientsCount, leadsCount, matchesCount },
        samples: { pros: prosSample, leads: leadsSample }
      };

      systemPrompt = `You are a database expert analyzing an OwlDoor CRM system. 
      Main tables: pros (real estate agents), clients (brokerages), leads (recruits), matches (connections).
      Analyze the schema, identify data quality issues, suggest optimizations, and recommend cleaning strategies.`;
    }

    if (type === 'data_cleaning') {
      // Find duplicates and data quality issues
      const { data: duplicatePhones } = await supabase.rpc('find_all_duplicate_pros');
      const { data: duplicateLeads } = await supabase.rpc('find_all_duplicate_leads');
      
      // Get records with missing critical fields
      const { data: incompletePros } = await supabase
        .from('pros')
        .select('id, full_name, email, phone')
        .or('email.is.null,phone.is.null,full_name.is.null')
        .limit(20);

      analysisData = {
        duplicates: { pros: duplicatePhones, leads: duplicateLeads },
        incomplete: { pros: incompletePros }
      };

      systemPrompt = `You are a data cleaning expert. Analyze duplicate records, missing data, and data quality issues.
      Provide specific SQL queries or strategies to clean and merge data. Prioritize preserving the most complete records.`;
    }

    if (type === 'directory_structure') {
      systemPrompt = `You are a software architect analyzing a React/TypeScript CRM project structure.
      Review component organization, identify refactoring opportunities, suggest improvements for maintainability.
      The project uses: React, TypeScript, Tailwind, Supabase, React Router, shadcn/ui.`;
      
      analysisData = {
        structure: {
          pages: 'src/pages/* - main route components',
          components: 'src/components/* - reusable UI components',
          admin: 'src/components/admin/* - admin-specific components',
          campaigns: 'src/components/campaigns/* - campaign management',
          client: 'src/components/client/* - client/brokerage features',
          agent: 'src/components/agent/* - pro/agent features',
          edgeFunctions: 'supabase/functions/* - backend API endpoints'
        }
      };
    }

    // Make Claude API request
    const messages = [
      {
        role: 'user',
        content: query || `Analyze the following data and provide actionable recommendations:\n\n${JSON.stringify(analysisData, null, 2)}`
      }
    ];

    console.log('Calling Claude API for analysis type:', type);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 4096,
        system: systemPrompt,
        messages: messages
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const result = await response.json();
    const analysis = result.content[0].text;

    console.log('Claude analysis completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis,
        data: analysisData,
        type 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in claude-data-assistant:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});

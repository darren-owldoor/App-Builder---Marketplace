import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface ChatRequest {
  messages: Array<{ role: string; content: string }>;
  provider?: 'lovable' | 'openai' | 'anthropic';
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting - max 50 requests per hour per user
    const { data: canProceed, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      p_identifier: user.id,
      p_endpoint: 'ai-chat-multi',
      p_max_requests: 50,
      p_window_minutes: 60
    });

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
    }

    if (canProceed === false) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Maximum 50 AI requests per hour.',
          retryAfter: 3600 
        }),
        { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const {
      messages,
      provider = 'lovable',
      model,
      temperature = 0.7,
      max_tokens = 1000
    }: ChatRequest = await req.json();

    console.log(`AI Chat Request - Provider: ${provider}, Model: ${model || 'default'}`);

    let response;

    switch (provider) {
      case 'openai':
        response = await callOpenAI(messages, model || 'gpt-5-nano-2025-08-07', temperature, max_tokens);
        break;
      
      case 'anthropic':
        response = await callAnthropic(messages, model || 'claude-sonnet-4-5', temperature, max_tokens);
        break;
      
      case 'lovable':
      default:
        response = await callLovableAI(messages, model || 'google/gemini-2.5-flash', temperature, max_tokens);
        break;
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI Chat Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        provider: 'unknown'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function callLovableAI(
  messages: Array<{ role: string; content: string }>,
  model: string,
  temperature: number,
  max_tokens: number
) {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    if (response.status === 402) {
      throw new Error('Payment required. Please add credits to your workspace.');
    }
    const errorText = await response.text();
    console.error('Lovable AI Error:', response.status, errorText);
    throw new Error(`Lovable AI error: ${response.status}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    provider: 'lovable',
    model,
    usage: data.usage,
  };
}

async function callOpenAI(
  messages: Array<{ role: string; content: string }>,
  model: string,
  temperature: number,
  max_tokens: number
) {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');

  // GPT-5 and newer models use max_completion_tokens and don't support temperature
  const isNewModel = model.startsWith('gpt-5') || model.startsWith('o3') || model.startsWith('o4');
  
  const requestBody: any = {
    model,
    messages,
  };

  if (isNewModel) {
    requestBody.max_completion_tokens = max_tokens;
    // Don't include temperature for GPT-5 models
  } else {
    requestBody.max_tokens = max_tokens;
    requestBody.temperature = temperature;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI Error:', response.status, errorText);
    throw new Error(`OpenAI error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    provider: 'openai',
    model,
    usage: data.usage,
  };
}

async function callAnthropic(
  messages: Array<{ role: string; content: string }>,
  model: string,
  temperature: number,
  max_tokens: number
) {
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
  if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured');

  // Anthropic requires system message separate
  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  const conversationMessages = messages.filter(m => m.role !== 'system');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens,
      temperature,
      system: systemMessage,
      messages: conversationMessages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Anthropic Error:', response.status, errorText);
    throw new Error(`Anthropic error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return {
    content: data.content[0].text,
    provider: 'anthropic',
    model,
    usage: data.usage,
  };
}

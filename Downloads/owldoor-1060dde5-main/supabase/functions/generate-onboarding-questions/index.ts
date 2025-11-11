import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIProviderResponse {
  provider: string;
  questions: any[];
  reasoning: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userType } = await req.json(); // 'broker' or 'agent'

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    const systemPrompt = `You are an expert in real estate recruitment and matching. Generate 8-12 onboarding questions for a ${userType} that will help match them with compatible ${userType === 'broker' ? 'agents' : 'brokers'}.

Focus on questions that reveal:
- Geographic preferences and coverage
- Experience level and specialization
- Work style and culture fit
- Performance metrics and goals
- Technology and tools preferences
- Communication preferences
- Growth and support expectations

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "id": "unique_id",
      "question": "Question text",
      "type": "radio" | "checkbox" | "input" | "textarea",
      "options": ["option1", "option2"] (only for radio/checkbox),
      "category": "geographic" | "experience" | "culture" | "performance" | "technology" | "communication" | "goals",
      "weight": 1-10 (importance for matching)
    }
  ],
  "reasoning": "Brief explanation of why these questions matter for matching"
}`;

    // Query all three providers in parallel
    const [claudeResponse, geminiResponse, gptResponse] = await Promise.allSettled([
      // Claude (best reasoning)
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 2000,
          messages: [{ role: 'user', content: systemPrompt }],
        }),
      }),
      
      // Gemini (balanced)
      fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: systemPrompt }],
          temperature: 0.7,
        }),
      }),
      
      // GPT-5 (creative)
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-2025-08-07',
          messages: [{ role: 'user', content: systemPrompt }],
          max_completion_tokens: 2000,
        }),
      }),
    ]);

    const responses: AIProviderResponse[] = [];

    // Parse Claude response
    if (claudeResponse.status === 'fulfilled') {
      const data = await claudeResponse.value.json();
      const content = data.content?.[0]?.text || '';
      try {
        const parsed = JSON.parse(content);
        responses.push({
          provider: 'claude',
          questions: parsed.questions || [],
          reasoning: parsed.reasoning || '',
        });
      } catch (e) {
        console.error('Failed to parse Claude response:', e);
      }
    }

    // Parse Gemini response
    if (geminiResponse.status === 'fulfilled') {
      const data = await geminiResponse.value.json();
      const content = data.choices?.[0]?.message?.content || '';
      try {
        const parsed = JSON.parse(content);
        responses.push({
          provider: 'gemini',
          questions: parsed.questions || [],
          reasoning: parsed.reasoning || '',
        });
      } catch (e) {
        console.error('Failed to parse Gemini response:', e);
      }
    }

    // Parse GPT response
    if (gptResponse.status === 'fulfilled') {
      const data = await gptResponse.value.json();
      const content = data.choices?.[0]?.message?.content || '';
      try {
        const parsed = JSON.parse(content);
        responses.push({
          provider: 'gpt',
          questions: parsed.questions || [],
          reasoning: parsed.reasoning || '',
        });
      } catch (e) {
        console.error('Failed to parse GPT response:', e);
      }
    }

    // Merge and deduplicate questions based on similarity
    const mergedQuestions = mergeQuestions(responses);

    return new Response(
      JSON.stringify({
        questions: mergedQuestions,
        providerInsights: responses.map(r => ({
          provider: r.provider,
          reasoning: r.reasoning,
        })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating onboarding questions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function mergeQuestions(responses: AIProviderResponse[]) {
  const allQuestions = responses.flatMap(r => r.questions);
  const merged = [];
  const seen = new Set();

  for (const question of allQuestions) {
    // Create a normalized key for deduplication
    const key = question.question.toLowerCase().slice(0, 50);
    
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(question);
    }
  }

  // Sort by weight (descending) and take top 10
  return merged
    .sort((a, b) => (b.weight || 5) - (a.weight || 5))
    .slice(0, 10);
}

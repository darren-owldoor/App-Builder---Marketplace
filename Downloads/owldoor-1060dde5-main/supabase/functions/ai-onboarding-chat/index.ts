import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Minimal questions for basic matching
const CORE_QUESTIONS = [
  "Let's get you set up quickly! First, tell me about your company - what type of business (real estate brokerage, mortgage company, etc.) and what makes you unique?",
  "What geographic areas do you serve? (Cities, states, or zip codes)",
  "What's the most important thing you look for in candidates? (Experience level, skills, qualifications, etc.)",
  "What's your compensation structure? (Salary range, commission split, benefits)"
];

// Additional detailed questions (optional)
const DETAILED_QUESTIONS = [
  "What are absolute deal-breakers that would disqualify a candidate?",
  "Is this role remote, hybrid, or in-office?",
  "Describe your company culture and values",
  "What are the key day-to-day responsibilities?",
  "What career growth opportunities do you offer?",
  "What questions should I ask candidates to qualify them?",
  "What common objections do candidates have, and how should I address them?",
  "What information should I collect before booking appointments?",
  "What are your preferred appointment times/days?",
  "How quickly do you want to move qualified candidates through the process?"
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { messages, profileId, clientId, questionCount, wantDetailed } = await req.json();
    
    console.log('Processing onboarding chat:', { profileId, clientId, questionCount, wantDetailed });

    // After core questions, offer choice
    if (questionCount === CORE_QUESTIONS.length && wantDetailed === undefined) {
      return new Response(
        JSON.stringify({
          completed: false,
          needsChoice: true,
          message: "Great! You've completed the essentials for matching. Would you like to:\n\nA) Add more details now (helps with better matching and AI assistant performance)\nB) Skip to dashboard (you can always add details later in settings)",
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine which questions array to use
    const questionsList = wantDetailed ? [...CORE_QUESTIONS, ...DETAILED_QUESTIONS] : CORE_QUESTIONS;

    // Check if we've completed all questions
    if (questionCount >= questionsList.length) {
      // Generate business profile summary using AI
      const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
      
      const summaryPrompt = `Based on this onboarding conversation, extract and structure the key information about this recruiting company:

Conversation:
${messages.map((m: any) => `${m.role}: ${m.content}`).join('\n')}

Please extract:
1. Company description
2. Unique selling points (as array)
3. Ideal candidate profile (structured)
4. Hiring criteria (structured)
5. Deal breakers (as array)
6. Compensation range (structured)
7. Work environment
8. Culture values (as array)
9. Questions to ask candidates (as array)
10. Objection handlers (structured)
11. Appointment preferences (structured)

Format as JSON with keys: company_description, unique_selling_points, ideal_candidate_profile, hiring_criteria, deal_breakers, compensation_range, work_environment, culture_values, questions_to_ask, objection_handlers, appointment_preferences`;

      const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          max_tokens: 4096,
          messages: [
            { 
              role: 'user', 
              content: `You are a data extraction assistant. Extract structured information from conversations.\n\n${summaryPrompt}` 
            }
          ],
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('Anthropic API error:', aiResponse.status, errorText);
        throw new Error(`Anthropic API error: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      const extractedData = JSON.parse(aiData.content[0].text);

      // Update profile with extracted data
      const { error: updateError } = await supabase
        .from('client_business_profiles')
        .update({
          company_description: extractedData.company_description,
          unique_selling_points: extractedData.unique_selling_points,
          ideal_candidate_profile: extractedData.ideal_candidate_profile,
          hiring_criteria: extractedData.hiring_criteria,
          deal_breakers: extractedData.deal_breakers,
          compensation_range: extractedData.compensation_range,
          work_environment: extractedData.work_environment,
          culture_values: extractedData.culture_values,
          typical_questions: extractedData.questions_to_ask,
          objection_handlers: extractedData.objection_handlers,
          appointment_booking_preferences: extractedData.appointment_preferences,
          completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        throw updateError;
      }

      const completionMessage = wantDetailed 
        ? "Perfect! I've learned everything I need to know about your business. I'm now ready to help you qualify leads, handle objections, and book appointments. Your AI recruiting assistant is live and ready to work!"
        : "Setup complete! You can start matching now. You can add more details anytime from your dashboard settings to improve matching and AI performance.";

      return new Response(
        JSON.stringify({
          completed: true,
          message: completionMessage,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return next question
    const nextQuestion = questionsList[questionCount];

    return new Response(
      JSON.stringify({
        completed: false,
        message: nextQuestion,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in ai-onboarding-chat:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

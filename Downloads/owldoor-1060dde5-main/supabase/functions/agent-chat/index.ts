import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, action, sessionId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    // Get IP address and user agent for tracking
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    
    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Track or update session using agent_sessions table
    let currentSession;
    if (sessionId) {
      // Get existing session
      const { data: session } = await supabase
        .from('agent_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();
      
      currentSession = session;
      
      // Update question count
      if (session) {
        const newQuestionCount = (session.question_count || 0) + 1;
        await supabase
          .from('agent_sessions')
          .update({
            question_count: newQuestionCount,
            requires_signup: newQuestionCount >= 5,
            updated_at: new Date().toISOString()
          })
          .eq('session_id', sessionId);
        
        currentSession.question_count = newQuestionCount;
        currentSession.requires_signup = newQuestionCount >= 5;
      }
    } else {
      // Create new session with unique session_id
      const newSessionId = crypto.randomUUID();
      const { data: newSession } = await supabase
        .from('agent_sessions')
        .insert({
          session_id: newSessionId,
          question_count: 1,
          verified: false
        })
        .select()
        .single();
      
      currentSession = newSession;
    }
    
    // Check if verification is required (after 2 questions)
    if (currentSession && currentSession.question_count >= 2 && !currentSession.verified) {
      return new Response(
        JSON.stringify({
          message: "To continue chatting, please verify your phone number.",
          sessionId: currentSession.session_id,
          questionsRemaining: 0,
          requiresVerification: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if signup is required
    if (currentSession?.requires_signup) {
      return new Response(
        JSON.stringify({
          message: "I'd love to continue helping you! To keep chatting, please sign up for a free account. It only takes a minute and you'll get access to our full platform where you can match with qualified leads.",
          requiresSignup: true,
          sessionId: currentSession.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Handle support ticket creation
    if (action === 'create_ticket') {
      const { subject, message } = await req.json();
      
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          subject,
          message,
          status: 'open',
          priority: 'medium'
        });

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, message: 'Support ticket created' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get training data for context
    const { data: trainingData } = await supabase
      .from('ai_training_data')
      .select('question, answer')
      .eq('is_answered', true)
      .order('created_at', { ascending: false })
      .limit(20);

    const trainingContext = trainingData && trainingData.length > 0
      ? '\n\nAdditional training from our team:\n' + trainingData.map(t => `Q: ${t.question}\nA: ${t.answer}`).join('\n\n')
      : '';

    // AI Chat
    const systemPrompt = `You are a helpful AI assistant for OwlDoor, a lead generation platform for real estate agents.

Your job is to:
1. Answer questions about how OwlDoor works using the information below and any training data provided
2. If you can't answer a question confidently, respond: "That question is above my pay grade, let me pass this along to a higher-up. Can I at least match you to a Team so you see how we work?"
3. Guide the conversation to gather agent information: name, email, phone, years of experience, brokerage name

Key information about OwlDoor:
- We match real estate agents with qualified buyer and seller leads
- Agents can bid on leads based on their expertise and service area
- We provide a CRM system for managing leads and client relationships
- Agents can import their existing client base
- We offer different pricing packages and credit systems
${trainingContext}

Keep responses conversational, friendly, and focused on moving towards gathering their information to create an agent profile.`;

    // Check if this is a complex question that might need admin input
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    const isComplexQuestion = lastUserMessage.length > 50 && 
      (lastUserMessage.includes('how') || lastUserMessage.includes('what') || 
       lastUserMessage.includes('why') || lastUserMessage.includes('when'));

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service unavailable. Please try again later.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // If the AI says it's above its pay grade, save the question for admin review
    if (aiResponse.includes('above my pay grade') && isComplexQuestion) {
      await supabase
        .from('ai_training_data')
        .insert({
          question: lastUserMessage,
          category: 'agent_question',
          is_answered: false
        });
    }
    
    return new Response(
      JSON.stringify({ 
        message: aiResponse,
        sessionId: currentSession?.session_id,
        questionsRemaining: Math.max(0, 5 - (currentSession?.question_count || 0)),
        requiresVerification: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in agent-chat function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

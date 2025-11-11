import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  assignmentId: string;
  proId: string;
  message: string;
  isClientTakeover?: boolean;
}

serve(async (req) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Rate limiting by IP for campaign chat - max 30 messages per hour per IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    const { data: canProceed, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      p_identifier: clientIp,
      p_endpoint: 'ai-campaign-chat',
      p_max_requests: 30,
      p_window_minutes: 60
    });

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
    }

    if (canProceed === false) {
      return new Response(
        JSON.stringify({ 
          error: 'Too many messages. Please try again later.',
          retryAfter: 3600 
        }),
        { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { assignmentId, proId, message, isClientTakeover }: ChatRequest = await req.json();

    // Get campaign assignment and template
    const { data: assignment, error: assignmentError } = await supabase
      .from('campaign_assignments')
      .select(`
        *,
        campaign_templates (
          ai_system_prompt,
          ai_fallback_notify_email,
          ai_fallback_notify_sms,
          clients (
            id,
            company_name,
            email,
            phone
          )
        )
      `)
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      throw new Error('Campaign assignment not found');
    }

    // Get conversation history
    const { data: conversationHistory, error: historyError } = await supabase
      .from('campaign_responses')
      .select('message_content, response_from')
      .eq('assignment_id', assignmentId)
      .order('sent_at', { ascending: true });

    if (historyError) throw historyError;

    // If client is taking over, notify and store the takeover
    if (isClientTakeover) {
      await supabase
        .from('campaign_assignments')
        .update({ 
          ai_handed_off: true,
          ai_handoff_at: new Date().toISOString()
        })
        .eq('id', assignmentId);

      // Log the takeover
      await supabase
        .from('campaign_responses')
        .insert({
          assignment_id: assignmentId,
          pro_id: proId,
          message_content: '[Client took over conversation]',
          response_from: 'system',
          sent_at: new Date().toISOString(),
        });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Client has taken over the conversation',
          takeoverComplete: true
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Build conversation context for AI
    const messages = [
      {
        role: 'system',
        content: assignment.campaign_templates.ai_system_prompt || 'You are a helpful AI assistant.'
      },
      ...conversationHistory.map((msg: any) => ({
        role: msg.response_from === 'pro' ? 'user' : 'assistant',
        content: msg.message_content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error('AI rate limit exceeded. Please try again later.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI service payment required. Please add credits to your workspace.');
      }
      throw new Error('AI service error');
    }

    const aiData = await aiResponse.json();
    const aiMessage = aiData.choices[0].message.content;

    // Store the AI response
    await supabase
      .from('campaign_responses')
      .insert({
        assignment_id: assignmentId,
        pro_id: proId,
        message_content: aiMessage,
        response_from: 'ai',
        sent_at: new Date().toISOString(),
      });

    // Check if we should notify client (after 5+ exchanges)
    const exchangeCount = conversationHistory.length + 1;
    if (exchangeCount >= 5 && !assignment.ai_handed_off) {
      const client = assignment.campaign_templates.clients;
      
      // Notify client via email
      if (assignment.campaign_templates.ai_fallback_notify_email && client.email) {
        await supabase.functions.invoke('send-email-sendgrid', {
          body: {
            to: client.email,
            subject: 'AI Qualification Ready for Review',
            html: `<p>The AI has gathered enough information about a recruit. <a href="${supabaseUrl}/client-campaigns">Review the conversation</a> and take over when ready.</p>`,
          }
        });
      }

      // Notify client via SMS
      if (assignment.campaign_templates.ai_fallback_notify_sms && client.phone) {
        await supabase.functions.invoke('send-sms-provider', {
          body: {
            to: client.phone,
            message: `AI has qualified a recruit. Review and take over the conversation at ${supabaseUrl}/client-campaigns`,
          }
        });
      }

      // Mark as ready for handoff
      await supabase
        .from('campaign_assignments')
        .update({ ai_ready_for_handoff: true })
        .eq('id', assignmentId);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: aiMessage,
        exchangeCount,
        readyForHandoff: exchangeCount >= 5
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in ai-campaign-chat:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
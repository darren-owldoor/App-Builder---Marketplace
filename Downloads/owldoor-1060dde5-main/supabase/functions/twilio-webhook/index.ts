import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse Twilio webhook data
    const formData = await req.formData();
    const conversationSid = formData.get('ConversationSid') as string;
    const author = formData.get('Author') as string;
    const body = formData.get('Body') as string;
    const messageSid = formData.get('MessageSid') as string;
    
    console.log('Twilio webhook received:', { conversationSid, author, body, messageSid });

    // Get the conversation from our database using conversation_sid
    const { data: aiLead, error: leadError } = await supabase
      .from('ai_leads')
      .select('*, clients!inner(*, ai_config(*))')
      .eq('conversation_sid', conversationSid)
      .single();

    if (leadError || !aiLead) {
      console.error('Lead not found for conversation:', conversationSid, leadError);
      return new Response('OK', { status: 200 });
    }

    // Determine sender type (lead vs ai/client)
    const isFromLead = author === aiLead.phone;
    const senderType = isFromLead ? 'lead' : 'client';

    // Store message in database
    const { error: messageError } = await supabase
      .from('ai_messages')
      .insert({
        lead_id: aiLead.id,
        client_id: aiLead.client_id,
        conversation_id: aiLead.phone,
        sender_type: senderType,
        content: body,
        twilio_message_sid: messageSid,
      });

    if (messageError) {
      console.error('Error storing message:', messageError);
    }

    // If message is from lead and AI is enabled, trigger AI response
    const aiConfig = aiLead.clients.ai_config?.[0];
    if (isFromLead && aiConfig?.ai_enabled) {
      console.log('Triggering AI response for lead message');
      
      // Get recent conversation history
      const { data: messages } = await supabase
        .from('ai_messages')
        .select('sender_type, content, created_at')
        .eq('lead_id', aiLead.id)
        .order('created_at', { ascending: false })
        .limit(10);

      const conversationHistory = messages
        ?.reverse()
        .map(m => `${m.sender_type === 'lead' ? 'Lead' : 'AI'}: ${m.content}`)
        .join('\n') || '';

      // Call AI to generate response
      const aiResponse = await generateAIResponse(body, conversationHistory, aiLead.clients);

      // Send AI response via Twilio
      if (aiResponse) {
        await sendTwilioMessage(
          conversationSid,
          aiResponse,
          aiConfig.twilio_phone_number
        );

        // Store AI response
        await supabase
          .from('ai_messages')
          .insert({
            lead_id: aiLead.id,
            client_id: aiLead.client_id,
            conversation_id: aiLead.phone,
            sender_type: 'ai',
            content: aiResponse,
          });
      }
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response('OK', { status: 200 }); // Always return 200 to Twilio
  }
});

async function generateAIResponse(
  message: string,
  conversationHistory: string,
  client: any
): Promise<string | null> {
  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OpenAI API key not found');
      return null;
    }

    const aiConfig = client.ai_config?.[0];
    const personality = aiConfig?.ai_personality || 'professional_friendly';
    const systemPrompt = getSystemPrompt(personality, client);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `Previous conversation:\n${conversationHistory}\n\nNew message: ${message}\n\nRespond naturally and helpfully.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error('Error generating AI response:', error);
    return null;
  }
}

function getSystemPrompt(personality: string, client: any): string {
  const companyName = client.company_name || 'our company';
  
  const basePrompt = `You are an AI recruiting assistant for ${companyName}. You're helping to recruit real estate agents to join the brokerage. Be conversational, helpful, and professional.

Key points to cover:
- Competitive commission splits
- Lead generation support
- Training and mentorship programs
- Team culture and growth opportunities

Your goal is to qualify leads and get them interested in scheduling a call with the recruiting team.`;

  if (personality === 'casual_friendly') {
    return basePrompt + '\n\nTone: Casual and friendly, like talking to a friend.';
  } else if (personality === 'professional_warm') {
    return basePrompt + '\n\nTone: Professional but warm and approachable.';
  }
  
  return basePrompt + '\n\nTone: Professional and friendly.';
}

async function sendTwilioMessage(
  conversationSid: string,
  message: string,
  fromNumber: string
): Promise<void> {
  const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');

  if (!twilioAccountSid || !twilioAuthToken) {
    console.error('Twilio credentials not found');
    return;
  }

  try {
    const response = await fetch(
      `https://conversations.twilio.com/v1/Conversations/${conversationSid}/Messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          Author: fromNumber,
          Body: message,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to send Twilio message:', error);
    } else {
      console.log('Message sent successfully via Twilio');
    }
  } catch (error) {
    console.error('Error sending Twilio message:', error);
  }
}

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

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const { leadId, message } = await req.json();

    if (!leadId || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Get lead and client info
    const { data: aiLead, error: leadError } = await supabase
      .from('ai_leads')
      .select('*, clients(id, user_id), ai_config:clients!inner(twilio_phone_number)')
      .eq('id', leadId)
      .single();

    if (leadError || !aiLead) {
      console.error('Lead fetch error:', leadError);
      return new Response(JSON.stringify({ error: 'Lead not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // Verify user has access to this client
    if (aiLead.clients.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    
    // Get twilio phone number from ai_config
    const { data: aiConfig } = await supabase
      .from('ai_config')
      .select('twilio_phone_number')
      .eq('client_id', aiLead.client_id)
      .single();

    const twilioPhoneNumber = aiConfig?.twilio_phone_number;

    if (!twilioAccountSid || !twilioAuthToken) {
      console.error('Twilio credentials not configured');
      return new Response(JSON.stringify({ error: 'Twilio credentials not configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    if (!twilioPhoneNumber) {
      console.error('Twilio phone number not configured for client');
      return new Response(JSON.stringify({ error: 'Please configure your Twilio phone number in AI Settings first' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Create or get conversation
    let conversationSid = aiLead.conversation_sid;
    
    if (!conversationSid) {
      // Create new conversation
      conversationSid = await createConversation(
        twilioAccountSid,
        twilioAuthToken,
        aiLead.phone,
        twilioPhoneNumber
      );

      if (!conversationSid) {
        return new Response(JSON.stringify({ error: 'Failed to create conversation' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }

      // Update lead with conversation_sid
      await supabase
        .from('ai_leads')
        .update({ conversation_sid: conversationSid })
        .eq('id', leadId);
    }

    // Send message via Twilio Conversations
    const messageSent = await sendMessage(
      twilioAccountSid,
      twilioAuthToken,
      conversationSid,
      twilioPhoneNumber,
      message
    );

    if (!messageSent) {
      return new Response(JSON.stringify({ error: 'Failed to send message' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Store message in database
    await supabase
      .from('ai_messages')
      .insert({
        lead_id: leadId,
        client_id: aiLead.client_id,
        conversation_id: aiLead.phone,
        sender_type: 'client',
        content: message,
      });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function createConversation(
  accountSid: string,
  authToken: string,
  leadPhone: string,
  twilioNumber: string
): Promise<string | null> {
  try {
    // Create conversation
    const createResponse = await fetch(
      `https://conversations.twilio.com/v1/Conversations`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          FriendlyName: `Conversation with ${leadPhone}`,
        }),
      }
    );

    if (!createResponse.ok) {
      console.error('Failed to create conversation:', await createResponse.text());
      return null;
    }

    const conversation = await createResponse.json();
    const conversationSid = conversation.sid;

    // Add lead as SMS participant
    await fetch(
      `https://conversations.twilio.com/v1/Conversations/${conversationSid}/Participants`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'MessagingBinding.Address': leadPhone,
          'MessagingBinding.ProxyAddress': twilioNumber,
        }),
      }
    );

    console.log('Conversation created:', conversationSid);
    return conversationSid;
  } catch (error) {
    console.error('Error creating conversation:', error);
    return null;
  }
}

async function sendMessage(
  accountSid: string,
  authToken: string,
  conversationSid: string,
  author: string,
  body: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://conversations.twilio.com/v1/Conversations/${conversationSid}/Messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          Author: author,
          Body: body,
        }),
      }
    );

    if (!response.ok) {
      console.error('Failed to send message:', await response.text());
      return false;
    }

    console.log('Message sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
}

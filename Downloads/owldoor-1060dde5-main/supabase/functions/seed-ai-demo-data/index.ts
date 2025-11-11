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

    // Get client for this user
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!client) {
      return new Response(JSON.stringify({ error: 'Client not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // Demo recruits data with real phone numbers
    const demoRecruits = [
      {
        phone: '+18588886399',
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah.j@example.com',
        match_score: 85,
        status: 'engaged',
        messages: [
          { sender: 'lead', content: 'Hi, I saw your team is hiring. Can you tell me more about the opportunity?' },
          { sender: 'ai', content: 'Hi Sarah! Thanks for reaching out. We have exciting opportunities for motivated real estate agents. What are you most interested in learning about?' },
          { sender: 'lead', content: 'What kind of commission splits do you offer?' },
          { sender: 'ai', content: 'Great question! Our commission structure is competitive and can vary based on your experience level. Can we schedule a quick call to discuss the details and find the best fit for you?' },
        ]
      },
      {
        phone: '+14806757855',
        first_name: 'Michael',
        last_name: 'Chen',
        email: 'michael.chen@example.com',
        match_score: 72,
        status: 'new',
        messages: [
          { sender: 'lead', content: 'Hey, I\'m interested in learning more about joining your brokerage' },
          { sender: 'ai', content: 'Welcome Michael! We\'d love to tell you more about our team. How many years of experience do you have in real estate?' },
        ]
      },
      {
        phone: '+13022373677',
        first_name: 'Jennifer',
        last_name: 'Martinez',
        email: 'jen.martinez@example.com',
        match_score: 91,
        status: 'appointment_set',
        messages: [
          { sender: 'lead', content: 'I\'m currently with another brokerage but exploring my options' },
          { sender: 'ai', content: 'Thanks for considering us, Jennifer! What\'s most important to you in your next brokerage?' },
          { sender: 'lead', content: 'Better lead generation and support' },
          { sender: 'ai', content: 'Those are two of our strongest areas! We provide exclusive leads and dedicated support. Would you like to schedule a call to learn more?' },
          { sender: 'lead', content: 'Yes, that would be great' },
          { sender: 'ai', content: 'Perfect! I\'ll have someone from our team reach out to schedule a time that works for you.' },
        ]
      }
    ];

    const createdMatches = [];

    // Create pros and matches
    for (const demoRecruit of demoRecruits) {
      const { phone, first_name, last_name, email, match_score, status, messages } = demoRecruit;
      
      // Create or get pro
      const { data: pro, error: proError } = await supabase
        .from('pros')
        .upsert({
          phone,
          first_name,
          last_name,
          full_name: `${first_name} ${last_name}`,
          email,
          pipeline_stage: 'match_ready',
        }, {
          onConflict: 'phone',
        })
        .select()
        .single();

      if (proError) {
        console.error('Error creating pro:', proError);
        continue;
      }

      // Create purchased match
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .insert({
          client_id: client.id,
          pro_id: pro.id,
          match_score: match_score,
          status: status,
          purchased: true,
          cost: 50,
          auto_charged_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (matchError) {
        console.error('Error creating match:', matchError);
        continue;
      }

      createdMatches.push(match);

      // Create messages linked to match
      const conversationId = `${phone}-demo`;
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        await supabase
          .from('ai_messages')
          .insert({
            lead_id: match.id, // Using match.id as lead_id
            client_id: client.id,
            conversation_id: conversationId,
            sender_type: msg.sender,
            content: msg.content,
            created_at: new Date(Date.now() - (messages.length - i) * 3600000).toISOString(),
          });
      }
    }

    // Create AI config if it doesn't exist
    await supabase
      .from('ai_config')
      .upsert({
        client_id: client.id,
        ai_enabled: true,
        twilio_phone_number: '+15555551234',
        ai_personality: 'professional_friendly',
        escalate_after_messages: 5,
      }, {
        onConflict: 'client_id',
      });

    return new Response(JSON.stringify({ 
      success: true, 
      matches_created: createdMatches.length,
      message: 'Demo data seeded successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error seeding demo data:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

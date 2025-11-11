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
    const { action, messages, trainingId, answer, leadId, clientId, conversationId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Handle AI-assisted matching
    if (action === 'suggest_match') {
      const { data: lead } = await supabase
        .from('pros')
        .select('*')
        .eq('id', leadId)
        .single();

      const { data: clients } = await supabase
        .from('clients')
        .select(`
          *,
          pricing_packages:current_package_id (
            price_per_lead,
            lead_pricing_rules
          )
        `)
        .eq('active', true);

      if (!lead || !clients) {
        return new Response(
          JSON.stringify({ error: 'Lead or clients not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      // Filter clients who have enough credits to buy leads
      const eligibleClients = clients.filter(client => {
        const pricePerLead = client.pricing_packages?.price_per_lead || 0;
        return client.credits_balance >= pricePerLead;
      });

      return new Response(
        JSON.stringify({ 
          lead, 
          clients: eligibleClients,
          message: 'Use this data to suggest the best client match for this lead. Consider location overlap, experience, preferences, AND IMPORTANTLY - only these clients have enough credits to purchase this lead. Provide a match score and reasoning.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle creating a match based on AI recommendation
    if (action === 'create_match') {
      // First, verify the client has enough credits
      const { data: client } = await supabase
        .from('clients')
        .select(`
          credits_balance,
          pricing_packages:current_package_id (
            price_per_lead,
            lead_pricing_rules
          )
        `)
        .eq('id', clientId)
        .single();

      if (!client) {
        return new Response(
          JSON.stringify({ error: 'Client not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      const pricePerLead = client.pricing_packages?.price_per_lead || 0;
      
      if (client.credits_balance < pricePerLead) {
        return new Response(
          JSON.stringify({ 
            error: 'Insufficient credits',
            message: `Client needs ${pricePerLead} credits but only has ${client.credits_balance}` 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Create the match
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .insert({
          lead_id: leadId,
          client_id: clientId,
          match_score: 85,
          status: 'pending',
          notes: 'AI-assisted match created by admin',
          purchase_amount: pricePerLead
        })
        .select()
        .single();

      if (matchError) throw matchError;

      return new Response(
        JSON.stringify({ success: true, match }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle saving training data
    if (action === 'save_training') {
      const { error } = await supabase
        .from('ai_training_data')
        .update({
          answer,
          is_answered: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', trainingId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get unanswered questions
    if (action === 'get_unanswered') {
      const { data, error } = await supabase
        .from('ai_training_data')
        .select('*')
        .eq('is_answered', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return new Response(
        JSON.stringify({ questions: data || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all training data for context
    if (action === 'get_training_context') {
      const { data, error } = await supabase
        .from('ai_training_data')
        .select('question, answer')
        .eq('is_answered', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return new Response(
        JSON.stringify({ trainingData: data || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // AI Chat for admin training
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Get AI prompts for blog page if they exist
    const { data: blogPrompts } = await supabase
      .from('ai_prompts')
      .select('prompt_content')
      .eq('prompt_type', 'page')
      .eq('target_name', 'blog')
      .maybeSingle();

    const systemPrompt = `You are an AI assistant helping the admin with OwlDoor operations.

Your job is to:
1. Help the admin formulate good answers to agent questions
2. Suggest how to explain OwlDoor's features and processes
3. Perform lead-to-client matching based on criteria like location, experience, and qualifications
4. Ask for feedback when you can't confidently make a match
5. **CREATE BLOG POSTS** when asked by using the create_blog_post tool
6. Keep responses conversational and helpful

${blogPrompts?.prompt_content ? `\n**Blog Publishing Guidelines:**\n${blogPrompts.prompt_content}\n` : ''}

For matching leads to clients:
- Consider geographic overlap (cities, states, zip codes)
- Evaluate experience levels and qualifications
- Match based on client preferences and lead attributes
- If uncertain, ask the admin for guidance with specific reasons why you're uncertain
- Suggest match scores and reasoning for your recommendations

**IMPORTANT**: When the admin asks you to create a blog post, use the create_blog_post tool to save it to the database.

Be supportive and help the admin build a comprehensive knowledge base and efficient matching process.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "create_blog_post",
          description: "Create a new blog post with the given details",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "The blog post title" },
              slug: { type: "string", description: "URL-friendly slug (e.g., 'my-blog-post')" },
              excerpt: { type: "string", description: "Short excerpt/summary" },
              content: { type: "string", description: "Full HTML content of the post" },
              tags: { type: "array", items: { type: "string" }, description: "Tags for the post" },
              status: { type: "string", enum: ["draft", "published"], description: "Post status" },
              featured_image_url: { type: "string", description: "URL of featured image (optional)" }
            },
            required: ["title", "slug", "excerpt", "content", "status"]
          }
        }
      }
    ];

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
        tools,
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
    const choice = data.choices[0];
    
    // Check if AI wants to use a tool
    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      
      if (toolCall.function.name === 'create_blog_post') {
        const blogData = JSON.parse(toolCall.function.arguments);
        
        // Generate featured image using AI
        let featuredImageUrl = blogData.featured_image_url;
        
        if (!featuredImageUrl) {
          try {
            const imagePrompt = `Create a professional, high-quality featured image for a blog post titled "${blogData.title}". The image should be visually appealing, modern, and relevant to real estate/business. Style: professional, clean, with good contrast and engaging composition. 16:9 aspect ratio.`;
            
            const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash-image-preview',
                messages: [
                  {
                    role: 'user',
                    content: imagePrompt
                  }
                ],
                modalities: ['image', 'text']
              }),
            });

            if (imageResponse.ok) {
              const imageData = await imageResponse.json();
              const generatedImage = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
              if (generatedImage) {
                featuredImageUrl = generatedImage;
              }
            }
          } catch (imageError) {
            console.error('Error generating image:', imageError);
            // Continue without image if generation fails
          }
        }
        
        // Create the blog post
        const { error: blogError } = await supabase
          .from('blog_posts')
          .insert({
            ...blogData,
            featured_image_url: featuredImageUrl,
            author_id: userId,
            published_at: blogData.status === 'published' ? new Date().toISOString() : null
          });

        if (blogError) {
          return new Response(
            JSON.stringify({ 
              message: `I tried to create the blog post but encountered an error: ${blogError.message}. Would you like me to try again?`,
              blogPostCreated: false 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ 
            message: `✅ Blog post "${blogData.title}" has been created successfully${featuredImageUrl ? ' with a generated featured image' : ''}! ${blogData.status === 'published' ? 'It\'s now live on your blog.' : 'It\'s saved as a draft.'}`,
            blogPostCreated: true 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    return new Response(
      JSON.stringify({ message: choice.message.content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in admin-ai-chat function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

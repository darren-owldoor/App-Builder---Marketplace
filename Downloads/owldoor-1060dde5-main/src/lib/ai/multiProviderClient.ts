import { supabase } from "@/integrations/supabase/client";

export type AIProvider = 'lovable' | 'openai' | 'anthropic';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  messages: AIMessage[];
  provider?: AIProvider;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface AIResponse {
  content: string;
  provider: AIProvider;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Multi-provider AI client for semantic matching and general AI tasks
 * 
 * Providers:
 * - lovable: Fast, cost-effective (Gemini 2.5 Flash)
 * - openai: GPT-5-nano for quick tasks, GPT-5 for complex reasoning
 * - anthropic: Claude Sonnet 4.5 for superior reasoning
 * 
 * Use cases:
 * - Semantic field matching: Compare text descriptions (Lovable AI)
 * - Profile analysis: Analyze fit between profiles (Claude)
 * - Quick classifications: Fast categorization (GPT-5-nano)
 */
export class MultiProviderAI {
  /**
   * Call AI with automatic provider selection based on task
   */
  static async chat(request: AIRequest): Promise<AIResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat-multi', {
        body: request,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('AI Chat Error:', error);
      throw error;
    }
  }

  /**
   * Fast semantic matching using Lovable AI (Gemini 2.5 Flash)
   * Best for: Field comparisons, basic similarity checks
   */
  static async semanticMatch(
    text1: string,
    text2: string,
    context?: string
  ): Promise<{ score: number; reasoning: string }> {
    const systemPrompt = `You are a semantic matching expert. Compare two text descriptions and return a match score from 0-100.
${context ? `\nContext: ${context}` : ''}

Return your response in this exact JSON format:
{
  "score": <number 0-100>,
  "reasoning": "<brief explanation>"
}`;

    const response = await this.chat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Text 1: ${text1}\n\nText 2: ${text2}\n\nProvide match score and reasoning.` }
      ],
      provider: 'lovable',
      model: 'google/gemini-2.5-flash',
      temperature: 0.3,
      max_tokens: 200,
    });

    try {
      const parsed = JSON.parse(response.content);
      return {
        score: Math.min(100, Math.max(0, parsed.score)),
        reasoning: parsed.reasoning,
      };
    } catch {
      // Fallback if JSON parsing fails
      return {
        score: 50,
        reasoning: 'Unable to parse AI response',
      };
    }
  }

  /**
   * Fast classification using OpenAI GPT-5-nano
   * Best for: Quick categorization, simple yes/no decisions
   */
  static async quickClassify(
    text: string,
    categories: string[]
  ): Promise<string> {
    const response = await this.chat({
      messages: [
        { role: 'system', content: `Classify the following text into one of these categories: ${categories.join(', ')}. Reply with only the category name.` },
        { role: 'user', content: text }
      ],
      provider: 'openai',
      model: 'gpt-5-nano-2025-08-07',
      temperature: 0.1,
      max_tokens: 50,
    });

    return response.content.trim();
  }

  /**
   * Deep analysis using Claude Sonnet 4.5
   * Best for: Complex reasoning, profile analysis, detailed comparisons
   */
  static async deepAnalysis(
    prompt: string,
    systemPrompt?: string
  ): Promise<string> {
    const response = await this.chat({
      messages: [
        { role: 'system', content: systemPrompt || 'You are an expert analyst. Provide detailed, accurate analysis.' },
        { role: 'user', content: prompt }
      ],
      provider: 'anthropic',
      model: 'claude-sonnet-4-5',
      temperature: 0.7,
      max_tokens: 2000,
    });

    return response.content;
  }

  /**
   * General purpose chat with provider choice
   */
  static async generalChat(
    messages: AIMessage[],
    provider: AIProvider = 'lovable'
  ): Promise<string> {
    const response = await this.chat({
      messages,
      provider,
    });

    return response.content;
  }
}

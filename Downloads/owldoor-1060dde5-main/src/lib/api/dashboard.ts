import { supabase } from "@/integrations/supabase/client";
import { apiClient } from './client';

export interface Pro {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  pro_type: 'real_estate_agent' | 'mortgage_officer';
  profile_completeness: number;
  profile_photo?: string;
  city?: string;
  state?: string;
  zip_codes?: string[];
  experience?: number;
  transactions?: number;
  wants?: string[];
  specializations?: string[];
  pipeline_stage: string;
  open_to_company_offers?: boolean;
}

export interface Match {
  id: string;
  pro_id: string;
  client_id: string;
  match_score: number;
  match_type: string;
  status: string;
  created_at: string;
  client?: any;
}

export interface ProfileCompletionData {
  completion: number;
  missing: string[];
  next: any | null;
  timeEstimate: string;
  rewards: Array<{
    unlocked: boolean;
    text: string;
  }>;
}

class DashboardAPI {
  async getProProfile(userId: string) {
    const { data, error } = await supabase
      .from('pros')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching pro:', error);
      return { data: null, error };
    }

    return { data: data as Pro, error: null };
  }

  async getProfileCompletion(proId: string): Promise<ProfileCompletionData> {
    const { data: pro } = await supabase
      .from('pros')
      .select('*')
      .eq('id', proId)
      .single();

    if (!pro) {
      return {
        completion: 0,
        missing: [],
        next: null,
        timeEstimate: '',
        rewards: [],
      };
    }

    const fieldPriority = [
      {
        field: 'experience',
        weight: 20,
        question: 'How many years of experience do you have?',
        type: 'number',
        options: [
          { label: 'Less than 1 year', value: 0 },
          { label: '1-3 years', value: 2 },
          { label: '4-7 years', value: 5 },
          { label: '8+ years', value: 10 }
        ],
        timeEstimate: '10 seconds'
      },
      {
        field: 'transactions',
        weight: 15,
        question: 'How many deals did you close last year?',
        type: 'number',
        options: [
          { label: '0-5 deals', value: 3 },
          { label: '6-12 deals', value: 9 },
          { label: '13-25 deals', value: 19 },
          { label: '26+ deals', value: 30 }
        ],
        timeEstimate: '10 seconds'
      },
      {
        field: 'wants',
        weight: 18,
        question: "What's most important to you in a brokerage?",
        type: 'array',
        requiresModal: true,
        options: [], // Empty options forces modal to show
        timeEstimate: '15 seconds'
      },
      {
        field: 'specializations',
        weight: 12,
        question: 'What type of properties do you focus on?',
        type: 'array',
        options: [
          { label: 'Residential', value: 'Residential' },
          { label: 'Commercial', value: 'Commercial' },
          { label: 'Luxury', value: 'Luxury' },
          { label: 'First-Time Buyers', value: 'First Time Buyers' }
        ],
        timeEstimate: '15 seconds'
      },
      {
        field: 'city',
        weight: 10,
        question: 'What city do you primarily work in?',
        type: 'text',
        options: [],
        timeEstimate: '20 seconds'
      }
    ];

    let score = 0;
    const missing: string[] = [];

    for (const field of fieldPriority) {
      if (pro[field.field] && (!Array.isArray(pro[field.field]) || pro[field.field].length > 0)) {
        score += field.weight;
      } else {
        missing.push(field.field);
      }
    }

    const nextField = fieldPriority.find((f) => missing.includes(f.field));

    const rewards = [
      { unlocked: score >= 25, text: 'Basic profile visibility' },
      { unlocked: score >= 50, text: 'Show in search results' },
      { unlocked: score >= 75, text: 'See all company matches' },
      { unlocked: score >= 100, text: 'Priority placement' },
    ];

    return {
      completion: score,
      missing,
      next: nextField || null,
      timeEstimate: nextField ? nextField.timeEstimate : '',
      rewards,
    };
  }

  async getMatches(proId: string) {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        client:clients(*)
      `)
      .eq('pro_id', proId)
      .order('match_score', { ascending: false });

    if (error) {
      console.error('Error fetching matches:', error);
      return { data: null, error };
    }

    return { data: data as any, error: null };
  }

  async updateProField(proId: string, field: string, value: any) {
    const { data, error } = await supabase
      .from('pros')
      .update({ 
        [field]: value,
        updated_at: new Date().toISOString(),
      })
      .eq('id', proId)
      .select()
      .single();

    if (error) {
      console.error('Error updating pro:', error);
      return { data: null, error };
    }

    await this.recalculateProfileCompleteness(proId);

    return { data, error: null };
  }

  async recalculateProfileCompleteness(proId: string) {
    const completion = await this.getProfileCompletion(proId);
    
    await supabase
      .from('pros')
      .update({ profile_completeness: completion.completion })
      .eq('id', proId);

    return completion.completion;
  }

  async markMatchViewed(matchId: string) {
    return await supabase
      .from('matches')
      .update({ 
        status: 'viewed',
        viewed_at: new Date().toISOString(),
      })
      .eq('id', matchId);
  }

  async updateMatchStatus(
    matchId: string,
    status: 'pending' | 'active' | 'purchased' | 'rejected'
  ) {
    return await supabase
      .from('matches')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', matchId);
  }

  async triggerAutoMatch(proId: string) {
    return apiClient.post('auto-match-leads', { pro_id: proId });
  }

  async updatePipelineStage(proId: string, stage: string) {
    const { data, error } = await supabase
      .from('pros')
      .update({ 
        pipeline_stage: stage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', proId)
      .select()
      .single();

    if (stage === 'match_ready') {
      await this.triggerAutoMatch(proId);
    }

    return { data, error };
  }
}

export const dashboardAPI = new DashboardAPI();

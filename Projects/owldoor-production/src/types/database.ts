export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      agents: {
        Row: {
          created_at: string;
          data: Json;
          email: string | null;
          full_name: string;
          id: string;
          is_active: boolean | null;
          is_verified: boolean | null;
          last_name: string;
          match_score: number | null;
          phone: string | null;
          pipeline_stage: string | null;
          purchase_count: number | null;
          purchased_by: string[] | null;
          qualification_percent: number | null;
          searchable: string | null;
          searchable_text: string | null;
          state: string | null;
          status: 'active' | 'purchased' | 'archived' | 'pending';
          tags: string[] | null;
          updated_at: string | null;
          years_experience: number | null;
          first_name: string;
          location: string | null;
          city: string | null;
          brokerage: string | null;
        };
        Insert: {
          created_at?: string;
          data?: Json;
          email?: string | null;
          full_name?: never;
          id?: string;
          is_active?: boolean;
          is_verified?: boolean;
          last_name: string;
          match_score?: number;
          phone?: string | null;
          pipeline_stage?: string | null;
          purchase_count?: number;
          purchased_by?: string[] | null;
          qualification_percent?: number;
          searchable?: never;
          searchable_text?: never;
          state?: string | null;
          status?: 'active' | 'purchased' | 'archived' | 'pending';
          tags?: string[] | null;
          updated_at?: string;
          years_experience?: number | null;
          first_name: string;
          location?: never;
          city?: never;
          brokerage?: never;
        };
        Update: {
          created_at?: string;
          data?: Json;
          email?: string | null;
          full_name?: never;
          id?: string;
          is_active?: boolean;
          is_verified?: boolean;
          last_name?: string;
          match_score?: number;
          phone?: string | null;
          pipeline_stage?: string | null;
          purchase_count?: number;
          purchased_by?: string[] | null;
          qualification_percent?: number;
          searchable?: never;
          searchable_text?: never;
          state?: string | null;
          status?: 'active' | 'purchased' | 'archived' | 'pending';
          tags?: string[] | null;
          updated_at?: string;
          years_experience?: number | null;
          first_name?: string;
          location?: never;
          city?: never;
          brokerage?: never;
        };
        Relationships: [];
      };
      appointments: {
        Row: {
          agent_id: string;
          assigned_to: string | null;
          booked_by: 'ai' | 'human';
          booking_method: 'calendly' | 'manual' | 'cronify' | null;
          calendly_cancel_url: string | null;
          calendly_event_id: string | null;
          calendly_event_uri: string | null;
          calendly_reschedule_url: string | null;
          created_at: string;
          description: string | null;
          duration_minutes: number | null;
          id: string;
          scheduled_at: string;
          status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
          team_id: string;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          agent_id: string;
          assigned_to?: string | null;
          booked_by?: 'ai' | 'human';
          booking_method?: 'calendly' | 'manual' | 'cronify' | null;
          calendly_cancel_url?: string | null;
          calendly_event_id?: string | null;
          calendly_event_uri?: string | null;
          calendly_reschedule_url?: string | null;
          created_at?: string;
          description?: string | null;
          duration_minutes?: number | null;
          id?: string;
          scheduled_at: string;
          status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
          team_id: string;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          agent_id?: string;
          assigned_to?: string | null;
          booked_by?: 'ai' | 'human';
          booking_method?: 'calendly' | 'manual' | 'cronify' | null;
          calendly_cancel_url?: string | null;
          calendly_event_id?: string | null;
          calendly_event_uri?: string | null;
          calendly_reschedule_url?: string | null;
          created_at?: string;
          description?: string | null;
          duration_minutes?: number | null;
          id?: string;
          scheduled_at?: string;
          status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
          team_id?: string;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'appointments_agent_id_fkey';
            columns: ['agent_id'];
            referencedRelation: 'agents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'appointments_team_id_fkey';
            columns: ['team_id'];
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          }
        ];
      };
      billing_transactions: {
        Row: {
          agent_id: string | null;
          amount: number;
          credits_added: number | null;
          credits_deducted: number | null;
          created_at: string;
          description: string | null;
          id: string;
          metadata: Json | null;
          payment_id: string | null;
          payment_method: string | null;
          purchase_id: string | null;
          status: 'pending' | 'completed' | 'failed' | 'refunded';
          team_id: string;
          type: 'credit_purchase' | 'agent_purchase' | 'refund' | 'monthly_fee' | 'auto_refill';
        };
        Insert: {
          agent_id?: string | null;
          amount: number;
          credits_added?: number | null;
          credits_deducted?: number | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          payment_id?: string | null;
          payment_method?: string | null;
          purchase_id?: string | null;
          status?: 'pending' | 'completed' | 'failed' | 'refunded';
          team_id: string;
          type: 'credit_purchase' | 'agent_purchase' | 'refund' | 'monthly_fee' | 'auto_refill';
        };
        Update: {
          agent_id?: string | null;
          amount?: number;
          credits_added?: number | null;
          credits_deducted?: number | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          metadata?: Json | null;
          payment_id?: string | null;
          payment_method?: string | null;
          purchase_id?: string | null;
          status?: 'pending' | 'completed' | 'failed' | 'refunded';
          team_id?: string;
          type?: 'credit_purchase' | 'agent_purchase' | 'refund' | 'monthly_fee' | 'auto_refill';
        };
        Relationships: [
          {
            foreignKeyName: 'billing_transactions_agent_id_fkey';
            columns: ['agent_id'];
            referencedRelation: 'agents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'billing_transactions_team_id_fkey';
            columns: ['team_id'];
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          }
        ];
      };
      messages: {
        Row: {
          agent_id: string;
          ai_action: string | null;
          ai_confidence: number | null;
          content: string;
          conversation_id: string | null;
          created_at: string;
          direction: 'inbound' | 'outbound' | null;
          id: string;
          read_at: string | null;
          read_by_human: boolean | null;
          sender_id: string | null;
          sender_type: 'agent' | 'ai' | 'human';
          twilio_sid: string | null;
          twilio_status: string | null;
        };
        Insert: {
          agent_id: string;
          ai_action?: string | null;
          ai_confidence?: number | null;
          content: string;
          conversation_id?: string | null;
          created_at?: string;
          direction?: 'inbound' | 'outbound' | null;
          id?: string;
          read_at?: string | null;
          read_by_human?: boolean | null;
          sender_id?: string | null;
          sender_type: 'agent' | 'ai' | 'human';
          twilio_sid?: string | null;
          twilio_status?: string | null;
        };
        Update: {
          agent_id?: string;
          ai_action?: string | null;
          ai_confidence?: number | null;
          content?: string;
          conversation_id?: string | null;
          created_at?: string;
          direction?: 'inbound' | 'outbound' | null;
          id?: string;
          read_at?: string | null;
          read_by_human?: boolean | null;
          sender_id?: string | null;
          sender_type?: 'agent' | 'ai' | 'human';
          twilio_sid?: string | null;
          twilio_status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_agent_id_fkey';
            columns: ['agent_id'];
            referencedRelation: 'agents';
            referencedColumns: ['id'];
          }
        ];
      };
      purchases: {
        Row: {
          agent_id: string;
          contact_unlocked_at: string | null;
          credits_used: number;
          created_at: string;
          id: string;
          match_score: number | null;
          notes: string | null;
          price_paid: number;
          qualification_percent: number | null;
          source: string | null;
          status: 'active' | 'refunded' | 'disputed';
          team_id: string;
          updated_at: string | null;
        };
        Insert: {
          agent_id: string;
          contact_unlocked_at?: string | null;
          credits_used: number;
          created_at?: string;
          id?: string;
          match_score?: number | null;
          notes?: string | null;
          price_paid: number;
          qualification_percent?: number | null;
          source?: string | null;
          status?: 'active' | 'refunded' | 'disputed';
          team_id: string;
          updated_at?: string | null;
        };
        Update: {
          agent_id?: string;
          contact_unlocked_at?: string | null;
          credits_used?: number;
          created_at?: string;
          id?: string;
          match_score?: number | null;
          notes?: string | null;
          price_paid?: number;
          qualification_percent?: number | null;
          source?: string | null;
          status?: 'active' | 'refunded' | 'disputed';
          team_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'purchases_agent_id_fkey';
            columns: ['agent_id'];
            referencedRelation: 'agents';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'purchases_team_id_fkey';
            columns: ['team_id'];
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          }
        ];
      };
      teams: {
        Row: {
          auto_refill_amount: number | null;
          auto_refill_enabled: boolean | null;
          auto_refill_threshold: number | null;
          created_at: string;
          credits_balance: number | null;
          credits_used: number | null;
          id: string;
          monthly_fee: number | null;
          monthly_spend_limit: number | null;
          plan: 'pay_per_lead' | 'monthly_unlimited' | 'enterprise';
          preferences: Json | null;
          team_id: string;
          team_name: string;
          total_purchased: number | null;
          total_spent: number | null;
          updated_at: string | null;
        };
        Insert: {
          auto_refill_amount?: number | null;
          auto_refill_enabled?: boolean | null;
          auto_refill_threshold?: number | null;
          created_at?: string;
          credits_balance?: number | null;
          credits_used?: number | null;
          id?: string;
          monthly_fee?: number | null;
          monthly_spend_limit?: number | null;
          plan?: 'pay_per_lead' | 'monthly_unlimited' | 'enterprise';
          preferences?: Json | null;
          team_id: string;
          team_name: string;
          total_purchased?: number | null;
          total_spent?: number | null;
          updated_at?: string | null;
        };
        Update: {
          auto_refill_amount?: number | null;
          auto_refill_enabled?: boolean | null;
          auto_refill_threshold?: number | null;
          created_at?: string;
          credits_balance?: number | null;
          credits_used?: number | null;
          id?: string;
          monthly_fee?: number | null;
          monthly_spend_limit?: number | null;
          plan?: 'pay_per_lead' | 'monthly_unlimited' | 'enterprise';
          preferences?: Json | null;
          team_id?: string;
          team_name?: string;
          total_purchased?: number | null;
          total_spent?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      ai_config: {
        Row: {
          ai_enabled: boolean | null;
          auto_enrich_on_create: boolean | null;
          conversation_style: Json | null;
          created_at: string;
          enrichment_enabled: boolean | null;
          id: string;
          integrations: Json | null;
          max_response_length: number | null;
          metrics: Json | null;
          qualification_criteria: Json | null;
          response_tone:
            | 'professional_friendly'
            | 'casual'
            | 'enthusiastic'
            | 'consultative'
            | 'direct';
          team_description: string | null;
          team_id: string;
          team_name: string;
          updated_at: string | null;
          value_proposition: string | null;
          key_benefits: string | null;
          offerings: Json | null;
          enrichment_sources: string[] | null;
          escalation_rules: Json | null;
        };
        Insert: {
          ai_enabled?: boolean | null;
          auto_enrich_on_create?: boolean | null;
          conversation_style?: Json | null;
          created_at?: string;
          enrichment_enabled?: boolean | null;
          id?: string;
          integrations?: Json | null;
          max_response_length?: number | null;
          metrics?: Json | null;
          qualification_criteria?: Json | null;
          response_tone?:
            | 'professional_friendly'
            | 'casual'
            | 'enthusiastic'
            | 'consultative'
            | 'direct';
          team_description?: string | null;
          team_id: string;
          team_name: string;
          updated_at?: string | null;
          value_proposition?: string | null;
          key_benefits?: string | null;
          offerings?: Json | null;
          enrichment_sources?: string[] | null;
          escalation_rules?: Json | null;
        };
        Update: {
          ai_enabled?: boolean | null;
          auto_enrich_on_create?: boolean | null;
          conversation_style?: Json | null;
          created_at?: string;
          enrichment_enabled?: boolean | null;
          id?: string;
          integrations?: Json | null;
          max_response_length?: number | null;
          metrics?: Json | null;
          qualification_criteria?: Json | null;
          response_tone?:
            | 'professional_friendly'
            | 'casual'
            | 'enthusiastic'
            | 'consultative'
            | 'direct';
          team_description?: string | null;
          team_id?: string;
          team_name?: string;
          updated_at?: string | null;
          value_proposition?: string | null;
          key_benefits?: string | null;
          offerings?: Json | null;
          enrichment_sources?: string[] | null;
          escalation_rules?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_config_team_id_fkey';
            columns: ['team_id'];
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          }
        ];
      };
      users: {
        Row: {
          agents_assigned: number | null;
          agents_recruited: number | null;
          appointments_booked: number | null;
          created_at: string;
          email: string;
          first_name: string;
          full_name: string;
          id: string;
          last_active_at: string | null;
          last_name: string;
          permissions: string[] | null;
          phone: string | null;
          photo_url: string | null;
          preferences: Json | null;
          role: 'super_admin' | 'team_owner' | 'team_admin' | 'recruiter' | 'viewer';
          teams: Json | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          agents_assigned?: number | null;
          agents_recruited?: number | null;
          appointments_booked?: number | null;
          created_at?: string;
          email: string;
          first_name: string;
          full_name?: never;
          id?: string;
          last_active_at?: string | null;
          last_name: string;
          permissions?: string[] | null;
          phone?: string | null;
          photo_url?: string | null;
          preferences?: Json | null;
          role?: 'super_admin' | 'team_owner' | 'team_admin' | 'recruiter' | 'viewer';
          teams?: Json | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          agents_assigned?: number | null;
          agents_recruited?: number | null;
          appointments_booked?: number | null;
          created_at?: string;
          email?: string;
          first_name?: string;
          full_name?: never;
          id?: string;
          last_active_at?: string | null;
          last_name?: string;
          permissions?: string[] | null;
          phone?: string | null;
          photo_url?: string | null;
          preferences?: Json | null;
          role?: 'super_admin' | 'team_owner' | 'team_admin' | 'recruiter' | 'viewer';
          teams?: Json | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};


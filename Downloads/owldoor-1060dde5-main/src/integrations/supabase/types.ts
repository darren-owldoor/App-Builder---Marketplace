export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_chat_conversations: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "admin_chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_magic_links: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string
          id: string
          target_user_id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          target_user_id: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          target_user_id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      admin_pricing_overrides: {
        Row: {
          active: boolean | null
          client_id: string | null
          created_at: string | null
          created_by: string | null
          flat_price: number
          id: string
          pro_type: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          flat_price: number
          id?: string
          pro_type?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          flat_price?: number
          id?: string
          pro_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_pricing_overrides_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_settings: {
        Row: {
          ai_chat_enabled: boolean | null
          category: string
          created_at: string | null
          description: string | null
          id: string
          setting_key: string
          setting_type: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          ai_chat_enabled?: boolean | null
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key: string
          setting_type: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          ai_chat_enabled?: boolean | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          setting_key?: string
          setting_type?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      agent_sessions: {
        Row: {
          created_at: string | null
          id: string
          question_count: number | null
          requires_signup: boolean | null
          session_id: string
          updated_at: string | null
          verification_code: string | null
          verification_expires_at: string | null
          verification_phone: string | null
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          question_count?: number | null
          requires_signup?: boolean | null
          session_id: string
          updated_at?: string | null
          verification_code?: string | null
          verification_expires_at?: string | null
          verification_phone?: string | null
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          question_count?: number | null
          requires_signup?: boolean | null
          session_id?: string
          updated_at?: string | null
          verification_code?: string | null
          verification_expires_at?: string | null
          verification_phone?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      agent_unlocks: {
        Row: {
          amount_paid: number
          client_id: string
          id: string
          payment_intent_id: string | null
          pro_id: string
          unlocked_at: string
        }
        Insert: {
          amount_paid: number
          client_id: string
          id?: string
          payment_intent_id?: string | null
          pro_id: string
          unlocked_at?: string
        }
        Update: {
          amount_paid?: number
          client_id?: string
          id?: string
          payment_intent_id?: string | null
          pro_id?: string
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_unlocks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_unlocks_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_appointments: {
        Row: {
          booked_by: string
          calendly_event_id: string | null
          client_id: string
          created_at: string
          id: string
          lead_id: string
          metadata: Json | null
          scheduled_at: string
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          booked_by: string
          calendly_event_id?: string | null
          client_id: string
          created_at?: string
          id?: string
          lead_id: string
          metadata?: Json | null
          scheduled_at: string
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          booked_by?: string
          calendly_event_id?: string | null
          client_id?: string
          created_at?: string
          id?: string
          lead_id?: string
          metadata?: Json | null
          scheduled_at?: string
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_appointments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "ai_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_card_layouts: {
        Row: {
          card_size: string | null
          client_id: string
          created_at: string | null
          field_order: Json | null
          id: string
          show_avatar: boolean | null
          show_deals: boolean | null
          show_email: boolean | null
          show_engagement_score: boolean | null
          show_experience: boolean | null
          show_hot_badge: boolean | null
          show_last_contact: boolean | null
          show_license_years: boolean | null
          show_location: boolean | null
          show_match_score: boolean | null
          show_messages_count: boolean | null
          show_next_action: boolean | null
          show_phone: boolean | null
          show_service_areas: boolean | null
          show_stage_badge: boolean | null
          show_tasks_count: boolean | null
          show_volume: boolean | null
          show_wants: boolean | null
          updated_at: string | null
          view_type: string | null
          visible_fields: Json | null
        }
        Insert: {
          card_size?: string | null
          client_id: string
          created_at?: string | null
          field_order?: Json | null
          id?: string
          show_avatar?: boolean | null
          show_deals?: boolean | null
          show_email?: boolean | null
          show_engagement_score?: boolean | null
          show_experience?: boolean | null
          show_hot_badge?: boolean | null
          show_last_contact?: boolean | null
          show_license_years?: boolean | null
          show_location?: boolean | null
          show_match_score?: boolean | null
          show_messages_count?: boolean | null
          show_next_action?: boolean | null
          show_phone?: boolean | null
          show_service_areas?: boolean | null
          show_stage_badge?: boolean | null
          show_tasks_count?: boolean | null
          show_volume?: boolean | null
          show_wants?: boolean | null
          updated_at?: string | null
          view_type?: string | null
          visible_fields?: Json | null
        }
        Update: {
          card_size?: string | null
          client_id?: string
          created_at?: string | null
          field_order?: Json | null
          id?: string
          show_avatar?: boolean | null
          show_deals?: boolean | null
          show_email?: boolean | null
          show_engagement_score?: boolean | null
          show_experience?: boolean | null
          show_hot_badge?: boolean | null
          show_last_contact?: boolean | null
          show_license_years?: boolean | null
          show_location?: boolean | null
          show_match_score?: boolean | null
          show_messages_count?: boolean | null
          show_next_action?: boolean | null
          show_phone?: boolean | null
          show_service_areas?: boolean | null
          show_stage_badge?: boolean | null
          show_tasks_count?: boolean | null
          show_volume?: boolean | null
          show_wants?: boolean | null
          updated_at?: string | null
          view_type?: string | null
          visible_fields?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_card_layouts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_logs: {
        Row: {
          created_at: string
          id: string
          message: string
          response: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          response: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          response?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_chat_sessions: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string
          question_count: number | null
          requires_signup: boolean | null
          updated_at: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address: string
          question_count?: number | null
          requires_signup?: boolean | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string
          question_count?: number | null
          requires_signup?: boolean | null
          updated_at?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      ai_config: {
        Row: {
          ai_enabled: boolean | null
          ai_personality: string | null
          ai_response_tone: string | null
          brokerage_info: string | null
          calendly_link: string | null
          client_id: string
          company_name: string | null
          conversation_examples: Json | null
          created_at: string
          escalate_after_messages: number | null
          escalate_on_callback_requests: boolean | null
          escalate_on_commission_questions: boolean | null
          escalate_on_objections: boolean | null
          id: string
          key_benefits: string[] | null
          metadata: Json | null
          offer_details: string | null
          system_prompt: string | null
          team_special: string | null
          twilio_phone_number: string | null
          updated_at: string
        }
        Insert: {
          ai_enabled?: boolean | null
          ai_personality?: string | null
          ai_response_tone?: string | null
          brokerage_info?: string | null
          calendly_link?: string | null
          client_id: string
          company_name?: string | null
          conversation_examples?: Json | null
          created_at?: string
          escalate_after_messages?: number | null
          escalate_on_callback_requests?: boolean | null
          escalate_on_commission_questions?: boolean | null
          escalate_on_objections?: boolean | null
          id?: string
          key_benefits?: string[] | null
          metadata?: Json | null
          offer_details?: string | null
          system_prompt?: string | null
          team_special?: string | null
          twilio_phone_number?: string | null
          updated_at?: string
        }
        Update: {
          ai_enabled?: boolean | null
          ai_personality?: string | null
          ai_response_tone?: string | null
          brokerage_info?: string | null
          calendly_link?: string | null
          client_id?: string
          company_name?: string | null
          conversation_examples?: Json | null
          created_at?: string
          escalate_after_messages?: number | null
          escalate_on_callback_requests?: boolean | null
          escalate_on_commission_questions?: boolean | null
          escalate_on_objections?: boolean | null
          id?: string
          key_benefits?: string[] | null
          metadata?: Json | null
          offer_details?: string | null
          system_prompt?: string | null
          team_special?: string | null
          twilio_phone_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_config_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversation_logs: {
        Row: {
          campaign_assignment_id: string | null
          client_id: string | null
          context_data: Json | null
          created_at: string | null
          id: string
          intent_detected: string | null
          message_content: string
          message_type: string
          pro_id: string | null
          resulted_in_appointment: boolean | null
          sentiment_score: number | null
        }
        Insert: {
          campaign_assignment_id?: string | null
          client_id?: string | null
          context_data?: Json | null
          created_at?: string | null
          id?: string
          intent_detected?: string | null
          message_content: string
          message_type: string
          pro_id?: string | null
          resulted_in_appointment?: boolean | null
          sentiment_score?: number | null
        }
        Update: {
          campaign_assignment_id?: string | null
          client_id?: string | null
          context_data?: Json | null
          created_at?: string | null
          id?: string
          intent_detected?: string | null
          message_content?: string
          message_type?: string
          pro_id?: string | null
          resulted_in_appointment?: boolean | null
          sentiment_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversation_logs_agent_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversation_logs_campaign_assignment_id_fkey"
            columns: ["campaign_assignment_id"]
            isOneToOne: false
            referencedRelation: "campaign_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversation_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_escalation_rules: {
        Row: {
          action_type: string
          action_value: string | null
          active: boolean | null
          client_id: string
          condition_time_unit: string | null
          condition_time_value: number | null
          condition_type: string
          condition_values: string[] | null
          created_at: string | null
          id: string
          order_index: number | null
          updated_at: string | null
        }
        Insert: {
          action_type: string
          action_value?: string | null
          active?: boolean | null
          client_id: string
          condition_time_unit?: string | null
          condition_time_value?: number | null
          condition_type: string
          condition_values?: string[] | null
          created_at?: string | null
          id?: string
          order_index?: number | null
          updated_at?: string | null
        }
        Update: {
          action_type?: string
          action_value?: string | null
          active?: boolean | null
          client_id?: string
          condition_time_unit?: string | null
          condition_time_value?: number | null
          condition_type?: string
          condition_values?: string[] | null
          created_at?: string | null
          id?: string
          order_index?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_escalation_rules_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_leads: {
        Row: {
          ai_active: boolean | null
          ai_message_count: number | null
          appointment_count: number | null
          client_id: string
          conversation_sid: string | null
          created_at: string
          email: string | null
          engagement_score: number | null
          first_name: string | null
          id: string
          is_hot: boolean | null
          last_message_at: string | null
          last_name: string | null
          lead_score: number | null
          match_score: number | null
          message_count: number | null
          metadata: Json | null
          motivation_score: number | null
          next_action: string | null
          phone: string
          pro_id: string | null
          stage: string | null
          star_rating: number | null
          status: string
          twilio_participant_sid: string | null
          updated_at: string
        }
        Insert: {
          ai_active?: boolean | null
          ai_message_count?: number | null
          appointment_count?: number | null
          client_id: string
          conversation_sid?: string | null
          created_at?: string
          email?: string | null
          engagement_score?: number | null
          first_name?: string | null
          id?: string
          is_hot?: boolean | null
          last_message_at?: string | null
          last_name?: string | null
          lead_score?: number | null
          match_score?: number | null
          message_count?: number | null
          metadata?: Json | null
          motivation_score?: number | null
          next_action?: string | null
          phone: string
          pro_id?: string | null
          stage?: string | null
          star_rating?: number | null
          status?: string
          twilio_participant_sid?: string | null
          updated_at?: string
        }
        Update: {
          ai_active?: boolean | null
          ai_message_count?: number | null
          appointment_count?: number | null
          client_id?: string
          conversation_sid?: string | null
          created_at?: string
          email?: string | null
          engagement_score?: number | null
          first_name?: string | null
          id?: string
          is_hot?: boolean | null
          last_message_at?: string | null
          last_name?: string | null
          lead_score?: number | null
          match_score?: number | null
          message_count?: number | null
          metadata?: Json | null
          motivation_score?: number | null
          next_action?: string | null
          phone?: string
          pro_id?: string | null
          stage?: string | null
          star_rating?: number | null
          status?: string
          twilio_participant_sid?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_leads_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_learning_patterns: {
        Row: {
          active: boolean | null
          client_id: string | null
          created_at: string | null
          id: string
          pattern_content: string
          pattern_context: Json | null
          pattern_name: string
          pattern_type: string
          success_rate: number | null
          times_successful: number | null
          times_used: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          pattern_content: string
          pattern_context?: Json | null
          pattern_name: string
          pattern_type: string
          success_rate?: number | null
          times_successful?: number | null
          times_used?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          pattern_content?: string
          pattern_context?: Json | null
          pattern_name?: string
          pattern_type?: string
          success_rate?: number | null
          times_successful?: number | null
          times_used?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_learning_patterns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          ai_action: string | null
          client_id: string
          content: string
          conversation_id: string
          created_at: string
          id: string
          lead_id: string
          metadata: Json | null
          sender_type: string
          twilio_message_sid: string | null
          twilio_sid: string | null
        }
        Insert: {
          ai_action?: string | null
          client_id: string
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          lead_id: string
          metadata?: Json | null
          sender_type: string
          twilio_message_sid?: string | null
          twilio_sid?: string | null
        }
        Update: {
          ai_action?: string | null
          client_id?: string
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          lead_id?: string
          metadata?: Json | null
          sender_type?: string
          twilio_message_sid?: string | null
          twilio_sid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "ai_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_performance_metrics: {
        Row: {
          appointments_booked: number | null
          average_conversation_length: number | null
          average_sentiment_score: number | null
          client_id: string | null
          conversion_rate: number | null
          created_at: string | null
          id: string
          leads_qualified: number | null
          metric_date: string | null
          top_objections: Json | null
          total_conversations: number | null
        }
        Insert: {
          appointments_booked?: number | null
          average_conversation_length?: number | null
          average_sentiment_score?: number | null
          client_id?: string | null
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          leads_qualified?: number | null
          metric_date?: string | null
          top_objections?: Json | null
          total_conversations?: number | null
        }
        Update: {
          appointments_booked?: number | null
          average_conversation_length?: number | null
          average_sentiment_score?: number | null
          client_id?: string | null
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          leads_qualified?: number | null
          metric_date?: string | null
          top_objections?: Json | null
          total_conversations?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_performance_metrics_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_prompts: {
        Row: {
          active: boolean | null
          created_at: string
          created_by: string | null
          id: string
          metadata: Json | null
          prompt_content: string
          prompt_type: string
          target_id: string | null
          target_name: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json | null
          prompt_content: string
          prompt_type: string
          target_id?: string | null
          target_name?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json | null
          prompt_content?: string
          prompt_type?: string
          target_id?: string | null
          target_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_tasks: {
        Row: {
          assigned_to: string | null
          client_id: string
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          lead_id: string
          priority: string | null
          status: string | null
          task_type: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          client_id: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id: string
          priority?: string | null
          status?: string | null
          task_type?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          client_id?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string
          priority?: string | null
          status?: string | null
          task_type?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "ai_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_training_data: {
        Row: {
          agent_conversation_id: string | null
          answer: string | null
          category: string | null
          created_at: string | null
          id: string
          is_answered: boolean | null
          question: string
          updated_at: string | null
        }
        Insert: {
          agent_conversation_id?: string | null
          answer?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_answered?: boolean | null
          question: string
          updated_at?: string | null
        }
        Update: {
          agent_conversation_id?: string | null
          answer?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          is_answered?: boolean | null
          question?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      api_endpoint_metrics: {
        Row: {
          created_at: string
          endpoint: string
          error_message: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          method: string
          response_time_ms: number
          status_code: number
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          endpoint: string
          error_message?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          method: string
          response_time_ms: number
          status_code: number
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          endpoint?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          method?: string
          response_time_ms?: number
          status_code?: number
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          client_id: string | null
          created_at: string | null
          id: string
          is_confirmed: boolean | null
          lead_id: string | null
          notes: string | null
          scheduled_at: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          is_confirmed?: boolean | null
          lead_id?: string | null
          notes?: string | null
          scheduled_at: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          is_confirmed?: boolean | null
          lead_id?: string | null
          notes?: string | null
          scheduled_at?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "ai_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      bids: {
        Row: {
          active: boolean | null
          bid_amount: number
          cities: string[] | null
          client_id: string
          coverage_data: Json | null
          created_at: string
          id: string
          is_exclusive: boolean | null
          max_leads_per_month: number | null
          min_experience: number | null
          min_transactions: number | null
          preferences: Json | null
          pro_type: string | null
          radius_data: Json | null
          states: string[] | null
          updated_at: string
          zip_codes: string[] | null
        }
        Insert: {
          active?: boolean | null
          bid_amount?: number
          cities?: string[] | null
          client_id: string
          coverage_data?: Json | null
          created_at?: string
          id?: string
          is_exclusive?: boolean | null
          max_leads_per_month?: number | null
          min_experience?: number | null
          min_transactions?: number | null
          preferences?: Json | null
          pro_type?: string | null
          radius_data?: Json | null
          states?: string[] | null
          updated_at?: string
          zip_codes?: string[] | null
        }
        Update: {
          active?: boolean | null
          bid_amount?: number
          cities?: string[] | null
          client_id?: string
          coverage_data?: Json | null
          created_at?: string
          id?: string
          is_exclusive?: boolean | null
          max_leads_per_month?: number | null
          min_experience?: number | null
          min_transactions?: number | null
          preferences?: Json | null
          pro_type?: string | null
          radius_data?: Json | null
          states?: string[] | null
          updated_at?: string
          zip_codes?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "bids_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          metadata: Json | null
          published_at: string | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          metadata?: Json | null
          published_at?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          metadata?: Json | null
          published_at?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      calendly_tokens: {
        Row: {
          access_token: string
          calendly_email: string | null
          calendly_user_uri: string | null
          created_at: string
          expires_at: string | null
          id: string
          refresh_token: string | null
          token_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          calendly_email?: string | null
          calendly_user_uri?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          refresh_token?: string | null
          token_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          calendly_email?: string | null
          calendly_user_uri?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          refresh_token?: string | null
          token_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campaign_assignments: {
        Row: {
          ai_handed_off: boolean | null
          ai_handoff_at: string | null
          ai_ready_for_handoff: boolean | null
          assigned_at: string
          assigned_by: string
          campaign_template_id: string
          created_at: string
          current_step: number | null
          id: string
          next_send_at: string | null
          pro_id: string
          status: string
          updated_at: string
        }
        Insert: {
          ai_handed_off?: boolean | null
          ai_handoff_at?: string | null
          ai_ready_for_handoff?: boolean | null
          assigned_at?: string
          assigned_by: string
          campaign_template_id: string
          created_at?: string
          current_step?: number | null
          id?: string
          next_send_at?: string | null
          pro_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          ai_handed_off?: boolean | null
          ai_handoff_at?: string | null
          ai_ready_for_handoff?: boolean | null
          assigned_at?: string
          assigned_by?: string
          campaign_template_id?: string
          created_at?: string
          current_step?: number | null
          id?: string
          next_send_at?: string | null
          pro_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_assignments_agent_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_assignments_campaign_template_id_fkey"
            columns: ["campaign_template_id"]
            isOneToOne: false
            referencedRelation: "campaign_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_logs: {
        Row: {
          assignment_id: string
          created_at: string
          error_message: string | null
          id: string
          response_received: boolean | null
          response_text: string | null
          sent_at: string
          status: string
          step_id: string
          type: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          response_received?: boolean | null
          response_text?: string | null
          sent_at?: string
          status: string
          step_id: string
          type: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          response_received?: boolean | null
          response_text?: string | null
          sent_at?: string
          status?: string
          step_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_logs_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "campaign_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_logs_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "campaign_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_qualification_rules: {
        Row: {
          active: boolean | null
          campaign_template_id: string | null
          created_at: string | null
          field_name: string | null
          id: string
          operator: string
          priority: number | null
          rule_name: string
          rule_type: string
          target_stage: string
          updated_at: string | null
          value: string
        }
        Insert: {
          active?: boolean | null
          campaign_template_id?: string | null
          created_at?: string | null
          field_name?: string | null
          id?: string
          operator: string
          priority?: number | null
          rule_name: string
          rule_type: string
          target_stage: string
          updated_at?: string | null
          value: string
        }
        Update: {
          active?: boolean | null
          campaign_template_id?: string | null
          created_at?: string | null
          field_name?: string | null
          id?: string
          operator?: string
          priority?: number | null
          rule_name?: string
          rule_type?: string
          target_stage?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_qualification_rules_campaign_template_id_fkey"
            columns: ["campaign_template_id"]
            isOneToOne: false
            referencedRelation: "campaign_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_responses: {
        Row: {
          assignment_id: string
          created_at: string
          id: string
          pro_id: string
          received_at: string
          response_text: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          id?: string
          pro_id: string
          received_at?: string
          response_text: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          id?: string
          pro_id?: string
          received_at?: string
          response_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_responses_agent_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_responses_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "campaign_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_step_conditions: {
        Row: {
          action_type: string
          action_value: string | null
          condition_time_unit: string | null
          condition_time_value: number | null
          condition_type: string
          condition_values: string[] | null
          created_at: string | null
          id: string
          order_index: number | null
          step_id: string | null
          updated_at: string | null
        }
        Insert: {
          action_type: string
          action_value?: string | null
          condition_time_unit?: string | null
          condition_time_value?: number | null
          condition_type: string
          condition_values?: string[] | null
          created_at?: string | null
          id?: string
          order_index?: number | null
          step_id?: string | null
          updated_at?: string | null
        }
        Update: {
          action_type?: string
          action_value?: string | null
          condition_time_unit?: string | null
          condition_time_value?: number | null
          condition_type?: string
          condition_values?: string[] | null
          created_at?: string | null
          id?: string
          order_index?: number | null
          step_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_step_conditions_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "campaign_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_steps: {
        Row: {
          campaign_template_id: string
          created_at: string
          delay_days: number
          delay_hours: number
          delay_minutes: number
          email_subject: string | null
          email_template: string | null
          id: string
          phone_number: string | null
          sms_template: string | null
          step_order: number
          step_type: string
          twilio_account_id: string | null
          updated_at: string
        }
        Insert: {
          campaign_template_id: string
          created_at?: string
          delay_days?: number
          delay_hours?: number
          delay_minutes?: number
          email_subject?: string | null
          email_template?: string | null
          id?: string
          phone_number?: string | null
          sms_template?: string | null
          step_order: number
          step_type: string
          twilio_account_id?: string | null
          updated_at?: string
        }
        Update: {
          campaign_template_id?: string
          created_at?: string
          delay_days?: number
          delay_hours?: number
          delay_minutes?: number
          email_subject?: string | null
          email_template?: string | null
          id?: string
          phone_number?: string | null
          sms_template?: string | null
          step_order?: number
          step_type?: string
          twilio_account_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_steps_campaign_template_id_fkey"
            columns: ["campaign_template_id"]
            isOneToOne: false
            referencedRelation: "campaign_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_steps_twilio_account_id_fkey"
            columns: ["twilio_account_id"]
            isOneToOne: false
            referencedRelation: "twilio_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_template_ratings: {
        Row: {
          campaign_template_id: string
          client_id: string
          created_at: string | null
          id: string
          rating: number
          review_text: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_template_id: string
          client_id: string
          created_at?: string | null
          id?: string
          rating: number
          review_text?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_template_id?: string
          client_id?: string
          created_at?: string | null
          id?: string
          rating?: number
          review_text?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_template_ratings_campaign_template_id_fkey"
            columns: ["campaign_template_id"]
            isOneToOne: false
            referencedRelation: "campaign_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_template_ratings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_templates: {
        Row: {
          active: boolean | null
          ai_enabled: boolean | null
          ai_fallback_enabled: boolean | null
          ai_fallback_notify_email: boolean | null
          ai_fallback_notify_sms: boolean | null
          ai_fallback_recipients: string[] | null
          ai_initial_message: string | null
          ai_system_prompt: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          lead_types: string[] | null
          monthly_cost: number | null
          name: string
          per_action_cost: number | null
          pricing_model: string | null
          shared_with_clients: boolean | null
          shared_with_staff: boolean | null
          target_field_criteria: Json | null
          target_pipeline_stages: string[] | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          ai_enabled?: boolean | null
          ai_fallback_enabled?: boolean | null
          ai_fallback_notify_email?: boolean | null
          ai_fallback_notify_sms?: boolean | null
          ai_fallback_recipients?: string[] | null
          ai_initial_message?: string | null
          ai_system_prompt?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          lead_types?: string[] | null
          monthly_cost?: number | null
          name: string
          per_action_cost?: number | null
          pricing_model?: string | null
          shared_with_clients?: boolean | null
          shared_with_staff?: boolean | null
          target_field_criteria?: Json | null
          target_pipeline_stages?: string[] | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          ai_enabled?: boolean | null
          ai_fallback_enabled?: boolean | null
          ai_fallback_notify_email?: boolean | null
          ai_fallback_notify_sms?: boolean | null
          ai_fallback_recipients?: string[] | null
          ai_initial_message?: string | null
          ai_system_prompt?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          lead_types?: string[] | null
          monthly_cost?: number | null
          name?: string
          per_action_cost?: number | null
          pricing_model?: string | null
          shared_with_clients?: boolean | null
          shared_with_staff?: boolean | null
          target_field_criteria?: Json | null
          target_pipeline_stages?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      captcha_activity_log: {
        Row: {
          created_at: string
          error_codes: string[] | null
          form_type: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          provider: string
          score: number | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          error_codes?: string[] | null
          form_type?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          provider?: string
          score?: number | null
          success: boolean
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          error_codes?: string[] | null
          form_type?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          provider?: string
          score?: number | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      cities: {
        Row: {
          county_id: string | null
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          state_id: string
        }
        Insert: {
          county_id?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          state_id: string
        }
        Update: {
          county_id?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          state_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cities_county_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cities_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      client_business_profiles: {
        Row: {
          appointment_booking_preferences: Json | null
          client_id: string | null
          company_description: string | null
          compensation_range: Json | null
          completed: boolean | null
          created_at: string | null
          culture_values: string[] | null
          deal_breakers: string[] | null
          hiring_criteria: Json | null
          id: string
          ideal_candidate_profile: Json | null
          objection_handlers: Json | null
          typical_questions: string[] | null
          unique_selling_points: string[] | null
          updated_at: string | null
          work_environment: string | null
        }
        Insert: {
          appointment_booking_preferences?: Json | null
          client_id?: string | null
          company_description?: string | null
          compensation_range?: Json | null
          completed?: boolean | null
          created_at?: string | null
          culture_values?: string[] | null
          deal_breakers?: string[] | null
          hiring_criteria?: Json | null
          id?: string
          ideal_candidate_profile?: Json | null
          objection_handlers?: Json | null
          typical_questions?: string[] | null
          unique_selling_points?: string[] | null
          updated_at?: string | null
          work_environment?: string | null
        }
        Update: {
          appointment_booking_preferences?: Json | null
          client_id?: string | null
          company_description?: string | null
          compensation_range?: Json | null
          completed?: boolean | null
          created_at?: string | null
          culture_values?: string[] | null
          deal_breakers?: string[] | null
          hiring_criteria?: Json | null
          id?: string
          ideal_candidate_profile?: Json | null
          objection_handlers?: Json | null
          typical_questions?: string[] | null
          unique_selling_points?: string[] | null
          updated_at?: string | null
          work_environment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_business_profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_onboarding_responses: {
        Row: {
          answer: string
          created_at: string | null
          id: string
          profile_id: string | null
          question: string
          question_order: number | null
        }
        Insert: {
          answer: string
          created_at?: string | null
          id?: string
          profile_id?: string | null
          question: string
          question_order?: number | null
        }
        Update: {
          answer?: string
          created_at?: string | null
          id?: string
          profile_id?: string | null
          question?: string
          question_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "client_onboarding_responses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "client_business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_phone_numbers: {
        Row: {
          active: boolean | null
          assigned_at: string
          client_id: string
          created_at: string
          id: string
          phone_number: string
          provider: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          assigned_at?: string
          client_id: string
          created_at?: string
          id?: string
          phone_number: string
          provider?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          assigned_at?: string
          client_id?: string
          created_at?: string
          id?: string
          phone_number?: string
          provider?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_phone_numbers_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_pro_notes: {
        Row: {
          client_id: string
          created_at: string
          field_overrides: Json | null
          id: string
          notes: string | null
          pro_id: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          field_overrides?: Json | null
          id?: string
          notes?: string | null
          pro_id: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          field_overrides?: Json | null
          id?: string
          notes?: string | null
          pro_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_pro_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_pro_notes_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
        ]
      }
      client_reviews: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          rating: number
          review_text: string
          reviewer_name: string
          reviewer_role: string | null
          updated_at: string
          years_with_team: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          rating: number
          review_text: string
          reviewer_name: string
          reviewer_role?: string | null
          updated_at?: string
          years_with_team?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          rating?: number
          review_text?: string
          reviewer_name?: string
          reviewer_role?: string | null
          updated_at?: string
          years_with_team?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          active: boolean | null
          auto_charge_enabled: boolean | null
          avg_sale: number | null
          bids_admin_managed: boolean | null
          brokerage: string | null
          cities: string[] | null
          client_type: Database["public"]["Enums"]["client_type"]
          company_name: string
          contact_name: string
          county: string | null
          coverage_areas: Json | null
          created_at: string
          credits_balance: number | null
          credits_used: number | null
          current_month_spend: number | null
          current_package_id: string | null
          custom_package_id: string | null
          designations: string[] | null
          email: string
          email2: string | null
          facebook_url: string | null
          first_name: string | null
          has_payment_method: boolean | null
          hide_bids: boolean | null
          homes_com_url: string | null
          id: string
          image_url: string | null
          instagram_url: string | null
          languages: string[] | null
          last_name: string | null
          last_refill_amount: number | null
          last_spend_reset_date: string | null
          license_type: string | null
          linkedin_url: string | null
          monthly_spend_maximum: number | null
          needs: string | null
          onboarding_completed: boolean | null
          package_access_token: string | null
          password_change_required: boolean | null
          payment_method_added_at: string | null
          phone: string | null
          phone2: string | null
          preferences: Json | null
          profile_completed: boolean | null
          provides: string[] | null
          realtor_com_url: string | null
          setup_fee: number | null
          skills: string[] | null
          states: string[] | null
          stripe_customer_id: string | null
          tags: string[] | null
          tiktok_url: string | null
          total_refills: number | null
          twitter_url: string | null
          updated_at: string
          user_id: string
          wants: string | null
          website_url: string | null
          yearly_sales: number | null
          years_experience: number | null
          youtube_url: string | null
          zapier_webhook: string | null
          zip_codes: string[] | null
        }
        Insert: {
          active?: boolean | null
          auto_charge_enabled?: boolean | null
          avg_sale?: number | null
          bids_admin_managed?: boolean | null
          brokerage?: string | null
          cities?: string[] | null
          client_type?: Database["public"]["Enums"]["client_type"]
          company_name: string
          contact_name: string
          county?: string | null
          coverage_areas?: Json | null
          created_at?: string
          credits_balance?: number | null
          credits_used?: number | null
          current_month_spend?: number | null
          current_package_id?: string | null
          custom_package_id?: string | null
          designations?: string[] | null
          email: string
          email2?: string | null
          facebook_url?: string | null
          first_name?: string | null
          has_payment_method?: boolean | null
          hide_bids?: boolean | null
          homes_com_url?: string | null
          id?: string
          image_url?: string | null
          instagram_url?: string | null
          languages?: string[] | null
          last_name?: string | null
          last_refill_amount?: number | null
          last_spend_reset_date?: string | null
          license_type?: string | null
          linkedin_url?: string | null
          monthly_spend_maximum?: number | null
          needs?: string | null
          onboarding_completed?: boolean | null
          package_access_token?: string | null
          password_change_required?: boolean | null
          payment_method_added_at?: string | null
          phone?: string | null
          phone2?: string | null
          preferences?: Json | null
          profile_completed?: boolean | null
          provides?: string[] | null
          realtor_com_url?: string | null
          setup_fee?: number | null
          skills?: string[] | null
          states?: string[] | null
          stripe_customer_id?: string | null
          tags?: string[] | null
          tiktok_url?: string | null
          total_refills?: number | null
          twitter_url?: string | null
          updated_at?: string
          user_id: string
          wants?: string | null
          website_url?: string | null
          yearly_sales?: number | null
          years_experience?: number | null
          youtube_url?: string | null
          zapier_webhook?: string | null
          zip_codes?: string[] | null
        }
        Update: {
          active?: boolean | null
          auto_charge_enabled?: boolean | null
          avg_sale?: number | null
          bids_admin_managed?: boolean | null
          brokerage?: string | null
          cities?: string[] | null
          client_type?: Database["public"]["Enums"]["client_type"]
          company_name?: string
          contact_name?: string
          county?: string | null
          coverage_areas?: Json | null
          created_at?: string
          credits_balance?: number | null
          credits_used?: number | null
          current_month_spend?: number | null
          current_package_id?: string | null
          custom_package_id?: string | null
          designations?: string[] | null
          email?: string
          email2?: string | null
          facebook_url?: string | null
          first_name?: string | null
          has_payment_method?: boolean | null
          hide_bids?: boolean | null
          homes_com_url?: string | null
          id?: string
          image_url?: string | null
          instagram_url?: string | null
          languages?: string[] | null
          last_name?: string | null
          last_refill_amount?: number | null
          last_spend_reset_date?: string | null
          license_type?: string | null
          linkedin_url?: string | null
          monthly_spend_maximum?: number | null
          needs?: string | null
          onboarding_completed?: boolean | null
          package_access_token?: string | null
          password_change_required?: boolean | null
          payment_method_added_at?: string | null
          phone?: string | null
          phone2?: string | null
          preferences?: Json | null
          profile_completed?: boolean | null
          provides?: string[] | null
          realtor_com_url?: string | null
          setup_fee?: number | null
          skills?: string[] | null
          states?: string[] | null
          stripe_customer_id?: string | null
          tags?: string[] | null
          tiktok_url?: string | null
          total_refills?: number | null
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
          wants?: string | null
          website_url?: string | null
          yearly_sales?: number | null
          years_experience?: number | null
          youtube_url?: string | null
          zapier_webhook?: string | null
          zip_codes?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_current_package_id_fkey"
            columns: ["current_package_id"]
            isOneToOne: false
            referencedRelation: "pricing_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_custom_package_id_fkey"
            columns: ["custom_package_id"]
            isOneToOne: false
            referencedRelation: "pricing_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          message_content: string
          message_type: string
          metadata: Json | null
          pro_id: string
          sent_by: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          message_content: string
          message_type: string
          metadata?: Json | null
          pro_id: string
          sent_by?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          message_content?: string
          message_type?: string
          metadata?: Json | null
          pro_id?: string
          sent_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_agent_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      counties: {
        Row: {
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          state_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          state_id: string
        }
        Update: {
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          state_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "counties_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          reason: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          balance_after: number
          client_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          balance_after?: number
          client_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      cronofy_tokens: {
        Row: {
          access_token: string
          created_at: string
          cronofy_sub: string
          expires_at: string
          id: string
          refresh_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          cronofy_sub: string
          expires_at: string
          id?: string
          refresh_token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          cronofy_sub?: string
          expires_at?: string
          id?: string
          refresh_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_field_values: {
        Row: {
          created_at: string
          custom_field_id: string
          id: string
          record_id: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          custom_field_id: string
          id?: string
          record_id: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          custom_field_id?: string
          id?: string
          record_id?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_values_custom_field_id_fkey"
            columns: ["custom_field_id"]
            isOneToOne: false
            referencedRelation: "custom_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_fields: {
        Row: {
          active: boolean | null
          created_at: string
          field_name: string
          field_type: string
          id: string
          required: boolean | null
          target_table: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          field_name: string
          field_type: string
          id?: string
          required?: boolean | null
          target_table: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          field_name?: string
          field_type?: string
          id?: string
          required?: boolean | null
          target_table?: string
          updated_at?: string
        }
        Relationships: []
      }
      discount_codes: {
        Row: {
          active: boolean | null
          code: string
          created_at: string | null
          current_uses: number | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          max_uses: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string | null
          current_uses?: number | null
          discount_type?: string
          discount_value: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string | null
          current_uses?: number | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_activity_log: {
        Row: {
          created_at: string
          direction: string
          error_message: string | null
          from_email: string
          id: string
          message_id: string | null
          metadata: Json | null
          provider: string
          status: string
          subject: string | null
          to_email: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          direction: string
          error_message?: string | null
          from_email: string
          id?: string
          message_id?: string | null
          metadata?: Json | null
          provider?: string
          status: string
          subject?: string | null
          to_email: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          direction?: string
          error_message?: string | null
          from_email?: string
          id?: string
          message_id?: string | null
          metadata?: Json | null
          provider?: string
          status?: string
          subject?: string | null
          to_email?: string
          user_id?: string | null
        }
        Relationships: []
      }
      email_configs: {
        Row: {
          config: Json
          created_at: string | null
          id: string
          is_configured: boolean | null
          provider: string
          updated_at: string | null
          use_for_admin: boolean | null
          use_for_clients: boolean | null
        }
        Insert: {
          config?: Json
          created_at?: string | null
          id?: string
          is_configured?: boolean | null
          provider: string
          updated_at?: string | null
          use_for_admin?: boolean | null
          use_for_clients?: boolean | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          id?: string
          is_configured?: boolean | null
          provider?: string
          updated_at?: string | null
          use_for_admin?: boolean | null
          use_for_clients?: boolean | null
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          provider: string
          status: string
          subject: string
          to_email: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          provider: string
          status: string
          subject: string
          to_email: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          provider?: string
          status?: string
          subject?: string
          to_email?: string
          user_id?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          active: boolean | null
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          html_content: string
          id: string
          subject: string
          template_key: string
          template_name: string
          text_content: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          html_content: string
          id?: string
          subject: string
          template_key: string
          template_name: string
          text_content?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          html_content?: string
          id?: string
          subject?: string
          template_key?: string
          template_name?: string
          text_content?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      field_definitions: {
        Row: {
          active: boolean | null
          allowed_values: Json | null
          created_at: string | null
          default_value: string | null
          description: string | null
          display_name: string
          entity_types: string[]
          field_group: string | null
          field_name: string
          field_type: string
          id: string
          is_required: boolean | null
          matching_weight: number | null
          sort_order: number | null
          updated_at: string | null
          use_ai_matching: boolean | null
          validation_rules: Json | null
          visible_in: string[]
        }
        Insert: {
          active?: boolean | null
          allowed_values?: Json | null
          created_at?: string | null
          default_value?: string | null
          description?: string | null
          display_name: string
          entity_types?: string[]
          field_group?: string | null
          field_name: string
          field_type: string
          id?: string
          is_required?: boolean | null
          matching_weight?: number | null
          sort_order?: number | null
          updated_at?: string | null
          use_ai_matching?: boolean | null
          validation_rules?: Json | null
          visible_in?: string[]
        }
        Update: {
          active?: boolean | null
          allowed_values?: Json | null
          created_at?: string | null
          default_value?: string | null
          description?: string | null
          display_name?: string
          entity_types?: string[]
          field_group?: string | null
          field_name?: string
          field_type?: string
          id?: string
          is_required?: boolean | null
          matching_weight?: number | null
          sort_order?: number | null
          updated_at?: string | null
          use_ai_matching?: boolean | null
          validation_rules?: Json | null
          visible_in?: string[]
        }
        Relationships: []
      }
      imessage_devices: {
        Row: {
          active: boolean | null
          created_at: string | null
          device_id: string
          device_name: string | null
          device_type: string | null
          id: string
          last_seen_at: string | null
          metadata: Json | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          device_id: string
          device_name?: string | null
          device_type?: string | null
          id?: string
          last_seen_at?: string | null
          metadata?: Json | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          device_id?: string
          device_name?: string | null
          device_type?: string | null
          id?: string
          last_seen_at?: string | null
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      imessage_incoming: {
        Row: {
          created_at: string
          direction: string
          id: string
          lead_id: string | null
          message: string
          metadata: Json | null
          phone: string
          processed: boolean | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          direction?: string
          id?: string
          lead_id?: string | null
          message: string
          metadata?: Json | null
          phone: string
          processed?: boolean | null
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          direction?: string
          id?: string
          lead_id?: string | null
          message?: string
          metadata?: Json | null
          phone?: string
          processed?: boolean | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      imessage_outgoing: {
        Row: {
          agent_name: string | null
          agent_phone: string
          content: string
          created_at: string
          error: string | null
          id: string
          lead_id: string | null
          metadata: Json | null
          sent_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          agent_name?: string | null
          agent_phone: string
          content: string
          created_at?: string
          error?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          sent_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          agent_name?: string | null
          agent_phone?: string
          content?: string
          created_at?: string
          error?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          sent_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      imessage_queue: {
        Row: {
          client_id: string
          created_at: string | null
          device_id: string | null
          error_message: string | null
          id: string
          lead_id: string | null
          message: string
          metadata: Json | null
          sent_at: string | null
          status: string
          to_number: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          device_id?: string | null
          error_message?: string | null
          id?: string
          lead_id?: string | null
          message: string
          metadata?: Json | null
          sent_at?: string | null
          status?: string
          to_number: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          device_id?: string | null
          error_message?: string | null
          id?: string
          lead_id?: string | null
          message?: string
          metadata?: Json | null
          sent_at?: string | null
          status?: string
          to_number?: string
          user_id?: string
        }
        Relationships: []
      }
      imessage_secrets: {
        Row: {
          created_at: string
          device_id: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          secret_token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          secret_token: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          secret_token?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_answers: {
        Row: {
          answer_text: string
          created_at: string
          id: string
          lead_id: string
          question_id: string
        }
        Insert: {
          answer_text: string
          created_at?: string
          id?: string
          lead_id: string
          question_id: string
        }
        Update: {
          answer_text?: string
          created_at?: string
          id?: string
          lead_id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_answers_agent_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "qualification_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_research: {
        Row: {
          ai_notes: string | null
          client_id: string
          created_at: string | null
          id: string
          last_researched_at: string | null
          pro_id: string
          research_data: Json | null
          sources: Json | null
        }
        Insert: {
          ai_notes?: string | null
          client_id: string
          created_at?: string | null
          id?: string
          last_researched_at?: string | null
          pro_id: string
          research_data?: Json | null
          sources?: Json | null
        }
        Update: {
          ai_notes?: string | null
          client_id?: string
          created_at?: string | null
          id?: string
          last_researched_at?: string | null
          pro_id?: string
          research_data?: Json | null
          sources?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_research_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_research_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
        ]
      }
      magic_links: {
        Row: {
          agent_id: string | null
          attempts: number | null
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          agent_id?: string | null
          attempts?: number | null
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          agent_id?: string | null
          attempts?: number | null
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "magic_links_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
        ]
      }
      market_coverage: {
        Row: {
          completeness_score: number | null
          coverage_breadth_score: number | null
          coverage_type: string
          created_at: string
          data: Json
          demand_overlap_score: number | null
          id: string
          last_scored_at: string | null
          name: string
          quality_score: number | null
          score_details: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completeness_score?: number | null
          coverage_breadth_score?: number | null
          coverage_type: string
          created_at?: string
          data: Json
          demand_overlap_score?: number | null
          id?: string
          last_scored_at?: string | null
          name: string
          quality_score?: number | null
          score_details?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completeness_score?: number | null
          coverage_breadth_score?: number | null
          coverage_type?: string
          created_at?: string
          data?: Json
          demand_overlap_score?: number | null
          id?: string
          last_scored_at?: string | null
          name?: string
          quality_score?: number | null
          score_details?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          auto_charged_at: string | null
          bid_id: string | null
          client_id: string
          cost: number | null
          created_at: string
          id: string
          lead_score: number | null
          match_score: number
          match_type: string | null
          notes: string | null
          package_type: string | null
          payment_intent_id: string | null
          pricing_tier: string | null
          pro_id: string
          purchase_amount: number | null
          purchased: boolean | null
          purchased_at: string | null
          score_breakdown: Json | null
          score_last_updated: string | null
          status: string
          updated_at: string
        }
        Insert: {
          auto_charged_at?: string | null
          bid_id?: string | null
          client_id: string
          cost?: number | null
          created_at?: string
          id?: string
          lead_score?: number | null
          match_score?: number
          match_type?: string | null
          notes?: string | null
          package_type?: string | null
          payment_intent_id?: string | null
          pricing_tier?: string | null
          pro_id: string
          purchase_amount?: number | null
          purchased?: boolean | null
          purchased_at?: string | null
          score_breakdown?: Json | null
          score_last_updated?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          auto_charged_at?: string | null
          bid_id?: string | null
          client_id?: string
          cost?: number | null
          created_at?: string
          id?: string
          lead_score?: number | null
          match_score?: number
          match_type?: string | null
          notes?: string | null
          package_type?: string | null
          payment_intent_id?: string | null
          pricing_tier?: string | null
          pro_id?: string
          purchase_amount?: number | null
          purchased?: boolean | null
          purchased_at?: string | null
          score_breakdown?: Json | null
          score_last_updated?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_agent_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          template_content: string
          template_name: string
          template_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          template_content: string
          template_name: string
          template_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          template_content?: string
          template_name?: string
          template_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      missed_matches: {
        Row: {
          client_id: string
          created_at: string
          expires_at: string
          id: string
          lead_id: string
          lead_preview: Json
          match_score: number
          package_type: string
          purchased: boolean | null
          purchased_at: string | null
          required_credits: number
        }
        Insert: {
          client_id: string
          created_at?: string
          expires_at?: string
          id?: string
          lead_id: string
          lead_preview: Json
          match_score?: number
          package_type: string
          purchased?: boolean | null
          purchased_at?: string | null
          required_credits: number
        }
        Update: {
          client_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          lead_id?: string
          lead_preview?: Json
          match_score?: number
          package_type?: string
          purchased?: boolean | null
          purchased_at?: string | null
          required_credits?: number
        }
        Relationships: [
          {
            foreignKeyName: "missed_matches_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missed_matches_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_activity_log: {
        Row: {
          amount_cents: number
          client_id: string | null
          created_at: string
          currency: string
          error_code: string | null
          error_message: string | null
          event_type: string
          id: string
          metadata: Json | null
          payment_method: string | null
          provider: string
          status: string
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          amount_cents: number
          client_id?: string | null
          created_at?: string
          currency?: string
          error_code?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          provider?: string
          status: string
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          client_id?: string | null
          created_at?: string
          currency?: string
          error_code?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          provider?: string
          status?: string
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payment_configs: {
        Row: {
          config: Json
          configured: boolean | null
          created_at: string | null
          id: string
          provider: string
          updated_at: string | null
        }
        Insert: {
          config: Json
          configured?: boolean | null
          created_at?: string | null
          id?: string
          provider: string
          updated_at?: string | null
        }
        Update: {
          config?: Json
          configured?: boolean | null
          created_at?: string | null
          id?: string
          provider?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_links: {
        Row: {
          amount: number
          client_id: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string
          email_template: string | null
          id: string
          sms_template: string | null
          status: string | null
          stripe_payment_link_id: string | null
          stripe_payment_link_url: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description: string
          email_template?: string | null
          id?: string
          sms_template?: string | null
          status?: string | null
          stripe_payment_link_id?: string | null
          stripe_payment_link_url?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string
          email_template?: string | null
          id?: string
          sms_template?: string | null
          status?: string | null
          stripe_payment_link_id?: string | null
          stripe_payment_link_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_links_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_providers: {
        Row: {
          config: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          provider_name: string
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          provider_name: string
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          provider_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_setup_tokens: {
        Row: {
          client_id: string
          created_at: string | null
          expires_at: string
          id: string
          used: boolean | null
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          used?: boolean | null
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          used?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_setup_tokens_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          client_id: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          metadata: Json | null
          refunded_amount: number | null
          status: string
          stripe_payment_intent_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          client_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          refunded_amount?: number | null
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          refunded_amount?: number | null
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      phone_numbers: {
        Row: {
          active: boolean | null
          assigned_to_client_id: string | null
          assigned_to_user_id: string | null
          assignment_type: string
          capabilities: Json | null
          created_at: string
          friendly_name: string | null
          id: string
          phone_number: string
          purchased_at: string | null
          twilio_account_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          assigned_to_client_id?: string | null
          assigned_to_user_id?: string | null
          assignment_type: string
          capabilities?: Json | null
          created_at?: string
          friendly_name?: string | null
          id?: string
          phone_number: string
          purchased_at?: string | null
          twilio_account_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          assigned_to_client_id?: string | null
          assigned_to_user_id?: string | null
          assignment_type?: string
          capabilities?: Json | null
          created_at?: string
          friendly_name?: string | null
          id?: string
          phone_number?: string
          purchased_at?: string | null
          twilio_account_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "phone_numbers_assigned_to_client_id_fkey"
            columns: ["assigned_to_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phone_numbers_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phone_numbers_twilio_account_id_fkey"
            columns: ["twilio_account_id"]
            isOneToOne: false
            referencedRelation: "twilio_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_config: {
        Row: {
          active: boolean | null
          config_type: string
          created_at: string | null
          id: string
          max_value: number | null
          min_value: number | null
          modifier_type: string
          price_modifier: number
          tier_name: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          config_type: string
          created_at?: string | null
          id?: string
          max_value?: number | null
          min_value?: number | null
          modifier_type?: string
          price_modifier?: number
          tier_name: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          config_type?: string
          created_at?: string | null
          id?: string
          max_value?: number | null
          min_value?: number | null
          modifier_type?: string
          price_modifier?: number
          tier_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pricing_packages: {
        Row: {
          active: boolean | null
          ai_usage_price: number | null
          client_id: string | null
          created_at: string | null
          credits_included: number
          description: string | null
          features: Json | null
          id: string
          includes_twilio_number: boolean | null
          is_custom: boolean | null
          lead_pricing_rules: Json | null
          leads_per_month: number | null
          location_filter: Json | null
          monthly_cost: number
          name: string
          package_type: string | null
          price_per_lead: number | null
          setup_fee: number | null
          sms_included: number | null
          sms_price_per_additional: number | null
          transaction_minimum: number | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          ai_usage_price?: number | null
          client_id?: string | null
          created_at?: string | null
          credits_included?: number
          description?: string | null
          features?: Json | null
          id?: string
          includes_twilio_number?: boolean | null
          is_custom?: boolean | null
          lead_pricing_rules?: Json | null
          leads_per_month?: number | null
          location_filter?: Json | null
          monthly_cost?: number
          name: string
          package_type?: string | null
          price_per_lead?: number | null
          setup_fee?: number | null
          sms_included?: number | null
          sms_price_per_additional?: number | null
          transaction_minimum?: number | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          ai_usage_price?: number | null
          client_id?: string | null
          created_at?: string | null
          credits_included?: number
          description?: string | null
          features?: Json | null
          id?: string
          includes_twilio_number?: boolean | null
          is_custom?: boolean | null
          lead_pricing_rules?: Json | null
          leads_per_month?: number | null
          location_filter?: Json | null
          monthly_cost?: number
          name?: string
          package_type?: string | null
          price_per_lead?: number | null
          setup_fee?: number | null
          sms_included?: number | null
          sms_price_per_additional?: number | null
          transaction_minimum?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_packages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      pro_stage_history: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          created_at: string
          from_stage: string | null
          id: string
          is_automatic: boolean | null
          metadata: Json | null
          pro_id: string
          to_stage: string
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string
          from_stage?: string | null
          id?: string
          is_automatic?: boolean | null
          metadata?: Json | null
          pro_id: string
          to_stage: string
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string
          from_stage?: string | null
          id?: string
          is_automatic?: boolean | null
          metadata?: Json | null
          pro_id?: string
          to_stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "pro_stage_history_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean | null
          company_name: string | null
          created_at: string
          email: string
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          onboarding_completed: boolean | null
          onboarding_data: Json | null
          phone: string | null
          updated_at: string
          user_type: string | null
        }
        Insert: {
          active?: boolean | null
          company_name?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          full_name?: string | null
          id: string
          last_name?: string | null
          onboarding_completed?: boolean | null
          onboarding_data?: Json | null
          phone?: string | null
          updated_at?: string
          user_type?: string | null
        }
        Update: {
          active?: boolean | null
          company_name?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          onboarding_completed?: boolean | null
          onboarding_data?: Json | null
          phone?: string | null
          updated_at?: string
          user_type?: string | null
        }
        Relationships: []
      }
      pros: {
        Row: {
          accepting_new_partners: boolean | null
          accepts_agent_partnerships: boolean | null
          additional_data: Json | null
          address: string | null
          annual_loan_volume: number | null
          average_deal: number | null
          average_sale_price: number | null
          avg_close_time_days: number | null
          avg_loan_size: number | null
          avg_sale_price: number | null
          awards: Json | null
          became_lead_at: string | null
          best_time_to_contact: string | null
          bio: string | null
          brokerage: string | null
          buyer_financed: number | null
          buyer_percentage: number | null
          buyer_units: number | null
          buyer_volume: number | null
          certifications: Json | null
          cities: string[] | null
          claimed_at: string | null
          client_email: string | null
          client_phone: string | null
          client_types_served: Json | null
          co_marketing_available: boolean | null
          commercial_volume: number | null
          company: string | null
          contact_attempts: number | null
          conventional_percentage: number | null
          counties: string[] | null
          coverage_areas: Json | null
          created_at: string
          date: string | null
          date_scraped: string | null
          designations: Json | null
          dom: number | null
          dual_units: number | null
          dual_volume: number | null
          email: string | null
          email2: string | null
          engagement_score: number | null
          experience: number | null
          facebook_url: string | null
          farm_areas: Json | null
          first_name: string | null
          form_submission_count: number | null
          full_address: string | null
          full_name: string
          has_bio: boolean | null
          has_photo: boolean | null
          high_price_point: number | null
          homes_com_url: string | null
          id: string
          image_url: string | null
          instagram_url: string | null
          interested_in_opportunities: boolean | null
          ip_address: string | null
          is_claimed: boolean | null
          languages: Json | null
          last_contacted_at: string | null
          last_enriched_at: string | null
          last_form_submission_at: string | null
          last_name: string | null
          last_responded_at: string | null
          last_sale_date: string | null
          last_viewed_at: string | null
          lead_price: number | null
          lead_source: string | null
          lender_company_nmls: string | null
          lender_name: string | null
          license: string | null
          license_number: string | null
          license_states: Json | null
          license_type: string | null
          linkedin_url: string | null
          list_to_sell_ratio: number | null
          loan_purposes: Json | null
          loan_types_specialized: Json | null
          loans_closed_12mo: number | null
          low_price_point: number | null
          luxury_volume: number | null
          market_coverage_completed: boolean | null
          match_to: string | null
          matching_completed: boolean | null
          max_loans_per_month: number | null
          monthly_loan_volume: number | null
          motivation: number | null
          nmls_id: string | null
          nmls_verified: boolean | null
          nmls_verified_at: string | null
          notes: string | null
          off_market_deals: number | null
          on_time_close_rate: number | null
          onboarding_completed: boolean | null
          open_to_company_offers: boolean | null
          original_status: string | null
          partnership_fee_structure: string | null
          percent_financed: number | null
          phone: string
          phone2: string | null
          photo_url: string | null
          pipeline_stage: string | null
          pipeline_type: string | null
          preferred_contact_method: string | null
          price_range: string | null
          price_range_max: number | null
          price_range_min: number | null
          price_reductions: number | null
          primary_neighborhoods: Json | null
          pro_type: Database["public"]["Enums"]["lead_type"] | null
          profile_completed: boolean | null
          profile_completeness: number | null
          profile_url: string | null
          profile_views: number | null
          property_types: Json | null
          provides_leads_to_agents: boolean | null
          purchase_percentage: number | null
          qualification_score: number | null
          radius: number | null
          realtor_com_url: string | null
          referrer_url: string | null
          refinance_percentage: number | null
          rental_volume: number | null
          response_rate: number | null
          seller_financed: number | null
          seller_percentage: number | null
          seller_side_percentage: number | null
          seller_units: number | null
          seller_volume: number | null
          service_radius_miles: number | null
          signup_ip: string | null
          skills: string[] | null
          source: string | null
          specialization: string | null
          specializations: Json | null
          state_license: string | null
          state_licenses: Json | null
          states: string[] | null
          status: string
          tags: string[] | null
          team: string | null
          team_size: number | null
          tiktok_url: string | null
          times_contacted: number | null
          top_lender: string | null
          top_lender_share: number | null
          top_lender_volume: number | null
          top_originator: string | null
          top_originator_share: number | null
          top_originator_volume: number | null
          total_sales: number | null
          total_units: number | null
          total_volume: number | null
          total_volume_12mo: number | null
          transactions: number | null
          transactions_12mo: number | null
          transactions_per_year: number | null
          twitter_url: string | null
          updated_at: string
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          wants: string[] | null
          website_url: string | null
          years_experience: number | null
          youtube_url: string | null
          zip_codes: string[] | null
        }
        Insert: {
          accepting_new_partners?: boolean | null
          accepts_agent_partnerships?: boolean | null
          additional_data?: Json | null
          address?: string | null
          annual_loan_volume?: number | null
          average_deal?: number | null
          average_sale_price?: number | null
          avg_close_time_days?: number | null
          avg_loan_size?: number | null
          avg_sale_price?: number | null
          awards?: Json | null
          became_lead_at?: string | null
          best_time_to_contact?: string | null
          bio?: string | null
          brokerage?: string | null
          buyer_financed?: number | null
          buyer_percentage?: number | null
          buyer_units?: number | null
          buyer_volume?: number | null
          certifications?: Json | null
          cities?: string[] | null
          claimed_at?: string | null
          client_email?: string | null
          client_phone?: string | null
          client_types_served?: Json | null
          co_marketing_available?: boolean | null
          commercial_volume?: number | null
          company?: string | null
          contact_attempts?: number | null
          conventional_percentage?: number | null
          counties?: string[] | null
          coverage_areas?: Json | null
          created_at?: string
          date?: string | null
          date_scraped?: string | null
          designations?: Json | null
          dom?: number | null
          dual_units?: number | null
          dual_volume?: number | null
          email?: string | null
          email2?: string | null
          engagement_score?: number | null
          experience?: number | null
          facebook_url?: string | null
          farm_areas?: Json | null
          first_name?: string | null
          form_submission_count?: number | null
          full_address?: string | null
          full_name: string
          has_bio?: boolean | null
          has_photo?: boolean | null
          high_price_point?: number | null
          homes_com_url?: string | null
          id?: string
          image_url?: string | null
          instagram_url?: string | null
          interested_in_opportunities?: boolean | null
          ip_address?: string | null
          is_claimed?: boolean | null
          languages?: Json | null
          last_contacted_at?: string | null
          last_enriched_at?: string | null
          last_form_submission_at?: string | null
          last_name?: string | null
          last_responded_at?: string | null
          last_sale_date?: string | null
          last_viewed_at?: string | null
          lead_price?: number | null
          lead_source?: string | null
          lender_company_nmls?: string | null
          lender_name?: string | null
          license?: string | null
          license_number?: string | null
          license_states?: Json | null
          license_type?: string | null
          linkedin_url?: string | null
          list_to_sell_ratio?: number | null
          loan_purposes?: Json | null
          loan_types_specialized?: Json | null
          loans_closed_12mo?: number | null
          low_price_point?: number | null
          luxury_volume?: number | null
          market_coverage_completed?: boolean | null
          match_to?: string | null
          matching_completed?: boolean | null
          max_loans_per_month?: number | null
          monthly_loan_volume?: number | null
          motivation?: number | null
          nmls_id?: string | null
          nmls_verified?: boolean | null
          nmls_verified_at?: string | null
          notes?: string | null
          off_market_deals?: number | null
          on_time_close_rate?: number | null
          onboarding_completed?: boolean | null
          open_to_company_offers?: boolean | null
          original_status?: string | null
          partnership_fee_structure?: string | null
          percent_financed?: number | null
          phone: string
          phone2?: string | null
          photo_url?: string | null
          pipeline_stage?: string | null
          pipeline_type?: string | null
          preferred_contact_method?: string | null
          price_range?: string | null
          price_range_max?: number | null
          price_range_min?: number | null
          price_reductions?: number | null
          primary_neighborhoods?: Json | null
          pro_type?: Database["public"]["Enums"]["lead_type"] | null
          profile_completed?: boolean | null
          profile_completeness?: number | null
          profile_url?: string | null
          profile_views?: number | null
          property_types?: Json | null
          provides_leads_to_agents?: boolean | null
          purchase_percentage?: number | null
          qualification_score?: number | null
          radius?: number | null
          realtor_com_url?: string | null
          referrer_url?: string | null
          refinance_percentage?: number | null
          rental_volume?: number | null
          response_rate?: number | null
          seller_financed?: number | null
          seller_percentage?: number | null
          seller_side_percentage?: number | null
          seller_units?: number | null
          seller_volume?: number | null
          service_radius_miles?: number | null
          signup_ip?: string | null
          skills?: string[] | null
          source?: string | null
          specialization?: string | null
          specializations?: Json | null
          state_license?: string | null
          state_licenses?: Json | null
          states?: string[] | null
          status?: string
          tags?: string[] | null
          team?: string | null
          team_size?: number | null
          tiktok_url?: string | null
          times_contacted?: number | null
          top_lender?: string | null
          top_lender_share?: number | null
          top_lender_volume?: number | null
          top_originator?: string | null
          top_originator_share?: number | null
          top_originator_volume?: number | null
          total_sales?: number | null
          total_units?: number | null
          total_volume?: number | null
          total_volume_12mo?: number | null
          transactions?: number | null
          transactions_12mo?: number | null
          transactions_per_year?: number | null
          twitter_url?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          wants?: string[] | null
          website_url?: string | null
          years_experience?: number | null
          youtube_url?: string | null
          zip_codes?: string[] | null
        }
        Update: {
          accepting_new_partners?: boolean | null
          accepts_agent_partnerships?: boolean | null
          additional_data?: Json | null
          address?: string | null
          annual_loan_volume?: number | null
          average_deal?: number | null
          average_sale_price?: number | null
          avg_close_time_days?: number | null
          avg_loan_size?: number | null
          avg_sale_price?: number | null
          awards?: Json | null
          became_lead_at?: string | null
          best_time_to_contact?: string | null
          bio?: string | null
          brokerage?: string | null
          buyer_financed?: number | null
          buyer_percentage?: number | null
          buyer_units?: number | null
          buyer_volume?: number | null
          certifications?: Json | null
          cities?: string[] | null
          claimed_at?: string | null
          client_email?: string | null
          client_phone?: string | null
          client_types_served?: Json | null
          co_marketing_available?: boolean | null
          commercial_volume?: number | null
          company?: string | null
          contact_attempts?: number | null
          conventional_percentage?: number | null
          counties?: string[] | null
          coverage_areas?: Json | null
          created_at?: string
          date?: string | null
          date_scraped?: string | null
          designations?: Json | null
          dom?: number | null
          dual_units?: number | null
          dual_volume?: number | null
          email?: string | null
          email2?: string | null
          engagement_score?: number | null
          experience?: number | null
          facebook_url?: string | null
          farm_areas?: Json | null
          first_name?: string | null
          form_submission_count?: number | null
          full_address?: string | null
          full_name?: string
          has_bio?: boolean | null
          has_photo?: boolean | null
          high_price_point?: number | null
          homes_com_url?: string | null
          id?: string
          image_url?: string | null
          instagram_url?: string | null
          interested_in_opportunities?: boolean | null
          ip_address?: string | null
          is_claimed?: boolean | null
          languages?: Json | null
          last_contacted_at?: string | null
          last_enriched_at?: string | null
          last_form_submission_at?: string | null
          last_name?: string | null
          last_responded_at?: string | null
          last_sale_date?: string | null
          last_viewed_at?: string | null
          lead_price?: number | null
          lead_source?: string | null
          lender_company_nmls?: string | null
          lender_name?: string | null
          license?: string | null
          license_number?: string | null
          license_states?: Json | null
          license_type?: string | null
          linkedin_url?: string | null
          list_to_sell_ratio?: number | null
          loan_purposes?: Json | null
          loan_types_specialized?: Json | null
          loans_closed_12mo?: number | null
          low_price_point?: number | null
          luxury_volume?: number | null
          market_coverage_completed?: boolean | null
          match_to?: string | null
          matching_completed?: boolean | null
          max_loans_per_month?: number | null
          monthly_loan_volume?: number | null
          motivation?: number | null
          nmls_id?: string | null
          nmls_verified?: boolean | null
          nmls_verified_at?: string | null
          notes?: string | null
          off_market_deals?: number | null
          on_time_close_rate?: number | null
          onboarding_completed?: boolean | null
          open_to_company_offers?: boolean | null
          original_status?: string | null
          partnership_fee_structure?: string | null
          percent_financed?: number | null
          phone?: string
          phone2?: string | null
          photo_url?: string | null
          pipeline_stage?: string | null
          pipeline_type?: string | null
          preferred_contact_method?: string | null
          price_range?: string | null
          price_range_max?: number | null
          price_range_min?: number | null
          price_reductions?: number | null
          primary_neighborhoods?: Json | null
          pro_type?: Database["public"]["Enums"]["lead_type"] | null
          profile_completed?: boolean | null
          profile_completeness?: number | null
          profile_url?: string | null
          profile_views?: number | null
          property_types?: Json | null
          provides_leads_to_agents?: boolean | null
          purchase_percentage?: number | null
          qualification_score?: number | null
          radius?: number | null
          realtor_com_url?: string | null
          referrer_url?: string | null
          refinance_percentage?: number | null
          rental_volume?: number | null
          response_rate?: number | null
          seller_financed?: number | null
          seller_percentage?: number | null
          seller_side_percentage?: number | null
          seller_units?: number | null
          seller_volume?: number | null
          service_radius_miles?: number | null
          signup_ip?: string | null
          skills?: string[] | null
          source?: string | null
          specialization?: string | null
          specializations?: Json | null
          state_license?: string | null
          state_licenses?: Json | null
          states?: string[] | null
          status?: string
          tags?: string[] | null
          team?: string | null
          team_size?: number | null
          tiktok_url?: string | null
          times_contacted?: number | null
          top_lender?: string | null
          top_lender_share?: number | null
          top_lender_volume?: number | null
          top_originator?: string | null
          top_originator_share?: number | null
          top_originator_volume?: number | null
          total_sales?: number | null
          total_units?: number | null
          total_volume?: number | null
          total_volume_12mo?: number | null
          transactions?: number | null
          transactions_12mo?: number | null
          transactions_per_year?: number | null
          twitter_url?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          wants?: string[] | null
          website_url?: string | null
          years_experience?: number | null
          youtube_url?: string | null
          zip_codes?: string[] | null
        }
        Relationships: []
      }
      qualification_questions: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          options: Json | null
          order_index: number
          question_text: string
          question_type: string
          required: boolean | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          options?: Json | null
          order_index: number
          question_text: string
          question_type: string
          required?: boolean | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          options?: Json | null
          order_index?: number
          question_text?: string
          question_type?: string
          required?: boolean | null
        }
        Relationships: []
      }
      rate_limit_alerts: {
        Row: {
          alert_sent: boolean | null
          attempts_blocked: number
          created_at: string
          endpoint: string
          first_blocked_at: string
          id: string
          identifier: string
          last_blocked_at: string
        }
        Insert: {
          alert_sent?: boolean | null
          attempts_blocked?: number
          created_at?: string
          endpoint: string
          first_blocked_at?: string
          id?: string
          identifier: string
          last_blocked_at?: string
        }
        Update: {
          alert_sent?: boolean | null
          attempts_blocked?: number
          created_at?: string
          endpoint?: string
          first_blocked_at?: string
          id?: string
          identifier?: string
          last_blocked_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          attempt_count: number | null
          created_at: string | null
          endpoint: string
          id: string
          identifier: string
          window_start: string | null
        }
        Insert: {
          attempt_count?: number | null
          created_at?: string | null
          endpoint: string
          id?: string
          identifier: string
          window_start?: string | null
        }
        Update: {
          attempt_count?: number | null
          created_at?: string | null
          endpoint?: string
          id?: string
          identifier?: string
          window_start?: string | null
        }
        Relationships: []
      }
      saved_pros: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          pro_id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          pro_id: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          pro_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_pros_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_pros_pro_id_fkey"
            columns: ["pro_id"]
            isOneToOne: false
            referencedRelation: "pros"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          created_at: string
          endpoint: string | null
          error_message: string | null
          event_type: string
          id: string
          ip_address: unknown
          metadata: Json | null
          request_method: string | null
          request_payload: Json | null
          severity: string
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          endpoint?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          request_method?: string | null
          request_payload?: Json | null
          severity: string
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          endpoint?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          request_method?: string | null
          request_payload?: Json | null
          severity?: string
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      signup_links: {
        Row: {
          active: boolean | null
          created_at: string | null
          created_by: string | null
          current_uses: number | null
          custom_verbiage: Json | null
          description: string | null
          expires_at: string | null
          id: string
          link_slug: string
          max_uses: number | null
          name: string
          package_id: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          custom_verbiage?: Json | null
          description?: string | null
          expires_at?: string | null
          id?: string
          link_slug: string
          max_uses?: number | null
          name: string
          package_id?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          custom_verbiage?: Json | null
          description?: string | null
          expires_at?: string | null
          id?: string
          link_slug?: string
          max_uses?: number | null
          name?: string
          package_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signup_links_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "pricing_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_activity_log: {
        Row: {
          account_sid: string | null
          campaign_id: string | null
          cost_cents: number | null
          created_at: string
          direction: string
          error_code: string | null
          error_message: string | null
          from_number: string
          id: string
          message_body: string | null
          message_sid: string | null
          metadata: Json | null
          provider: string
          status: string
          to_number: string
          user_id: string | null
        }
        Insert: {
          account_sid?: string | null
          campaign_id?: string | null
          cost_cents?: number | null
          created_at?: string
          direction: string
          error_code?: string | null
          error_message?: string | null
          from_number: string
          id?: string
          message_body?: string | null
          message_sid?: string | null
          metadata?: Json | null
          provider?: string
          status: string
          to_number: string
          user_id?: string | null
        }
        Update: {
          account_sid?: string | null
          campaign_id?: string | null
          cost_cents?: number | null
          created_at?: string
          direction?: string
          error_code?: string | null
          error_message?: string | null
          from_number?: string
          id?: string
          message_body?: string | null
          message_sid?: string | null
          metadata?: Json | null
          provider?: string
          status?: string
          to_number?: string
          user_id?: string | null
        }
        Relationships: []
      }
      sms_consent_log: {
        Row: {
          consent_given: boolean
          consent_method: string
          consent_text: string
          consent_timestamp: string
          created_at: string | null
          double_opt_in_confirmed: boolean | null
          id: string
          ip_address: unknown
          opt_out_timestamp: string | null
          phone_number: string
        }
        Insert: {
          consent_given: boolean
          consent_method: string
          consent_text: string
          consent_timestamp: string
          created_at?: string | null
          double_opt_in_confirmed?: boolean | null
          id?: string
          ip_address?: unknown
          opt_out_timestamp?: string | null
          phone_number: string
        }
        Update: {
          consent_given?: boolean
          consent_method?: string
          consent_text?: string
          consent_timestamp?: string
          created_at?: string | null
          double_opt_in_confirmed?: boolean | null
          id?: string
          ip_address?: unknown
          opt_out_timestamp?: string | null
          phone_number?: string
        }
        Relationships: []
      }
      sms_logs: {
        Row: {
          created_at: string
          error_message: string | null
          external_id: string | null
          from_number: string | null
          id: string
          message_body: string
          metadata: Json | null
          provider_name: string
          provider_type: string
          sent_by: string | null
          status: string
          to_number: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          from_number?: string | null
          id?: string
          message_body: string
          metadata?: Json | null
          provider_name: string
          provider_type: string
          sent_by?: string | null
          status?: string
          to_number: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          external_id?: string | null
          from_number?: string | null
          id?: string
          message_body?: string
          metadata?: Json | null
          provider_name?: string
          provider_type?: string
          sent_by?: string | null
          status?: string
          to_number?: string
        }
        Relationships: []
      }
      sms_provider_configs: {
        Row: {
          config_data: Json
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          is_default: boolean
          priority: number
          provider_name: string
          provider_type: string
          updated_at: string
          use_for_admin: boolean | null
          use_for_clients: boolean | null
        }
        Insert: {
          config_data?: Json
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          priority?: number
          provider_name: string
          provider_type: string
          updated_at?: string
          use_for_admin?: boolean | null
          use_for_clients?: boolean | null
        }
        Update: {
          config_data?: Json
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          priority?: number
          provider_name?: string
          provider_type?: string
          updated_at?: string
          use_for_admin?: boolean | null
          use_for_clients?: boolean | null
        }
        Relationships: []
      }
      sms_templates: {
        Row: {
          active: boolean | null
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          message_content: string
          template_key: string
          template_name: string
          twilio_account_id: string | null
          twilio_number: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          message_content: string
          template_key: string
          template_name: string
          twilio_account_id?: string | null
          twilio_number?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          message_content?: string
          template_key?: string
          template_name?: string
          twilio_account_id?: string | null
          twilio_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_templates_twilio_account_id_fkey"
            columns: ["twilio_account_id"]
            isOneToOne: false
            referencedRelation: "twilio_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      states: {
        Row: {
          abbreviation: string
          country: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          abbreviation: string
          country?: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          abbreviation?: string
          country?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      support_ticket_replies: {
        Row: {
          created_at: string | null
          id: string
          is_staff_reply: boolean | null
          message: string
          ticket_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_staff_reply?: boolean | null
          message: string
          ticket_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_staff_reply?: boolean | null
          message?: string
          ticket_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_replies_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string | null
          id: string
          message: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          ticket_number: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category: string
          created_at?: string | null
          id?: string
          message: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
          ticket_number: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string | null
          id?: string
          message?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sync_configuration: {
        Row: {
          created_at: string | null
          external_key: string
          external_url: string
          id: number
          two_way_sync: boolean | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          external_key: string
          external_url: string
          id?: number
          two_way_sync?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          external_key?: string
          external_url?: string
          id?: number
          two_way_sync?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          created_at: string
          details: Json | null
          failed_tables: number
          id: string
          synced_at: string
          total_errors: number
          total_records: number
        }
        Insert: {
          created_at?: string
          details?: Json | null
          failed_tables?: number
          id?: string
          synced_at?: string
          total_errors?: number
          total_records?: number
        }
        Update: {
          created_at?: string
          details?: Json | null
          failed_tables?: number
          id?: string
          synced_at?: string
          total_errors?: number
          total_records?: number
        }
        Relationships: []
      }
      system_health: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          last_check_at: string
          metadata: Json | null
          response_time_ms: number | null
          service_name: string
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_check_at?: string
          metadata?: Json | null
          response_time_ms?: number | null
          service_name: string
          status: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_check_at?: string
          metadata?: Json | null
          response_time_ms?: number | null
          service_name?: string
          status?: string
        }
        Relationships: []
      }
      temporary_passwords: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      twilio_accounts: {
        Row: {
          account_name: string
          account_sid: string
          active: boolean | null
          auth_token: string
          created_at: string
          created_by: string | null
          id: string
          is_default: boolean | null
          updated_at: string
        }
        Insert: {
          account_name: string
          account_sid: string
          active?: boolean | null
          auth_token: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_sid?: string
          active?: boolean | null
          auth_token?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      two_factor_verifications: {
        Row: {
          attempts: number
          created_at: string
          expires_at: string
          id: string
          ip_address: string
          is_used: boolean
          max_attempts: number
          phone_number: string
          user_id: string
          verification_code: string
          verified_at: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          expires_at: string
          id?: string
          ip_address: string
          is_used?: boolean
          max_attempts?: number
          phone_number: string
          user_id: string
          verification_code: string
          verified_at?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string
          is_used?: boolean
          max_attempts?: number
          phone_number?: string
          user_id?: string
          verification_code?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      url_redirects: {
        Row: {
          created_at: string
          created_by: string | null
          from_path: string
          hit_count: number
          id: string
          is_active: boolean
          last_hit_at: string | null
          notes: string | null
          redirect_type: string
          status_code: number
          to_path: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          from_path: string
          hit_count?: number
          id?: string
          is_active?: boolean
          last_hit_at?: string | null
          notes?: string | null
          redirect_type?: string
          status_code?: number
          to_path: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          from_path?: string
          hit_count?: number
          id?: string
          is_active?: boolean
          last_hit_at?: string | null
          notes?: string | null
          redirect_type?: string
          status_code?: number
          to_path?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_trusted_ips: {
        Row: {
          created_at: string
          first_seen_at: string
          id: string
          ip_address: string
          is_active: boolean
          last_used_at: string
          location_info: Json | null
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          first_seen_at?: string
          id?: string
          ip_address: string
          is_active?: boolean
          last_used_at?: string
          location_info?: Json | null
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          first_seen_at?: string
          id?: string
          ip_address?: string
          is_active?: boolean
          last_used_at?: string
          location_info?: Json | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      zapier_api_keys: {
        Row: {
          active: boolean
          api_key_hash: string
          created_at: string
          id: string
          last_used_at: string | null
          name: string
          user_id: string
        }
        Insert: {
          active?: boolean
          api_key_hash: string
          created_at?: string
          id?: string
          last_used_at?: string | null
          name: string
          user_id: string
        }
        Update: {
          active?: boolean
          api_key_hash?: string
          created_at?: string
          id?: string
          last_used_at?: string | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      zapier_logs: {
        Row: {
          action: string
          created_at: string
          entity_count: number | null
          entity_type: string
          error_message: string | null
          id: string
          status: string
          user_id: string
          webhook_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_count?: number | null
          entity_type: string
          error_message?: string | null
          id?: string
          status: string
          user_id: string
          webhook_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_count?: number | null
          entity_type?: string
          error_message?: string | null
          id?: string
          status?: string
          user_id?: string
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zapier_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "zapier_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      zapier_webhooks: {
        Row: {
          active: boolean | null
          created_at: string
          entity_type: string
          id: string
          updated_at: string
          user_id: string
          webhook_type: string
          webhook_url: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          entity_type: string
          id?: string
          updated_at?: string
          user_id: string
          webhook_type: string
          webhook_url: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          entity_type?: string
          id?: string
          updated_at?: string
          user_id?: string
          webhook_type?: string
          webhook_url?: string
        }
        Relationships: []
      }
      zip_codes: {
        Row: {
          city_id: string | null
          county_id: string | null
          created_at: string
          id: string
          latitude: number
          longitude: number
          state_id: string
          zip_code: string
          zip_type: string | null
        }
        Insert: {
          city_id?: string | null
          county_id?: string | null
          created_at?: string
          id?: string
          latitude: number
          longitude: number
          state_id: string
          zip_code: string
          zip_type?: string | null
        }
        Update: {
          city_id?: string | null
          county_id?: string | null
          created_at?: string
          id?: string
          latitude?: number
          longitude?: number
          state_id?: string
          zip_code?: string
          zip_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zip_codes_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zip_codes_county_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zip_codes_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      are_types_compatible: {
        Args: { p_client_type: string; p_pro_type: string }
        Returns: boolean
      }
      calculate_bid_match_score: {
        Args: {
          bid_coverage: Json
          bid_criteria: Json
          pro_coverage: Json
          pro_data: Json
        }
        Returns: number
      }
      calculate_coverage_quality_score: {
        Args: { coverage_id: string }
        Returns: {
          breadth: number
          completeness: number
          demand_overlap: number
          details: Json
          total_score: number
        }[]
      }
      calculate_lead_score: { Args: { p_match_id: string }; Returns: number }
      calculate_pricing_tier: {
        Args: {
          p_experience: number
          p_qualification_score: number
          p_transactions: number
        }
        Returns: string
      }
      calculate_profile_completeness: {
        Args: { p_pro_id: string }
        Returns: number
      }
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_identifier: string
          p_max_requests: number
          p_window_minutes: number
        }
        Returns: boolean
      }
      cleanup_expired_2fa_codes: { Args: never; Returns: undefined }
      convert_directory_to_lead: {
        Args: { p_pro_id: string }
        Returns: boolean
      }
      find_all_duplicate_leads: {
        Args: never
        Returns: {
          duplicate_count: number
          lead_ids: string[]
          phone: string
        }[]
      }
      find_all_duplicate_pros: {
        Args: never
        Returns: {
          duplicate_count: number
          phone: string
          pro_ids: string[]
        }[]
      }
      find_duplicate_leads_by_phone: {
        Args: { phone_number: string }
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string
          source: string
        }[]
      }
      find_duplicate_pros_by_phone: {
        Args: { phone_number: string }
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string
          source: string
        }[]
      }
      find_redirect: {
        Args: { p_path: string }
        Returns: {
          status_code: number
          to_path: string
        }[]
      }
      generate_full_name: {
        Args: { first: string; last: string }
        Returns: string
      }
      generate_package_access_token: { Args: never; Returns: string }
      generate_ticket_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_unlocked_agent: {
        Args: { p_client_id: string; p_pro_id: string }
        Returns: boolean
      }
      increment_profile_views: {
        Args: { profile_id: string }
        Returns: {
          view_count: number
        }[]
      }
      is_client_owner: {
        Args: { _client_id: string; _user_id: string }
        Returns: boolean
      }
      is_pro_owner: {
        Args: { _pro_id: string; _user_id: string }
        Returns: boolean
      }
      is_user_active: { Args: { _user_id: string }; Returns: boolean }
      merge_leads: {
        Args: { duplicate_lead_id: string; primary_lead_id: string }
        Returns: undefined
      }
      merge_pros: {
        Args: { duplicate_pro_id: string; primary_pro_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "staff" | "client" | "lead" | "admin"
      client_type: "real_estate" | "mortgage"
      lead_type: "real_estate_agent" | "mortgage_officer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["staff", "client", "lead", "admin"],
      client_type: ["real_estate", "mortgage"],
      lead_type: ["real_estate_agent", "mortgage_officer"],
    },
  },
} as const

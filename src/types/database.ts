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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_stream: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          org_id: string | null
          payload: Json
          summary: string | null
          updated_at: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          org_id?: string | null
          payload?: Json
          summary?: string | null
          updated_at?: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          org_id?: string | null
          payload?: Json
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_stream_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_stream_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_stream_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      article_publications: {
        Row: {
          article_id: string
          channel: string
          created_at: string
          id: string
          metadata: Json
          published_at: string
          published_by: string | null
          published_url: string | null
          updated_at: string
        }
        Insert: {
          article_id: string
          channel?: string
          created_at?: string
          id?: string
          metadata?: Json
          published_at?: string
          published_by?: string | null
          published_url?: string | null
          updated_at?: string
        }
        Update: {
          article_id?: string
          channel?: string
          created_at?: string
          id?: string
          metadata?: Json
          published_at?: string
          published_by?: string | null
          published_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_publications_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_publications_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_publications_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_reviews: {
        Row: {
          article_id: string
          created_at: string
          decision: Database["public"]["Enums"]["article_review_decision"]
          edits: Json
          id: string
          review_notes: string | null
          review_step: string | null
          reviewer_user_id: string | null
          updated_at: string
        }
        Insert: {
          article_id: string
          created_at?: string
          decision: Database["public"]["Enums"]["article_review_decision"]
          edits?: Json
          id?: string
          review_notes?: string | null
          review_step?: string | null
          reviewer_user_id?: string | null
          updated_at?: string
        }
        Update: {
          article_id?: string
          created_at?: string
          decision?: Database["public"]["Enums"]["article_review_decision"]
          edits?: Json
          id?: string
          review_notes?: string | null
          review_step?: string | null
          reviewer_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_reviews_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_reviews_reviewer_user_id_fkey"
            columns: ["reviewer_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_reviews_reviewer_user_id_fkey"
            columns: ["reviewer_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          author_name_snapshot: string | null
          author_user_id: string | null
          category: string
          content: string
          created_at: string
          created_by: string | null
          department_id: string | null
          document_url: string | null
          id: string
          org_id: string
          published_at: string | null
          social_url: string | null
          status: Database["public"]["Enums"]["article_status"]
          summary: string | null
          title: string
          unit_id: string | null
          updated_at: string
          updated_by: string | null
          values_checklist: Json
        }
        Insert: {
          author_name_snapshot?: string | null
          author_user_id?: string | null
          category: string
          content: string
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          document_url?: string | null
          id?: string
          org_id: string
          published_at?: string | null
          social_url?: string | null
          status?: Database["public"]["Enums"]["article_status"]
          summary?: string | null
          title: string
          unit_id?: string | null
          updated_at?: string
          updated_by?: string | null
          values_checklist?: Json
        }
        Update: {
          author_name_snapshot?: string | null
          author_user_id?: string | null
          category?: string
          content?: string
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          document_url?: string | null
          id?: string
          org_id?: string
          published_at?: string | null
          social_url?: string | null
          status?: Database["public"]["Enums"]["article_status"]
          summary?: string | null
          title?: string
          unit_id?: string | null
          updated_at?: string
          updated_by?: string | null
          values_checklist?: Json
        }
        Relationships: [
          {
            foreignKeyName: "articles_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments_or_aayams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          bucket_name: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          file_size_bytes: number | null
          id: string
          metadata: Json
          mime_type: string | null
          object_path: string
          org_id: string | null
          original_file_name: string | null
          owner_user_id: string | null
          updated_at: string
          visibility: Database["public"]["Enums"]["attachment_visibility"]
        }
        Insert: {
          bucket_name: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          file_size_bytes?: number | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          object_path: string
          org_id?: string | null
          original_file_name?: string | null
          owner_user_id?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["attachment_visibility"]
        }
        Update: {
          bucket_name?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          file_size_bytes?: number | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          object_path?: string
          org_id?: string | null
          original_file_name?: string | null
          owner_user_id?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["attachment_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "attachments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          change_summary: Json
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          org_id: string | null
          payload: Json
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          change_summary?: Json
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          org_id?: string | null
          payload?: Json
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          change_summary?: Json
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          org_id?: string | null
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_user_id: string | null
          body: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          is_deleted: boolean
          org_id: string | null
          parent_comment_id: string | null
          updated_at: string
          visibility: Database["public"]["Enums"]["comment_visibility"]
        }
        Insert: {
          author_user_id?: string | null
          body: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          is_deleted?: boolean
          org_id?: string | null
          parent_comment_id?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["comment_visibility"]
        }
        Update: {
          author_user_id?: string | null
          body?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          is_deleted?: boolean
          org_id?: string | null
          parent_comment_id?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["comment_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_author_user_id_fkey"
            columns: ["author_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      departments_or_aayams: {
        Row: {
          code: string
          created_at: string
          department_kind: string
          id: string
          is_active: boolean
          metadata: Json
          name: string
          name_hi: string | null
          org_id: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          department_kind?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          name: string
          name_hi?: string | null
          org_id: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          department_kind?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          name?: string
          name_hi?: string | null
          org_id?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_or_aayams_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_or_aayams_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_tags: {
        Row: {
          created_at: string
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          tag_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          tag_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          tag_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_tags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_tags_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      event_form_configs: {
        Row: {
          allow_multiple_submissions: boolean
          closes_at: string | null
          collect_attending_count: boolean
          collect_city: boolean
          collect_notes: boolean
          collect_phone: boolean
          collect_special_needs: boolean
          created_at: string
          created_by: string | null
          event_id: string
          id: string
          is_enabled: boolean
          is_public: boolean
          max_registrations: number | null
          opens_at: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allow_multiple_submissions?: boolean
          closes_at?: string | null
          collect_attending_count?: boolean
          collect_city?: boolean
          collect_notes?: boolean
          collect_phone?: boolean
          collect_special_needs?: boolean
          created_at?: string
          created_by?: string | null
          event_id: string
          id?: string
          is_enabled?: boolean
          is_public?: boolean
          max_registrations?: number | null
          opens_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allow_multiple_submissions?: boolean
          closes_at?: string | null
          collect_attending_count?: boolean
          collect_city?: boolean
          collect_notes?: boolean
          collect_phone?: boolean
          collect_special_needs?: boolean
          created_at?: string
          created_by?: string | null
          event_id?: string
          id?: string
          is_enabled?: boolean
          is_public?: boolean
          max_registrations?: number | null
          opens_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_form_configs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_form_configs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_form_configs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_form_configs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_form_configs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_form_questions: {
        Row: {
          created_at: string
          created_by: string | null
          display_order: number
          event_id: string
          form_config_id: string
          id: string
          is_required: boolean
          label: string
          label_hi: string | null
          options_json: Json
          question_key: string
          question_type: Database["public"]["Enums"]["question_type"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          event_id: string
          form_config_id: string
          id?: string
          is_required?: boolean
          label: string
          label_hi?: string | null
          options_json?: Json
          question_key: string
          question_type?: Database["public"]["Enums"]["question_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_order?: number
          event_id?: string
          form_config_id?: string
          id?: string
          is_required?: boolean
          label?: string
          label_hi?: string | null
          options_json?: Json
          question_key?: string
          question_type?: Database["public"]["Enums"]["question_type"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_form_questions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_form_questions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_form_questions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_form_questions_form_config_id_fkey"
            columns: ["form_config_id"]
            isOneToOne: false
            referencedRelation: "event_form_configs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_form_questions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_form_questions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_poll_options: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          label: string
          poll_id: string
          scheduled_at: string | null
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          label: string
          poll_id: string
          scheduled_at?: string | null
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string
          poll_id?: string
          scheduled_at?: string | null
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_poll_options_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_poll_options_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "event_polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_poll_options_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_poll_options_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_poll_votes: {
        Row: {
          actor_user_id: string | null
          created_at: string
          id: string
          option_id: string
          poll_id: string
          submitted_from_ip: unknown
          submitted_user_agent: string | null
          updated_at: string
          voter_fingerprint_hash: string | null
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          id?: string
          option_id: string
          poll_id: string
          submitted_from_ip?: unknown
          submitted_user_agent?: string | null
          updated_at?: string
          voter_fingerprint_hash?: string | null
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          id?: string
          option_id?: string
          poll_id?: string
          submitted_from_ip?: unknown
          submitted_user_agent?: string | null
          updated_at?: string
          voter_fingerprint_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_poll_votes_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_poll_votes_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "event_poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "event_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      event_polls: {
        Row: {
          closes_at: string | null
          created_at: string
          created_by: string | null
          event_id: string
          finalized_at: string | null
          finalized_by: string | null
          id: string
          is_finalized: boolean
          is_public_voting: boolean
          opens_at: string | null
          poll_type: Database["public"]["Enums"]["poll_type"]
          question: string
          question_hi: string | null
          updated_at: string
          updated_by: string | null
          winner_option_id: string | null
        }
        Insert: {
          closes_at?: string | null
          created_at?: string
          created_by?: string | null
          event_id: string
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          is_finalized?: boolean
          is_public_voting?: boolean
          opens_at?: string | null
          poll_type?: Database["public"]["Enums"]["poll_type"]
          question: string
          question_hi?: string | null
          updated_at?: string
          updated_by?: string | null
          winner_option_id?: string | null
        }
        Update: {
          closes_at?: string | null
          created_at?: string
          created_by?: string | null
          event_id?: string
          finalized_at?: string | null
          finalized_by?: string | null
          id?: string
          is_finalized?: boolean
          is_public_voting?: boolean
          opens_at?: string | null
          poll_type?: Database["public"]["Enums"]["poll_type"]
          question?: string
          question_hi?: string | null
          updated_at?: string
          updated_by?: string | null
          winner_option_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_polls_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_polls_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_polls_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_polls_finalized_by_fkey"
            columns: ["finalized_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_polls_finalized_by_fkey"
            columns: ["finalized_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_polls_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_polls_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_polls_winner_option_fk"
            columns: ["winner_option_id"]
            isOneToOne: false
            referencedRelation: "event_poll_options"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registration_answers: {
        Row: {
          answer_json: Json | null
          answer_text: string | null
          created_at: string
          id: string
          question_id: string
          registration_id: string
          updated_at: string
        }
        Insert: {
          answer_json?: Json | null
          answer_text?: string | null
          created_at?: string
          id?: string
          question_id: string
          registration_id: string
          updated_at?: string
        }
        Update: {
          answer_json?: Json | null
          answer_text?: string | null
          created_at?: string
          id?: string
          question_id?: string
          registration_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registration_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "event_form_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registration_answers_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "event_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          answers_payload: Json
          attending_count: number
          city: string | null
          created_at: string
          created_by: string | null
          event_id: string
          has_special_needs: boolean
          id: string
          name: string
          notes: string | null
          phone: string | null
          public_submission_key_hash: string | null
          registrant_user_id: string | null
          submitted_from_ip: unknown
          submitted_user_agent: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          answers_payload?: Json
          attending_count?: number
          city?: string | null
          created_at?: string
          created_by?: string | null
          event_id: string
          has_special_needs?: boolean
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          public_submission_key_hash?: string | null
          registrant_user_id?: string | null
          submitted_from_ip?: unknown
          submitted_user_agent?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          answers_payload?: Json
          attending_count?: number
          city?: string | null
          created_at?: string
          created_by?: string | null
          event_id?: string
          has_special_needs?: boolean
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          public_submission_key_hash?: string | null
          registrant_user_id?: string | null
          submitted_from_ip?: unknown
          submitted_user_agent?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_registrant_user_id_fkey"
            columns: ["registrant_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_registrant_user_id_fkey"
            columns: ["registrant_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          event_id: string
          id: string
          new_status: Database["public"]["Enums"]["event_status"]
          old_status: Database["public"]["Enums"]["event_status"] | null
          reason: string | null
          updated_at: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          event_id: string
          id?: string
          new_status: Database["public"]["Enums"]["event_status"]
          old_status?: Database["public"]["Enums"]["event_status"] | null
          reason?: string | null
          updated_at?: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          event_id?: string
          id?: string
          new_status?: Database["public"]["Enums"]["event_status"]
          old_status?: Database["public"]["Enums"]["event_status"] | null
          reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_status_history_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          checklist: Json
          created_at: string
          created_by: string | null
          date_label_override: string | null
          date_source: string
          department_id: string | null
          description: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          location_id: string | null
          metadata: Json
          org_id: string
          public_page_enabled: boolean
          published_at: string | null
          registration_public_enabled: boolean
          report: string | null
          starts_at: string
          status: Database["public"]["Enums"]["event_status"]
          submitted_by_name_snapshot: string | null
          submitted_by_user_id: string | null
          timezone: string
          title: string
          unit_id: string | null
          updated_at: string
          updated_by: string | null
          video_url: string | null
          voting_public_enabled: boolean
          vritt_attendance_count: number | null
          vritt_content: string | null
          vritt_media_urls: string[] | null
          vritt_status: string | null
          vritt_updated_at: string | null
          workflow_template_id: string | null
        }
        Insert: {
          checklist?: Json
          created_at?: string
          created_by?: string | null
          date_label_override?: string | null
          date_source?: string
          department_id?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          location_id?: string | null
          metadata?: Json
          org_id: string
          public_page_enabled?: boolean
          published_at?: string | null
          registration_public_enabled?: boolean
          report?: string | null
          starts_at: string
          status?: Database["public"]["Enums"]["event_status"]
          submitted_by_name_snapshot?: string | null
          submitted_by_user_id?: string | null
          timezone?: string
          title: string
          unit_id?: string | null
          updated_at?: string
          updated_by?: string | null
          video_url?: string | null
          voting_public_enabled?: boolean
          vritt_attendance_count?: number | null
          vritt_content?: string | null
          vritt_media_urls?: string[] | null
          vritt_status?: string | null
          vritt_updated_at?: string | null
          workflow_template_id?: string | null
        }
        Update: {
          checklist?: Json
          created_at?: string
          created_by?: string | null
          date_label_override?: string | null
          date_source?: string
          department_id?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          location_id?: string | null
          metadata?: Json
          org_id?: string
          public_page_enabled?: boolean
          published_at?: string | null
          registration_public_enabled?: boolean
          report?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          submitted_by_name_snapshot?: string | null
          submitted_by_user_id?: string | null
          timezone?: string
          title?: string
          unit_id?: string | null
          updated_at?: string
          updated_by?: string | null
          video_url?: string | null
          voting_public_enabled?: boolean
          vritt_attendance_count?: number | null
          vritt_content?: string | null
          vritt_media_urls?: string[] | null
          vritt_status?: string | null
          vritt_updated_at?: string | null
          workflow_template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments_or_aayams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_submitted_by_user_id_fkey"
            columns: ["submitted_by_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_submitted_by_user_id_fkey"
            columns: ["submitted_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_workflow_template_id_fkey"
            columns: ["workflow_template_id"]
            isOneToOne: false
            referencedRelation: "workflow_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          metadata: Json
          name: string
          org_id: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json
          name: string
          org_id: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          metadata?: Json
          name?: string
          org_id?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_user_id: string | null
          body: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          kind: Database["public"]["Enums"]["notification_kind"]
          link_path: string | null
          org_id: string | null
          payload: Json
          read_at: string | null
          recipient_user_id: string
          title: string
          updated_at: string
        }
        Insert: {
          actor_user_id?: string | null
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          kind?: Database["public"]["Enums"]["notification_kind"]
          link_path?: string | null
          org_id?: string | null
          payload?: Json
          read_at?: string | null
          recipient_user_id: string
          title: string
          updated_at?: string
        }
        Update: {
          actor_user_id?: string | null
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          kind?: Database["public"]["Enums"]["notification_kind"]
          link_path?: string | null
          org_id?: string | null
          payload?: Json
          read_at?: string | null
          recipient_user_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      org_settings: {
        Row: {
          created_at: string
          default_timezone: string
          feature_flags: Json
          id: string
          is_active: boolean
          org_code: string
          org_name: string
          settings: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_timezone?: string
          feature_flags?: Json
          id?: string
          is_active?: boolean
          org_code: string
          org_name: string
          settings?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_timezone?: string
          feature_flags?: Json
          id?: string
          is_active?: boolean
          org_code?: string
          org_name?: string
          settings?: Json
          updated_at?: string
        }
        Relationships: []
      }
      prachar_statuses: {
        Row: {
          created_at: string
          event_id: string
          facebook_done: boolean
          facebook_skip_reason: string | null
          id: string
          instagram_done: boolean
          instagram_skip_reason: string | null
          last_updated_at: string | null
          last_updated_by: string | null
          telegram_done: boolean
          telegram_skip_reason: string | null
          template_reference: string | null
          updated_at: string
          whatsapp_done: boolean
          whatsapp_skip_reason: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          facebook_done?: boolean
          facebook_skip_reason?: string | null
          id?: string
          instagram_done?: boolean
          instagram_skip_reason?: string | null
          last_updated_at?: string | null
          last_updated_by?: string | null
          telegram_done?: boolean
          telegram_skip_reason?: string | null
          template_reference?: string | null
          updated_at?: string
          whatsapp_done?: boolean
          whatsapp_skip_reason?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          facebook_done?: boolean
          facebook_skip_reason?: string | null
          id?: string
          instagram_done?: boolean
          instagram_skip_reason?: string | null
          last_updated_at?: string | null
          last_updated_by?: string | null
          telegram_done?: boolean
          telegram_skip_reason?: string | null
          template_reference?: string | null
          updated_at?: string
          whatsapp_done?: boolean
          whatsapp_skip_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prachar_statuses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prachar_statuses_last_updated_by_fkey"
            columns: ["last_updated_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prachar_statuses_last_updated_by_fkey"
            columns: ["last_updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          default_department_id: string | null
          default_unit_id: string | null
          display_name: string | null
          email: string | null
          id: string
          is_active: boolean
          org_id: string | null
          phone: string | null
          preferred_language: string
          profile_metadata: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_department_id?: string | null
          default_unit_id?: string | null
          display_name?: string | null
          email?: string | null
          id: string
          is_active?: boolean
          org_id?: string | null
          phone?: string | null
          preferred_language?: string
          profile_metadata?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_department_id?: string | null
          default_unit_id?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          org_id?: string | null
          phone?: string | null
          preferred_language?: string
          profile_metadata?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_default_department_id_fkey"
            columns: ["default_department_id"]
            isOneToOne: false
            referencedRelation: "departments_or_aayams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_default_unit_id_fkey"
            columns: ["default_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          name_hi: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          name_hi?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          name_hi?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          label: string
          org_id: string
          tag_key: string
          tag_type: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          label: string
          org_id: string
          tag_key: string
          tag_type?: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          label?: string
          org_id?: string
          tag_key?: string
          tag_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          metadata: Json
          name: string
          name_hi: string | null
          org_id: string
          parent_unit_id: string | null
          unit_kind: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          name: string
          name_hi?: string | null
          org_id: string
          parent_unit_id?: string | null
          unit_kind?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          name?: string
          name_hi?: string | null
          org_id?: string
          parent_unit_id?: string | null
          unit_kind?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_parent_unit_id_fkey"
            columns: ["parent_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      user_role_assignments: {
        Row: {
          created_at: string
          department_id: string | null
          ends_at: string | null
          id: string
          is_primary: boolean
          org_id: string | null
          role_id: string
          scope_entity_id: string | null
          scope_type: Database["public"]["Enums"]["assignment_scope_type"]
          starts_at: string | null
          unit_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          ends_at?: string | null
          id?: string
          is_primary?: boolean
          org_id?: string | null
          role_id: string
          scope_entity_id?: string | null
          scope_type?: Database["public"]["Enums"]["assignment_scope_type"]
          starts_at?: string | null
          unit_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          ends_at?: string | null
          id?: string
          is_primary?: boolean
          org_id?: string | null
          role_id?: string
          scope_entity_id?: string | null
          scope_type?: Database["public"]["Enums"]["assignment_scope_type"]
          starts_at?: string | null
          unit_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_role_assignments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments_or_aayams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_assignments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_assignments_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vimarsh_resources: {
        Row: {
          created_at: string | null
          id: string
          resource_type: string
          title: string
          topic_id: string
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          resource_type: string
          title: string
          topic_id: string
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          resource_type?: string
          title?: string
          topic_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "vimarsh_resources_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "vimarsh_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      vimarsh_topics: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          org_id: string
          sort_order: number | null
          title: string
          title_hi: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          org_id: string
          sort_order?: number | null
          title: string
          title_hi?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          org_id?: string
          sort_order?: number | null
          title?: string
          title_hi?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vimarsh_topics_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_steps: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_required: boolean
          required_role_id: string | null
          step_key: string
          step_name: string
          step_order: number
          template_id: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_required?: boolean
          required_role_id?: string | null
          step_key: string
          step_name: string
          step_order: number
          template_id: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_required?: boolean
          required_role_id?: string | null
          step_key?: string
          step_name?: string
          step_order?: number
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_steps_required_role_id_fkey"
            columns: ["required_role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_steps_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workflow_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_templates: {
        Row: {
          code: string
          config: Json
          created_at: string
          entity_type: string
          id: string
          is_active: boolean
          name: string
          org_id: string
          updated_at: string
        }
        Insert: {
          code: string
          config?: Json
          created_at?: string
          entity_type: string
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          config?: Json
          created_at?: string
          entity_type?: string
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_settings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      app_users: {
        Row: {
          created_at: string | null
          default_department_id: string | null
          default_unit_id: string | null
          display_name: string | null
          email: string | null
          id: string | null
          is_active: boolean | null
          org_id: string | null
          phone: string | null
          preferred_language: string | null
          profile_metadata: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_department_id?: string | null
          default_unit_id?: string | null
          display_name?: string | null
          email?: string | null
          id?: string | null
          is_active?: boolean | null
          org_id?: string | null
          phone?: string | null
          preferred_language?: string | null
          profile_metadata?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_department_id?: string | null
          default_unit_id?: string | null
          display_name?: string | null
          email?: string | null
          id?: string | null
          is_active?: boolean | null
          org_id?: string | null
          phone?: string | null
          preferred_language?: string | null
          profile_metadata?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_default_department_id_fkey"
            columns: ["default_department_id"]
            isOneToOne: false
            referencedRelation: "departments_or_aayams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_default_unit_id_fkey"
            columns: ["default_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org_settings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_create_article_for_scope: {
        Args: { p_department_id: string; p_org_id: string; p_unit_id: string }
        Returns: boolean
      }
      can_create_event_for_scope: {
        Args: { p_department_id: string; p_org_id: string; p_unit_id: string }
        Returns: boolean
      }
      can_manage_article: { Args: { p_article_id: string }; Returns: boolean }
      can_manage_event: { Args: { p_event_id: string }; Returns: boolean }
      can_publish_article: { Args: { p_article_id: string }; Returns: boolean }
      can_publish_event: { Args: { p_event_id: string }; Returns: boolean }
      can_read_article: { Args: { p_article_id: string }; Returns: boolean }
      can_read_event: { Args: { p_event_id: string }; Returns: boolean }
      can_read_prachar: { Args: { p_event_id: string }; Returns: boolean }
      can_update_prachar: { Args: { p_event_id: string }; Returns: boolean }
      current_role_codes: { Args: never; Returns: string[] }
      event_public_registration_open: {
        Args: { p_event_id: string }
        Returns: boolean
      }
      has_any_role: { Args: { codes: string[] }; Returns: boolean }
      has_scoped_role: {
        Args: {
          p_department_id?: string
          p_entity_id?: string
          p_entity_type?: string
          p_org_id: string
          p_role_codes: string[]
          p_unit_id?: string
        }
        Returns: boolean
      }
      is_manager: { Args: never; Returns: boolean }
      poll_public_voting_open: { Args: { p_poll_id: string }; Returns: boolean }
      unit_is_ancestor_or_self: {
        Args: { p_ancestor_unit_id: string; p_unit_id: string }
        Returns: boolean
      }
    }
    Enums: {
      article_review_decision:
        | "approved"
        | "forwarded"
        | "changes_requested"
        | "rejected"
      article_status:
        | "draft"
        | "pending_unit_head_review"
        | "pending_aayam_review"
        | "published"
        | "archived"
      assignment_scope_type: "org" | "unit" | "department" | "event" | "article"
      attachment_visibility: "private" | "org" | "public"
      comment_visibility: "org" | "internal" | "public"
      event_status:
        | "draft"
        | "pending_aayam_review"
        | "pending_final_approval"
        | "published"
        | "cancelled"
      notification_kind:
        | "workflow"
        | "event_review"
        | "article_review"
        | "registration"
        | "poll_result"
        | "reminder"
        | "system"
      poll_type: "date" | "general"
      question_type:
        | "text"
        | "yesno"
        | "single_choice"
        | "multi_choice"
        | "number"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
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
      article_review_decision: [
        "approved",
        "forwarded",
        "changes_requested",
        "rejected",
      ],
      article_status: [
        "draft",
        "pending_unit_head_review",
        "pending_aayam_review",
        "published",
        "archived",
      ],
      assignment_scope_type: ["org", "unit", "department", "event", "article"],
      attachment_visibility: ["private", "org", "public"],
      comment_visibility: ["org", "internal", "public"],
      event_status: [
        "draft",
        "pending_aayam_review",
        "pending_final_approval",
        "published",
        "cancelled",
      ],
      notification_kind: [
        "workflow",
        "event_review",
        "article_review",
        "registration",
        "poll_result",
        "reminder",
        "system",
      ],
      poll_type: ["date", "general"],
      question_type: [
        "text",
        "yesno",
        "single_choice",
        "multi_choice",
        "number",
      ],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const

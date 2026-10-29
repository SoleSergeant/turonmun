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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_name: string | null
          created_at: string
          details: Json
          entity: string
          entity_id: string | null
          id: number
          summary: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_name?: string | null
          created_at?: string
          details?: Json
          entity: string
          entity_id?: string | null
          id?: never
          summary: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_name?: string | null
          created_at?: string
          details?: Json
          entity?: string
          entity_id?: string | null
          id?: never
          summary?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          checked_in_at: string | null
          checked_in_by: string | null
          committee_id: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          password_hash: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          checked_in_at?: string | null
          checked_in_by?: string | null
          committee_id?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          password_hash?: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          checked_in_at?: string | null
          checked_in_by?: string | null
          committee_id?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          password_hash?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_users_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          application_id: string | null
          application_type: string
          assigned_committee_id: string | null
          certificate_url: string | null
          checked_in_at: string | null
          checked_in_by: string | null
          committee_preference1: string | null
          committee_preference2: string | null
          committee_preference3: string | null
          contacted: boolean
          contacted_at: string | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          decision_emailed_at: string | null
          dietary_restrictions: string | null
          discount_eligibility: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          experience: string | null
          fee_agreement: boolean | null
          final_confirmation: boolean | null
          full_name: string | null
          has_ielts: boolean | null
          has_sat: boolean | null
          id: string
          ielts_certificate_url: string | null
          ielts_score: number | null
          institution: string | null
          issue_interest: string | null
          motivation: string | null
          notes: string | null
          payment_amount: number | null
          payment_reference: string | null
          payment_reminded_at: string | null
          payment_status: string | null
          phone: string | null
          photo_url: string | null
          portfolio_link: string | null
          previous_muns: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sat_certificate_url: string | null
          sat_score: number | null
          season: number | null
          status: string | null
          telegram_username: string | null
          unique_delegate_trait: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          application_id?: string | null
          application_type?: string
          assigned_committee_id?: string | null
          certificate_url?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          committee_preference1?: string | null
          committee_preference2?: string | null
          committee_preference3?: string | null
          contacted?: boolean
          contacted_at?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          decision_emailed_at?: string | null
          dietary_restrictions?: string | null
          discount_eligibility?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          experience?: string | null
          fee_agreement?: boolean | null
          final_confirmation?: boolean | null
          full_name?: string | null
          has_ielts?: boolean | null
          has_sat?: boolean | null
          id?: string
          ielts_certificate_url?: string | null
          ielts_score?: number | null
          institution?: string | null
          issue_interest?: string | null
          motivation?: string | null
          notes?: string | null
          payment_amount?: number | null
          payment_reference?: string | null
          payment_reminded_at?: string | null
          payment_status?: string | null
          phone?: string | null
          photo_url?: string | null
          portfolio_link?: string | null
          previous_muns?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sat_certificate_url?: string | null
          sat_score?: number | null
          season?: number | null
          status?: string | null
          telegram_username?: string | null
          unique_delegate_trait?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          application_id?: string | null
          application_type?: string
          assigned_committee_id?: string | null
          certificate_url?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          committee_preference1?: string | null
          committee_preference2?: string | null
          committee_preference3?: string | null
          contacted?: boolean
          contacted_at?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          decision_emailed_at?: string | null
          dietary_restrictions?: string | null
          discount_eligibility?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          experience?: string | null
          fee_agreement?: boolean | null
          final_confirmation?: boolean | null
          full_name?: string | null
          has_ielts?: boolean | null
          has_sat?: boolean | null
          id?: string
          ielts_certificate_url?: string | null
          ielts_score?: number | null
          institution?: string | null
          issue_interest?: string | null
          motivation?: string | null
          notes?: string | null
          payment_amount?: number | null
          payment_reference?: string | null
          payment_reminded_at?: string | null
          payment_status?: string | null
          phone?: string | null
          photo_url?: string | null
          portfolio_link?: string | null
          previous_muns?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sat_certificate_url?: string | null
          sat_score?: number | null
          season?: number | null
          status?: string | null
          telegram_username?: string | null
          unique_delegate_trait?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_assigned_committee_id_fkey"
            columns: ["assigned_committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          application_id: string | null
          created_at: string | null
          id: string
          is_voting: boolean | null
          session_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          application_id?: string | null
          created_at?: string | null
          id?: string
          is_voting?: boolean | null
          session_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          application_id?: string | null
          created_at?: string | null
          id?: string
          is_voting?: boolean | null
          session_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "committee_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      award_settings: {
        Row: {
          id: number
          locked: boolean
          published: boolean
          updated_at: string | null
        }
        Insert: {
          id?: number
          locked?: boolean
          published?: boolean
          updated_at?: string | null
        }
        Update: {
          id?: number
          locked?: boolean
          published?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      committee_announcements: {
        Row: {
          committee_id: string
          content: string
          created_at: string
          id: string
          recipients: string
          sent_by: string | null
          title: string
        }
        Insert: {
          committee_id: string
          content: string
          created_at?: string
          id?: string
          recipients?: string
          sent_by?: string | null
          title: string
        }
        Update: {
          committee_id?: string
          content?: string
          created_at?: string
          id?: string
          recipients?: string
          sent_by?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "committee_announcements_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "committee_announcements_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      committee_awards: {
        Row: {
          application_id: string | null
          award_type: string
          committee_id: string
          created_at: string | null
          id: string
          nominated_by: string | null
          photo_url: string | null
          updated_at: string | null
          winner_country: string | null
          winner_name: string | null
        }
        Insert: {
          application_id?: string | null
          award_type: string
          committee_id: string
          created_at?: string | null
          id?: string
          nominated_by?: string | null
          photo_url?: string | null
          updated_at?: string | null
          winner_country?: string | null
          winner_name?: string | null
        }
        Update: {
          application_id?: string | null
          award_type?: string
          committee_id?: string
          created_at?: string | null
          id?: string
          nominated_by?: string | null
          photo_url?: string | null
          updated_at?: string | null
          winner_country?: string | null
          winner_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "committee_awards_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "committee_awards_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "committee_awards_nominated_by_fkey"
            columns: ["nominated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      committee_sessions: {
        Row: {
          committee_id: string | null
          created_at: string | null
          created_by: string | null
          current_mode: string | null
          current_speaker_id: string | null
          current_topic: string | null
          id: string
          status: string | null
          timer_duration: number | null
          timer_remaining: number | null
          timer_running: boolean | null
          timer_started_at: string | null
          updated_at: string | null
          yield_target_id: string | null
          yield_type: string | null
        }
        Insert: {
          committee_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_mode?: string | null
          current_speaker_id?: string | null
          current_topic?: string | null
          id?: string
          status?: string | null
          timer_duration?: number | null
          timer_remaining?: number | null
          timer_running?: boolean | null
          timer_started_at?: string | null
          updated_at?: string | null
          yield_target_id?: string | null
          yield_type?: string | null
        }
        Update: {
          committee_id?: string | null
          created_at?: string | null
          created_by?: string | null
          current_mode?: string | null
          current_speaker_id?: string | null
          current_topic?: string | null
          id?: string
          status?: string | null
          timer_duration?: number | null
          timer_remaining?: number | null
          timer_running?: boolean | null
          timer_started_at?: string | null
          updated_at?: string | null
          yield_target_id?: string | null
          yield_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "committee_sessions_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
        ]
      }
      committees: {
        Row: {
          chair: string | null
          co_chair: string | null
          countries: string[]
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          topics: string[] | null
          total_spots: number
          updated_at: string | null
        }
        Insert: {
          chair?: string | null
          co_chair?: string | null
          countries?: string[]
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          topics?: string[] | null
          total_spots?: number
          updated_at?: string | null
        }
        Update: {
          chair?: string | null
          co_chair?: string | null
          countries?: string[]
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          topics?: string[] | null
          total_spots?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_read: boolean | null
          message: string | null
          phone: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          phone?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          phone?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      country_assignments: {
        Row: {
          application_id: string | null
          committee_id: string | null
          country: string
          country_code: string | null
          country_name: string | null
          created_at: string | null
          id: string
          notified_at: string | null
          updated_at: string | null
        }
        Insert: {
          application_id?: string | null
          committee_id?: string | null
          country: string
          country_code?: string | null
          country_name?: string | null
          created_at?: string | null
          id?: string
          notified_at?: string | null
          updated_at?: string | null
        }
        Update: {
          application_id?: string | null
          committee_id?: string | null
          country?: string
          country_code?: string | null
          country_name?: string | null
          created_at?: string | null
          id?: string
          notified_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "country_assignments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "country_assignments_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
        ]
      }
      debate_pair_votes: {
        Row: {
          id: string
          judge_id: string
          judge_name: string | null
          pairing_id: string
          updated_at: string
          winner_id: string
        }
        Insert: {
          id?: string
          judge_id?: string
          judge_name?: string | null
          pairing_id: string
          updated_at?: string
          winner_id: string
        }
        Update: {
          id?: string
          judge_id?: string
          judge_name?: string | null
          pairing_id?: string
          updated_at?: string
          winner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debate_pair_votes_pairing_id_fkey"
            columns: ["pairing_id"]
            isOneToOne: false
            referencedRelation: "debate_pairings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debate_pair_votes_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "debate_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      debate_pairings: {
        Row: {
          a_id: string
          b_id: string
          created_at: string
          id: string
          position: number
          round: number
        }
        Insert: {
          a_id: string
          b_id: string
          created_at?: string
          id?: string
          position?: number
          round?: number
        }
        Update: {
          a_id?: string
          b_id?: string
          created_at?: string
          id?: string
          position?: number
          round?: number
        }
        Relationships: [
          {
            foreignKeyName: "debate_pairings_a_id_fkey"
            columns: ["a_id"]
            isOneToOne: false
            referencedRelation: "debate_registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "debate_pairings_b_id_fkey"
            columns: ["b_id"]
            isOneToOne: false
            referencedRelation: "debate_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      debate_registrations: {
        Row: {
          admin_notes: string | null
          agreed_to_rules: boolean
          city: string | null
          created_at: string
          date_of_birth: string | null
          decision_emailed_at: string | null
          email: string
          english_level: string | null
          experience: string | null
          full_name: string
          gender: string | null
          grade: string | null
          heard_from: string | null
          id: string
          institution: string
          motivation: string | null
          past_tournaments: string | null
          phone: string
          preferred_side: string | null
          reviewed_at: string | null
          slot: number | null
          status: string
          team_id: string | null
          telegram: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          agreed_to_rules?: boolean
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          decision_emailed_at?: string | null
          email: string
          english_level?: string | null
          experience?: string | null
          full_name: string
          gender?: string | null
          grade?: string | null
          heard_from?: string | null
          id?: string
          institution: string
          motivation?: string | null
          past_tournaments?: string | null
          phone: string
          preferred_side?: string | null
          reviewed_at?: string | null
          slot?: number | null
          status?: string
          team_id?: string | null
          telegram?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          agreed_to_rules?: boolean
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          decision_emailed_at?: string | null
          email?: string
          english_level?: string | null
          experience?: string | null
          full_name?: string
          gender?: string | null
          grade?: string | null
          heard_from?: string | null
          id?: string
          institution?: string
          motivation?: string | null
          past_tournaments?: string | null
          phone?: string
          preferred_side?: string | null
          reviewed_at?: string | null
          slot?: number | null
          status?: string
          team_id?: string | null
          telegram?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debate_registrations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "debate_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      debate_scores: {
        Row: {
          id: string
          judge_id: string
          judge_name: string | null
          notes: string | null
          scores: Json
          team_id: string
          total: number
          updated_at: string
        }
        Insert: {
          id?: string
          judge_id?: string
          judge_name?: string | null
          notes?: string | null
          scores?: Json
          team_id: string
          total?: number
          updated_at?: string
        }
        Update: {
          id?: string
          judge_id?: string
          judge_name?: string | null
          notes?: string | null
          scores?: Json
          team_id?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "debate_scores_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "debate_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      debate_teams: {
        Row: {
          created_at: string
          id: string
          label: string
          name: string | null
          position: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          name?: string | null
          position?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          name?: string | null
          position?: string | null
        }
        Relationships: []
      }
      demographic_aliases: {
        Row: {
          canonical_value: string
          created_at: string | null
          created_by: string | null
          field: string
          id: string
          raw_value: string
        }
        Insert: {
          canonical_value: string
          created_at?: string | null
          created_by?: string | null
          field: string
          id?: string
          raw_value: string
        }
        Update: {
          canonical_value?: string
          created_at?: string | null
          created_by?: string | null
          field?: string
          id?: string
          raw_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "demographic_aliases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      form_settings: {
        Row: {
          closed_message: string
          custom_questions: Json
          deadline: string | null
          fee_amount: number
          form_questions: Json
          form_type: string
          id: string
          ielts_discount: number
          is_open: boolean
          max_capacity: number | null
          opens_at: string | null
          sat_discount: number
          step_labels: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          closed_message?: string
          custom_questions?: Json
          deadline?: string | null
          fee_amount?: number
          form_questions?: Json
          form_type: string
          id?: string
          ielts_discount?: number
          is_open?: boolean
          max_capacity?: number | null
          opens_at?: string | null
          sat_discount?: number
          step_labels?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          closed_message?: string
          custom_questions?: Json
          deadline?: string | null
          fee_amount?: number
          form_questions?: Json
          form_type?: string
          id?: string
          ielts_discount?: number
          is_open?: boolean
          max_capacity?: number | null
          opens_at?: string | null
          sat_discount?: number
          step_labels?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      matrix_countries: {
        Row: {
          committee_id: string | null
          country_name: string
          created_at: string | null
          id: string
          is_available: boolean | null
        }
        Insert: {
          committee_id?: string | null
          country_name: string
          created_at?: string | null
          id?: string
          is_available?: boolean | null
        }
        Update: {
          committee_id?: string | null
          country_name?: string
          created_at?: string | null
          id?: string
          is_available?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "matrix_countries_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
        ]
      }
      motions: {
        Row: {
          created_at: string | null
          description: string
          id: string
          motion_type: string
          proposed_by: string | null
          proposer_country: string | null
          proposer_name: string
          seconded_by: string | null
          session_id: string | null
          speaking_time: number | null
          status: string | null
          total_time: number | null
          votes_abstain: number | null
          votes_against: number | null
          votes_for: number | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          motion_type: string
          proposed_by?: string | null
          proposer_country?: string | null
          proposer_name: string
          seconded_by?: string | null
          session_id?: string | null
          speaking_time?: number | null
          status?: string | null
          total_time?: number | null
          votes_abstain?: number | null
          votes_against?: number | null
          votes_for?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          motion_type?: string
          proposed_by?: string | null
          proposer_country?: string | null
          proposer_name?: string
          seconded_by?: string | null
          session_id?: string | null
          speaking_time?: number | null
          status?: string | null
          total_time?: number | null
          votes_abstain?: number | null
          votes_against?: number | null
          votes_for?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "motions_proposed_by_fkey"
            columns: ["proposed_by"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "motions_seconded_by_fkey"
            columns: ["seconded_by"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "motions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "committee_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean | null
          source: string | null
          subscribed_at: string | null
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean | null
          source?: string | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean | null
          source?: string | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      position_papers: {
        Row: {
          application_id: string | null
          chair_feedback: string | null
          committee_id: string | null
          content: string | null
          created_at: string | null
          feedback: string | null
          file_url: string | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          score: number | null
          status: string | null
          submitted_at: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          application_id?: string | null
          chair_feedback?: string | null
          committee_id?: string | null
          content?: string | null
          created_at?: string | null
          feedback?: string | null
          file_url?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          score?: number | null
          status?: string | null
          submitted_at?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          application_id?: string | null
          chair_feedback?: string | null
          committee_id?: string | null
          content?: string | null
          created_at?: string | null
          feedback?: string | null
          file_url?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          score?: number | null
          status?: string | null
          submitted_at?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "position_papers_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "position_papers_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "position_papers_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          category: string | null
          committee_id: string | null
          created_at: string | null
          description: string | null
          file_type: string | null
          file_url: string | null
          id: string
          is_public: boolean | null
          title: string
        }
        Insert: {
          category?: string | null
          committee_id?: string | null
          created_at?: string | null
          description?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_public?: boolean | null
          title: string
        }
        Update: {
          category?: string | null
          committee_id?: string | null
          created_at?: string | null
          description?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_public?: boolean | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_events: {
        Row: {
          capacity: number | null
          committee_id: string | null
          created_at: string | null
          description: string | null
          end_time: string | null
          event_date: string | null
          event_type: string | null
          id: string
          is_mandatory: boolean | null
          location: string | null
          start_time: string | null
          title: string
        }
        Insert: {
          capacity?: number | null
          committee_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          event_date?: string | null
          event_type?: string | null
          id?: string
          is_mandatory?: boolean | null
          location?: string | null
          start_time?: string | null
          title: string
        }
        Update: {
          capacity?: number | null
          committee_id?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          event_date?: string | null
          event_type?: string | null
          id?: string
          is_mandatory?: boolean | null
          location?: string | null
          start_time?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_events_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
        ]
      }
      season_archive: {
        Row: {
          archived_at: string
          id: number
          row_data: Json
          season: number
          source: string
        }
        Insert: {
          archived_at?: string
          id?: never
          row_data: Json
          season: number
          source: string
        }
        Update: {
          archived_at?: string
          id?: never
          row_data?: Json
          season?: number
          source?: string
        }
        Relationships: []
      }
      season_info: {
        Row: {
          apply_label: string
          badge_label: string
          date_text: string
          delegates_text: string
          duration_text: string
          heading: string
          id: number
          location_text: string
          subtitle: string
          updated_at: string | null
        }
        Insert: {
          apply_label?: string
          badge_label?: string
          date_text?: string
          delegates_text?: string
          duration_text?: string
          heading?: string
          id?: number
          location_text?: string
          subtitle?: string
          updated_at?: string | null
        }
        Update: {
          apply_label?: string
          badge_label?: string
          date_text?: string
          delegates_text?: string
          duration_text?: string
          heading?: string
          id?: number
          location_text?: string
          subtitle?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      seasons: {
        Row: {
          archived_at: string | null
          created_at: string
          is_current: boolean
          name: string
          number: number
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          is_current?: boolean
          name: string
          number: number
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          is_current?: boolean
          name?: string
          number?: number
        }
        Relationships: []
      }
      session_logs: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          message: string
          session_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          message: string
          session_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          message?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "committee_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      site_content: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      speakers_list: {
        Row: {
          added_at: string | null
          application_id: string | null
          delegate_country: string | null
          delegate_name: string
          id: string
          position: number | null
          session_id: string | null
          speaking_time: number | null
          spoke_at: string | null
          status: string | null
          time_used: number | null
        }
        Insert: {
          added_at?: string | null
          application_id?: string | null
          delegate_country?: string | null
          delegate_name: string
          id?: string
          position?: number | null
          session_id?: string | null
          speaking_time?: number | null
          spoke_at?: string | null
          status?: string | null
          time_used?: number | null
        }
        Update: {
          added_at?: string | null
          application_id?: string | null
          delegate_country?: string | null
          delegate_name?: string
          id?: string
          position?: number | null
          session_id?: string | null
          speaking_time?: number | null
          spoke_at?: string | null
          status?: string | null
          time_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "speakers_list_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "speakers_list_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "committee_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      volunteer_applications: {
        Row: {
          admin_notes: string | null
          anything_else: string | null
          commit_to_deposit: boolean
          created_at: string
          date_of_birth: string
          email: string
          full_name: string
          id: string
          location: string
          notes: string | null
          payment_status: string
          school_name: string | null
          season: number | null
          status: string
          telegram_or_phone: string
          updated_at: string
          user_id: string | null
          what_you_bring: string
        }
        Insert: {
          admin_notes?: string | null
          anything_else?: string | null
          commit_to_deposit: boolean
          created_at?: string
          date_of_birth: string
          email: string
          full_name: string
          id?: string
          location: string
          notes?: string | null
          payment_status?: string
          school_name?: string | null
          season?: number | null
          status?: string
          telegram_or_phone: string
          updated_at?: string
          user_id?: string | null
          what_you_bring: string
        }
        Update: {
          admin_notes?: string | null
          anything_else?: string | null
          commit_to_deposit?: boolean
          created_at?: string
          date_of_birth?: string
          email?: string
          full_name?: string
          id?: string
          location?: string
          notes?: string | null
          payment_status?: string
          school_name?: string | null
          season?: number | null
          status?: string
          telegram_or_phone?: string
          updated_at?: string
          user_id?: string | null
          what_you_bring?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          application_id: string | null
          id: string
          motion_id: string | null
          vote: string
          voted_at: string | null
        }
        Insert: {
          application_id?: string | null
          id?: string
          motion_id?: string | null
          vote: string
          voted_at?: string | null
        }
        Update: {
          application_id?: string | null
          id?: string
          motion_id?: string | null
          vote?: string
          voted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "votes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_motion_id_fkey"
            columns: ["motion_id"]
            isOneToOne: false
            referencedRelation: "motions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assert_form_open: {
        Args: { p_form_type: string }
        Returns: {
          closed_message: string
          custom_questions: Json
          deadline: string | null
          fee_amount: number
          form_questions: Json
          form_type: string
          id: string
          ielts_discount: number
          is_open: boolean
          max_capacity: number | null
          opens_at: string | null
          sat_discount: number
          step_labels: Json
          updated_at: string | null
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "form_settings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      assign_chair_application: {
        Args: {
          p_application_id: string
          p_committee_id: string
          p_email: string
          p_full_name: string
          p_role: string
        }
        Returns: undefined
      }
      assign_seat: {
        Args: {
          p_application_id: string
          p_committee_id: string
          p_country: string
          p_country_code?: string
        }
        Returns: {
          application_id: string | null
          committee_id: string | null
          country: string
          country_code: string | null
          country_name: string | null
          created_at: string | null
          id: string
          notified_at: string | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "country_assignments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      can_run_session: { Args: { p_session_id: string }; Returns: boolean }
      can_see_debate_event: { Args: never; Returns: boolean }
      change_seat_country: {
        Args: {
          p_assignment_id: string
          p_country: string
          p_country_code?: string
        }
        Returns: undefined
      }
      current_season: { Args: never; Returns: number }
      debate_roster: {
        Args: never
        Returns: {
          full_name: string
          id: string
          institution: string
          slot: number
          team_id: string
        }[]
      }
      debate_side_stats: {
        Args: never
        Returns: {
          registrations: number
          side: string
        }[]
      }
      form_approved_count: { Args: { p_form_type: string }; Returns: number }
      has_admin_role: { Args: { roles: string[] }; Returns: boolean }
      is_academic_staff: { Args: never; Returns: boolean }
      is_active_admin: { Args: never; Returns: boolean }
      is_chair_of: { Args: { p_committee_id: string }; Returns: boolean }
      is_debate_judge: { Args: never; Returns: boolean }
      is_sg: { Args: never; Returns: boolean }
      log_activity: {
        Args: {
          p_action: string
          p_details?: Json
          p_entity: string
          p_entity_id: string
          p_summary: string
        }
        Returns: undefined
      }
      my_debate_assignment: {
        Args: never
        Returns: {
          opponent: string
          slot: number
          team_label: string
          team_name: string
          team_position: string
        }[]
      }
      search_users_for_admin: {
        Args: { search_query: string }
        Returns: {
          email: string
          full_name: string
          id: string
          source: string
        }[]
      }
      set_check_in: {
        Args: { p_checked: boolean; p_id: string; p_kind: string }
        Returns: string
      }
      start_new_season: {
        Args: { p_name?: string; p_number: number }
        Returns: undefined
      }
      unassign_seat: { Args: { p_assignment_id: string }; Returns: undefined }
      update_delegate_info: {
        Args: {
          p_country: string
          p_email: string
          p_full_name: string
          p_id: string
          p_institution: string
          p_payment_status: string
          p_phone: string
        }
        Returns: undefined
      }
      update_own_application_name: {
        Args: { p_full_name: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

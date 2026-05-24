export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string
          email: string
          password_hash: string
          role: string
          full_name: string | null
          created_at: string | null
          updated_at: string | null
          last_login: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          role?: string
          full_name?: string | null
          created_at?: string | null
          updated_at?: string | null
          last_login?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          role?: string
          full_name?: string | null
          created_at?: string | null
          updated_at?: string | null
          last_login?: string | null
          is_active?: boolean
        }
        Relationships: []
      }
      applications: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string | null
          institution: string
          country: string
          experience: string
          committee_preference1: string
          committee_preference2: string
          committee_preference3: string
          motivation: string | null
          dietary_restrictions: string | null
          has_ielts: boolean | null
          has_sat: boolean | null
          ielts_score: number | null
          sat_score: number | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          status: string | null
          assigned_committee_id: string | null
          payment_status: string | null
          payment_amount: number | null
          payment_reference: string | null
          created_at: string | null
          updated_at: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          phone?: string | null
          institution: string
          country: string
          experience: string
          committee_preference1: string
          committee_preference2: string
          committee_preference3: string
          motivation?: string | null
          dietary_restrictions?: string | null
          has_ielts?: boolean | null
          has_sat?: boolean | null
          ielts_score?: number | null
          sat_score?: number | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          status?: string | null
          assigned_committee_id?: string | null
          payment_status?: string | null
          payment_amount?: number | null
          payment_reference?: string | null
          created_at?: string | null
          updated_at?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          phone?: string | null
          institution?: string
          country?: string
          experience?: string
          committee_preference1?: string
          committee_preference2?: string
          committee_preference3?: string
          motivation?: string | null
          dietary_restrictions?: string | null
          has_ielts?: boolean | null
          has_sat?: boolean | null
          ielts_score?: number | null
          sat_score?: number | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          status?: string | null
          assigned_committee_id?: string | null
          payment_status?: string | null
          payment_amount?: number | null
          payment_reference?: string | null
          created_at?: string | null
          updated_at?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          notes?: string | null
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
            foreignKeyName: "applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      committees: {
        Row: {
          id: string
          name: string
          abbreviation: string | null
          description: string
          topics: string[]
          image_url: string | null
          chair: string | null
          co_chair: string | null
          max_delegates: number | null
          current_delegates: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          abbreviation?: string | null
          description: string
          topics?: string[]
          image_url?: string | null
          chair?: string | null
          co_chair?: string | null
          max_delegates?: number | null
          current_delegates?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          abbreviation?: string | null
          description?: string
          topics?: string[]
          image_url?: string | null
          chair?: string | null
          co_chair?: string | null
          max_delegates?: number | null
          current_delegates?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      committee_sessions: {
        Row: {
          id: string
          committee_id: string
          status: string
          current_mode: string
          timer_duration: number | null
          timer_remaining: number | null
          timer_running: boolean | null
          timer_started_at: string | null
          current_speaker_id: string | null
          current_topic: string | null
          yield_type: string | null
          yield_target_id: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          committee_id: string
          status?: string
          current_mode?: string
          timer_duration?: number | null
          timer_remaining?: number | null
          timer_running?: boolean | null
          timer_started_at?: string | null
          current_speaker_id?: string | null
          current_topic?: string | null
          yield_type?: string | null
          yield_target_id?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          committee_id?: string
          status?: string
          current_mode?: string
          timer_duration?: number | null
          timer_remaining?: number | null
          timer_running?: boolean | null
          timer_started_at?: string | null
          current_speaker_id?: string | null
          current_topic?: string | null
          yield_type?: string | null
          yield_target_id?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "committee_sessions_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "committee_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          }
        ]
      }
      speakers_list: {
        Row: {
          id: string
          session_id: string
          application_id: string
          delegate_name: string
          delegate_country: string | null
          status: string
          position: number
          speaking_time: number
          time_used: number
          added_at: string | null
          spoke_at: string | null
        }
        Insert: {
          id?: string
          session_id: string
          application_id: string
          delegate_name: string
          delegate_country?: string | null
          status?: string
          position?: number
          speaking_time?: number
          time_used?: number
          added_at?: string | null
          spoke_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          application_id?: string
          delegate_name?: string
          delegate_country?: string | null
          status?: string
          position?: number
          speaking_time?: number
          time_used?: number
          added_at?: string | null
          spoke_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "speakers_list_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "committee_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "speakers_list_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          }
        ]
      }
      motions: {
        Row: {
          id: string
          session_id: string
          proposed_by: string | null
          proposer_name: string
          proposer_country: string | null
          motion_type: string
          description: string
          speaking_time: number | null
          total_time: number | null
          status: string
          seconded_by: string | null
          votes_for: number | null
          votes_against: number | null
          votes_abstain: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          session_id: string
          proposed_by?: string | null
          proposer_name: string
          proposer_country?: string | null
          motion_type: string
          description: string
          speaking_time?: number | null
          total_time?: number | null
          status?: string
          seconded_by?: string | null
          votes_for?: number | null
          votes_against?: number | null
          votes_abstain?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          proposed_by?: string | null
          proposer_name?: string
          proposer_country?: string | null
          motion_type?: string
          description?: string
          speaking_time?: number | null
          total_time?: number | null
          status?: string
          seconded_by?: string | null
          votes_for?: number | null
          votes_against?: number | null
          votes_abstain?: number | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "motions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "committee_sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      votes: {
        Row: {
          id: string
          motion_id: string
          application_id: string
          vote: string
          voted_at: string | null
        }
        Insert: {
          id?: string
          motion_id: string
          application_id: string
          vote: string
          voted_at?: string | null
        }
        Update: {
          id?: string
          motion_id?: string
          application_id?: string
          vote?: string
          voted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "votes_motion_id_fkey"
            columns: ["motion_id"]
            isOneToOne: false
            referencedRelation: "motions"
            referencedColumns: ["id"]
          }
        ]
      }
      attendance: {
        Row: {
          id: string
          session_id: string
          application_id: string
          status: string
          is_voting: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          session_id: string
          application_id: string
          status?: string
          is_voting?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          application_id?: string
          status?: string
          is_voting?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "committee_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          }
        ]
      }
      session_logs: {
        Row: {
          id: string
          session_id: string
          event_type: string
          message: string
          event_data: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          session_id: string
          event_type: string
          message: string
          event_data?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          event_type?: string
          message?: string
          event_data?: Json | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "committee_sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      contact_messages: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string | null
          subject: string
          message: string
          is_read: boolean | null
          responded_at: string | null
          responded_by: string | null
          response_message: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          phone?: string | null
          subject: string
          message: string
          is_read?: boolean | null
          responded_at?: string | null
          responded_by?: string | null
          response_message?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          phone?: string | null
          subject?: string
          message?: string
          is_read?: boolean | null
          responded_at?: string | null
          responded_by?: string | null
          response_message?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          }
        ]
      }
      schedule_events: {
        Row: {
          id: string
          title: string
          description: string | null
          event_date: string
          start_time: string
          end_time: string
          location: string | null
          event_type: string | null
          committee_id: string | null
          is_mandatory: boolean | null
          capacity: number | null
          registered_count: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          event_date: string
          start_time: string
          end_time: string
          location?: string | null
          event_type?: string | null
          committee_id?: string | null
          is_mandatory?: boolean | null
          capacity?: number | null
          registered_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          event_date?: string
          start_time?: string
          end_time?: string
          location?: string | null
          event_type?: string | null
          committee_id?: string | null
          is_mandatory?: boolean | null
          capacity?: number | null
          registered_count?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_events_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          }
        ]
      }
      resources: {
        Row: {
          id: string
          title: string
          description: string | null
          file_url: string
          file_type: string
          file_size: number | null
          category: string
          committee_id: string | null
          is_public: boolean | null
          download_count: number | null
          uploaded_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          file_url: string
          file_type: string
          file_size?: number | null
          category: string
          committee_id?: string | null
          is_public?: boolean | null
          download_count?: number | null
          uploaded_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          file_url?: string
          file_type?: string
          file_size?: number | null
          category?: string
          committee_id?: string | null
          is_public?: boolean | null
          download_count?: number | null
          uploaded_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          }
        ]
      }
      newsletter_subscribers: {
        Row: {
          id: string
          email: string
          full_name: string | null
          is_active: boolean | null
          subscribed_at: string | null
          unsubscribed_at: string | null
          source: string | null
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          is_active?: boolean | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
          source?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          is_active?: boolean | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
          source?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          id: string
          title: string
          content: string
          priority: string | null
          target_audience: string | null
          committee_id: string | null
          is_published: boolean | null
          published_at: string | null
          expires_at: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          content: string
          priority?: string | null
          target_audience?: string | null
          committee_id?: string | null
          is_published?: boolean | null
          published_at?: string | null
          expires_at?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          content?: string
          priority?: string | null
          target_audience?: string | null
          committee_id?: string | null
          is_published?: boolean | null
          published_at?: string | null
          expires_at?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          }
        ]
      }
      feedback: {
        Row: {
          id: string
          application_id: string | null
          committee_id: string | null
          overall_rating: number | null
          organization_rating: number | null
          content_rating: number | null
          venue_rating: number | null
          comments: string | null
          suggestions: string | null
          would_recommend: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          application_id?: string | null
          committee_id?: string | null
          overall_rating?: number | null
          organization_rating?: number | null
          content_rating?: number | null
          venue_rating?: number | null
          comments?: string | null
          suggestions?: string | null
          would_recommend?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          application_id?: string | null
          committee_id?: string | null
          overall_rating?: number | null
          organization_rating?: number | null
          content_rating?: number | null
          venue_rating?: number | null
          comments?: string | null
          suggestions?: string | null
          would_recommend?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      application_stats: {
        Row: {
          total_applications: number | null
          approved_applications: number | null
          rejected_applications: number | null
          pending_applications: number | null
          waitlisted_applications: number | null
          countries_represented: number | null
          avg_ielts_score: number | null
          avg_sat_score: number | null
        }
      }
      committee_popularity: {
        Row: {
          committee_name: string | null
          abbreviation: string | null
          first_choice_count: number | null
          second_choice_count: number | null
          third_choice_count: number | null
          total_preferences: number | null
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

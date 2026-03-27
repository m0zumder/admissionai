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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      bookmarks: {
        Row: {
          content_id: string | null
          content_preview: string
          content_type: string
          created_at: string
          id: string
          subject: string | null
          user_id: string
        }
        Insert: {
          content_id?: string | null
          content_preview: string
          content_type: string
          created_at?: string
          id?: string
          subject?: string | null
          user_id: string
        }
        Update: {
          content_id?: string | null
          content_preview?: string
          content_type?: string
          created_at?: string
          id?: string
          subject?: string | null
          user_id?: string
        }
        Relationships: []
      }
      challenges: {
        Row: {
          code: string
          created_at: string
          creator_id: string
          creator_score: number | null
          id: string
          opponent_id: string | null
          opponent_score: number | null
          questions: Json
          status: string
          subject_name: string
          topic_name: string | null
        }
        Insert: {
          code: string
          created_at?: string
          creator_id: string
          creator_score?: number | null
          id?: string
          opponent_id?: string | null
          opponent_score?: number | null
          questions?: Json
          status?: string
          subject_name: string
          topic_name?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          creator_id?: string
          creator_score?: number | null
          id?: string
          opponent_id?: string | null
          opponent_score?: number | null
          questions?: Json
          status?: string
          subject_name?: string
          topic_name?: string | null
        }
        Relationships: []
      }
      creative_answers: {
        Row: {
          created_at: string
          generated_answer: string
          id: string
          subject: string
          uddipok: string
          user_id: string
        }
        Insert: {
          created_at?: string
          generated_answer: string
          id?: string
          subject: string
          uddipok: string
          user_id: string
        }
        Update: {
          created_at?: string
          generated_answer?: string
          id?: string
          subject?: string
          uddipok?: string
          user_id?: string
        }
        Relationships: []
      }
      error_reports: {
        Row: {
          created_at: string
          id: string
          issue_type: string
          question_text: string
          subject: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          issue_type: string
          question_text: string
          subject?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          issue_type?: string
          question_text?: string
          subject?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mcq_sessions: {
        Row: {
          correct_answers: number
          created_at: string
          id: string
          questions_attempted: number
          score_percentage: number
          subject_id: string | null
          topic_id: string | null
          user_id: string
        }
        Insert: {
          correct_answers?: number
          created_at?: string
          id?: string
          questions_attempted?: number
          score_percentage?: number
          subject_id?: string | null
          topic_id?: string | null
          user_id: string
        }
        Update: {
          correct_answers?: number
          created_at?: string
          id?: string
          questions_attempted?: number
          score_percentage?: number
          subject_id?: string | null
          topic_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mcq_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mcq_sessions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      notebook_documents: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number
          file_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      parent_links: {
        Row: {
          child_id: string
          created_at: string
          expires_at: string
          id: string
          linking_code: string
          parent_id: string | null
          status: string
        }
        Insert: {
          child_id: string
          created_at?: string
          expires_at?: string
          id?: string
          linking_code: string
          parent_id?: string | null
          status?: string
        }
        Update: {
          child_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          linking_code?: string
          parent_id?: string | null
          status?: string
        }
        Relationships: []
      }
      parent_messages: {
        Row: {
          child_id: string
          created_at: string
          id: string
          message: string
          parent_id: string
          read: boolean
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          message: string
          parent_id: string
          read?: boolean
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          message?: string
          parent_id?: string
          read?: boolean
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          bank_tran_id: string | null
          card_type: string | null
          created_at: string
          currency: string
          id: string
          payment_method: string | null
          plan: string
          status: string
          tran_id: string
          updated_at: string
          user_id: string
          val_id: string | null
        }
        Insert: {
          amount: number
          bank_tran_id?: string | null
          card_type?: string | null
          created_at?: string
          currency?: string
          id?: string
          payment_method?: string | null
          plan: string
          status?: string
          tran_id: string
          updated_at?: string
          user_id: string
          val_id?: string | null
        }
        Update: {
          amount?: number
          bank_tran_id?: string | null
          card_type?: string | null
          created_at?: string
          currency?: string
          id?: string
          payment_method?: string | null
          plan?: string
          status?: string
          tran_id?: string
          updated_at?: string
          user_id?: string
          val_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_emoji: string | null
          class_level: string | null
          created_at: string
          daily_explain_count: number
          daily_mcq_count: number
          daily_photo_count: number
          daily_srijonshil_count: number
          exam_date: string | null
          font_size: string
          id: string
          is_parent: boolean
          last_activity_date: string | null
          last_reset_date: string
          name: string | null
          streak_freeze_used_this_week: boolean
          study_streak: number
          subscription_plan: string
          target_exam: string | null
          user_level: string
          weekly_xp: number
          weekly_xp_reset_date: string | null
          xp_points: number
        }
        Insert: {
          avatar_emoji?: string | null
          class_level?: string | null
          created_at?: string
          daily_explain_count?: number
          daily_mcq_count?: number
          daily_photo_count?: number
          daily_srijonshil_count?: number
          exam_date?: string | null
          font_size?: string
          id: string
          is_parent?: boolean
          last_activity_date?: string | null
          last_reset_date?: string
          name?: string | null
          streak_freeze_used_this_week?: boolean
          study_streak?: number
          subscription_plan?: string
          target_exam?: string | null
          user_level?: string
          weekly_xp?: number
          weekly_xp_reset_date?: string | null
          xp_points?: number
        }
        Update: {
          avatar_emoji?: string | null
          class_level?: string | null
          created_at?: string
          daily_explain_count?: number
          daily_mcq_count?: number
          daily_photo_count?: number
          daily_srijonshil_count?: number
          exam_date?: string | null
          font_size?: string
          id?: string
          is_parent?: boolean
          last_activity_date?: string | null
          last_reset_date?: string
          name?: string | null
          streak_freeze_used_this_week?: boolean
          study_streak?: number
          subscription_plan?: string
          target_exam?: string | null
          user_level?: string
          weekly_xp?: number
          weekly_xp_reset_date?: string | null
          xp_points?: number
        }
        Relationships: []
      }
      subjects: {
        Row: {
          class_level: string
          icon: string
          id: string
          name_bn: string
          name_en: string
          stream: string | null
        }
        Insert: {
          class_level: string
          icon?: string
          id?: string
          name_bn: string
          name_en: string
          stream?: string | null
        }
        Update: {
          class_level?: string
          icon?: string
          id?: string
          name_bn?: string
          name_en?: string
          stream?: string | null
        }
        Relationships: []
      }
      topics: {
        Row: {
          chapter_number: number
          id: string
          importance: string
          name_bn: string
          name_en: string
          subject_id: string
        }
        Insert: {
          chapter_number?: number
          id?: string
          importance?: string
          name_bn: string
          name_en: string
          subject_id: string
        }
        Update: {
          chapter_number?: number
          id?: string
          importance?: string
          name_bn?: string
          name_en?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_description: string
          badge_emoji: string
          badge_name: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_description?: string
          badge_emoji?: string
          badge_name: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_description?: string
          badge_emoji?: string
          badge_name?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      weak_topics: {
        Row: {
          id: string
          last_attempted: string
          topic_id: string
          user_id: string
          wrong_count: number
        }
        Insert: {
          id?: string
          last_attempted?: string
          topic_id: string
          user_id: string
          wrong_count?: number
        }
        Update: {
          id?: string
          last_attempted?: string
          topic_id?: string
          user_id?: string
          wrong_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "weak_topics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

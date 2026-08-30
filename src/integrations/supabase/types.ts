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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      academic_terms: {
        Row: {
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          is_active: boolean
          is_archived: boolean
          notes: string
          semester: number
          start_date: string | null
          updated_at: string
          year_label: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          is_archived?: boolean
          notes?: string
          semester: number
          start_date?: string | null
          updated_at?: string
          year_label: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          is_archived?: boolean
          notes?: string
          semester?: number
          start_date?: string | null
          updated_at?: string
          year_label?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          level: string
          title: string
        }
        Insert: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          level?: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          level?: string
          title?: string
        }
        Relationships: []
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          content: string
          created_at: string
          feedback: string | null
          file_url: string | null
          graded_at: string | null
          id: string
          score: number | null
          status: string
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assignment_id: string
          content?: string
          created_at?: string
          feedback?: string | null
          file_url?: string | null
          graded_at?: string | null
          id?: string
          score?: number | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assignment_id?: string
          content?: string
          created_at?: string
          feedback?: string | null
          file_url?: string | null
          graded_at?: string | null
          id?: string
          score?: number | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          due_date: string | null
          id: string
          is_published: boolean
          material_slug: string
          max_score: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string
          due_date?: string | null
          id?: string
          is_published?: boolean
          material_slug: string
          max_score?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          due_date?: string | null
          id?: string
          is_published?: boolean
          material_slug?: string
          max_score?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      attendance_records: {
        Row: {
          created_at: string
          id: string
          note: string
          session_id: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string
          session_id: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string
          session_id?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "attendance_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_sessions: {
        Row: {
          created_at: string
          created_by: string | null
          grade: number
          id: string
          material_slug: string | null
          meeting_number: number | null
          session_date: string
          term_id: string | null
          topic: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          grade: number
          id?: string
          material_slug?: string | null
          meeting_number?: number | null
          session_date?: string
          term_id?: string | null
          topic?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          grade?: number
          id?: string
          material_slug?: string | null
          meeting_number?: number | null
          session_date?: string
          term_id?: string | null
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_sessions_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "academic_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_number: string
          created_at: string
          expires_at: string | null
          id: string
          issued_at: string
          material_slug: string
          metadata: Json
          user_id: string
        }
        Insert: {
          certificate_number: string
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_at?: string
          material_slug: string
          metadata?: Json
          user_id: string
        }
        Update: {
          certificate_number?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_at?: string
          material_slug?: string
          metadata?: Json
          user_id?: string
        }
        Relationships: []
      }
      class_schedules: {
        Row: {
          created_at: string
          created_by: string | null
          day_of_week: number
          end_time: string
          grade: number
          id: string
          material_slug: string | null
          room: string | null
          start_time: string
          subject: string
          term_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          day_of_week: number
          end_time: string
          grade: number
          id?: string
          material_slug?: string | null
          room?: string | null
          start_time: string
          subject?: string
          term_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          day_of_week?: number
          end_time?: string
          grade?: number
          id?: string
          material_slug?: string | null
          room?: string | null
          start_time?: string
          subject?: string
          term_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_schedules_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "academic_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          created_at: string
          id: string
          material_slug: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          material_slug: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          material_slug?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          created_at: string
          date: string
          habit_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          habit_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          habit_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          color: string
          created_at: string
          description: string
          frequency: Json
          id: string
          name: string
          position: number
          reminder_time: string | null
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string
          frequency?: Json
          id?: string
          name: string
          position?: number
          reminder_time?: string | null
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string
          frequency?: Json
          id?: string
          name?: string
          position?: number
          reminder_time?: string | null
          user_id?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          duration: string
          element: string | null
          grade: number
          id: string
          image_url: string | null
          is_published: boolean
          module_list: Json
          semester: number
          slug: string
          subject: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string
          duration?: string
          element?: string | null
          grade?: number
          id?: string
          image_url?: string | null
          is_published?: boolean
          module_list?: Json
          semester?: number
          slug: string
          subject?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          duration?: string
          element?: string | null
          grade?: number
          id?: string
          image_url?: string | null
          is_published?: boolean
          module_list?: Json
          semester?: number
          slug?: string
          subject?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      module_progress: {
        Row: {
          completed_at: string
          id: string
          material_slug: string
          module_index: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          material_slug: string
          module_index: number
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          material_slug?: string
          module_index?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          bio: string
          created_at: string
          display_name: string | null
          email: string | null
          grade: number | null
          headline: string | null
          id: string
          leaderboard_opt_out: boolean
          notes: string | null
          phone: string | null
          school: string | null
          social_link: string | null
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string
          created_at?: string
          display_name?: string | null
          email?: string | null
          grade?: number | null
          headline?: string | null
          id: string
          leaderboard_opt_out?: boolean
          notes?: string | null
          phone?: string | null
          school?: string | null
          social_link?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string
          created_at?: string
          display_name?: string | null
          email?: string | null
          grade?: number | null
          headline?: string | null
          id?: string
          leaderboard_opt_out?: boolean
          notes?: string | null
          phone?: string | null
          school?: string | null
          social_link?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      quiz_answers: {
        Row: {
          attempt_id: string
          created_at: string
          id: string
          is_correct: boolean
          points_earned: number
          question_id: string
          selected_option_index: number
        }
        Insert: {
          attempt_id: string
          created_at?: string
          id?: string
          is_correct?: boolean
          points_earned?: number
          question_id: string
          selected_option_index: number
        }
        Update: {
          attempt_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          points_earned?: number
          question_id?: string
          selected_option_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          is_passed: boolean
          max_score: number
          quiz_id: string
          score: number
          started_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_passed?: boolean
          max_score?: number
          quiz_id: string
          score?: number
          started_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_passed?: boolean
          max_score?: number
          quiz_id?: string
          score?: number
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_option_index: number
          created_at: string
          explanation: string | null
          id: string
          options: Json
          points: number
          position: number
          question: string
          quiz_id: string
        }
        Insert: {
          correct_option_index?: number
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json
          points?: number
          position?: number
          question: string
          quiz_id: string
        }
        Update: {
          correct_option_index?: number
          created_at?: string
          explanation?: string | null
          id?: string
          options?: Json
          points?: number
          position?: number
          question?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean
          material_slug: string
          passing_score: number
          shuffle_questions: boolean
          time_limit_minutes: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          material_slug: string
          passing_score?: number
          shuffle_questions?: boolean
          time_limit_minutes?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          material_slug?: string
          passing_score?: number
          shuffle_questions?: boolean
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      rubric_assessments: {
        Row: {
          assessed_at: string
          assessed_by: string | null
          created_at: string
          id: string
          note: string
          rubric_id: string
          student_id: string
          term_id: string | null
          total_score: number
          updated_at: string
        }
        Insert: {
          assessed_at?: string
          assessed_by?: string | null
          created_at?: string
          id?: string
          note?: string
          rubric_id: string
          student_id: string
          term_id?: string | null
          total_score?: number
          updated_at?: string
        }
        Update: {
          assessed_at?: string
          assessed_by?: string | null
          created_at?: string
          id?: string
          note?: string
          rubric_id?: string
          student_id?: string
          term_id?: string | null
          total_score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rubric_assessments_rubric_id_fkey"
            columns: ["rubric_id"]
            isOneToOne: false
            referencedRelation: "rubrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rubric_assessments_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "academic_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      rubric_criteria: {
        Row: {
          created_at: string
          description: string
          id: string
          max_score: number
          name: string
          position: number
          rubric_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          max_score?: number
          name: string
          position?: number
          rubric_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          max_score?: number
          name?: string
          position?: number
          rubric_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "rubric_criteria_rubric_id_fkey"
            columns: ["rubric_id"]
            isOneToOne: false
            referencedRelation: "rubrics"
            referencedColumns: ["id"]
          },
        ]
      }
      rubric_scores: {
        Row: {
          assessment_id: string
          created_at: string
          criterion_id: string
          id: string
          score: number
        }
        Insert: {
          assessment_id: string
          created_at?: string
          criterion_id: string
          id?: string
          score?: number
        }
        Update: {
          assessment_id?: string
          created_at?: string
          criterion_id?: string
          id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "rubric_scores_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "rubric_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rubric_scores_criterion_id_fkey"
            columns: ["criterion_id"]
            isOneToOne: false
            referencedRelation: "rubric_criteria"
            referencedColumns: ["id"]
          },
        ]
      }
      rubrics: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          grade: number | null
          id: string
          is_published: boolean
          material_slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string
          grade?: number | null
          id?: string
          is_published?: boolean
          material_slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          grade?: number | null
          id?: string
          is_published?: boolean
          material_slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      schedule_materials: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          kind: string
          note: string
          schedule_id: string
          title: string
          updated_at: string
          value: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          note?: string
          schedule_id: string
          title?: string
          updated_at?: string
          value: string
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          note?: string
          schedule_id?: string
          title?: string
          updated_at?: string
          value?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "schedule_materials_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "class_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          brand_name: string
          created_at: string
          cta: Json
          faqs: Json
          features: Json
          footer: Json
          hero_slides: Json
          id: string
          logo_url: string | null
          reviews: Json
          sections: Json
          stats: Json
          tagline: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          brand_name?: string
          created_at?: string
          cta?: Json
          faqs?: Json
          features?: Json
          footer?: Json
          hero_slides?: Json
          id?: string
          logo_url?: string | null
          reviews?: Json
          sections?: Json
          stats?: Json
          tagline?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          brand_name?: string
          created_at?: string
          cta?: Json
          faqs?: Json
          features?: Json
          footer?: Json
          hero_slides?: Json
          id?: string
          logo_url?: string | null
          reviews?: Json
          sections?: Json
          stats?: Json
          tagline?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      teaching_journals: {
        Row: {
          activities: string
          created_at: string
          created_by: string | null
          grade: number
          id: string
          journal_date: string
          material_slug: string | null
          obstacles: string
          reflection: string
          session_id: string | null
          term_id: string | null
          topic: string
          updated_at: string
        }
        Insert: {
          activities?: string
          created_at?: string
          created_by?: string | null
          grade: number
          id?: string
          journal_date?: string
          material_slug?: string | null
          obstacles?: string
          reflection?: string
          session_id?: string | null
          term_id?: string | null
          topic: string
          updated_at?: string
        }
        Update: {
          activities?: string
          created_at?: string
          created_by?: string | null
          grade?: number
          id?: string
          journal_date?: string
          material_slug?: string | null
          obstacles?: string
          reflection?: string
          session_id?: string | null
          term_id?: string | null
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teaching_journals_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "attendance_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teaching_journals_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "academic_terms"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
    }
    Views: {
      student_public_activity: {
        Row: {
          day: string | null
          modules: number | null
          user_id: string | null
        }
        Relationships: []
      }
      student_public_stats: {
        Row: {
          avatar_url: string | null
          avg_quiz_score: number | null
          banner_url: string | null
          bio: string | null
          certificates: number | null
          completed_modules: number | null
          created_at: string | null
          display_name: string | null
          enrollments: number | null
          grade: number | null
          headline: string | null
          id: string | null
          last_activity: string | null
          leaderboard_opt_out: boolean | null
          passed_quizzes: number | null
          quiz_attempts: number | null
          social_link: string | null
          submissions: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      active_term_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "student" | "guru"
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
      app_role: ["admin", "student", "guru"],
    },
  },
} as const

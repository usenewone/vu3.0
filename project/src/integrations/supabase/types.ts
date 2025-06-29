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
      contact_inquiries: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          priority: string | null
          source: string | null
          status: string | null
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          priority?: string | null
          source?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          priority?: string | null
          source?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      education_entries: {
        Row: {
          created_at: string | null
          degree: string
          description: string | null
          id: string
          institution: string
          is_active: boolean | null
          order_index: number | null
          period: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          degree?: string
          description?: string | null
          id?: string
          institution?: string
          is_active?: boolean | null
          order_index?: number | null
          period?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          degree?: string
          description?: string | null
          id?: string
          institution?: string
          is_active?: boolean | null
          order_index?: number | null
          period?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      portfolio_content: {
        Row: {
          content: Json
          id: string
          section: string
          updated_at: string | null
        }
        Insert: {
          content: Json
          id?: string
          section: string
          updated_at?: string | null
        }
        Update: {
          content?: Json
          id?: string
          section?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      portfolio_data: {
        Row: {
          element_id: string
          element_type: string
          element_value: string | null
          id: string
          json_data: Json | null
          updated_at: string | null
        }
        Insert: {
          element_id: string
          element_type: string
          element_value?: string | null
          id?: string
          json_data?: Json | null
          updated_at?: string | null
        }
        Update: {
          element_id?: string
          element_type?: string
          element_value?: string | null
          id?: string
          json_data?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_categories: {
        Row: {
          color_code: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          order_index: number | null
        }
        Insert: {
          color_code?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          order_index?: number | null
        }
        Update: {
          color_code?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          order_index?: number | null
        }
        Relationships: []
      }
      project_tag_relations: {
        Row: {
          created_at: string | null
          id: string
          project_id: string | null
          tag_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          project_id?: string | null
          tag_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          project_id?: string | null
          tag_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_tag_relations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tag_relations_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "project_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tags: {
        Row: {
          color_code: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          color_code?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          color_code?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      project_views: {
        Row: {
          id: string
          project_id: string | null
          referrer: string | null
          user_agent: string | null
          viewed_at: string | null
          viewer_ip: string | null
          viewer_location: string | null
        }
        Insert: {
          id?: string
          project_id?: string | null
          referrer?: string | null
          user_agent?: string | null
          viewed_at?: string | null
          viewer_ip?: string | null
          viewer_location?: string | null
        }
        Update: {
          id?: string
          project_id?: string | null
          referrer?: string | null
          user_agent?: string | null
          viewed_at?: string | null
          viewer_ip?: string | null
          viewer_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_views_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          category: string | null
          client: string | null
          created_at: string | null
          date: string | null
          description: string | null
          design_2d_images: Json | null
          elevation_images: Json | null
          floor_plan_images: Json | null
          id: string
          is_active: boolean | null
          order_index: number | null
          render_3d_images: Json | null
          title: string
          top_view_images: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          client?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          design_2d_images?: Json | null
          elevation_images?: Json | null
          floor_plan_images?: Json | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          render_3d_images?: Json | null
          title?: string
          top_view_images?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          client?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          design_2d_images?: Json | null
          elevation_images?: Json | null
          floor_plan_images?: Json | null
          id?: string
          is_active?: boolean | null
          order_index?: number | null
          render_3d_images?: Json | null
          title?: string
          top_view_images?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      site_analytics: {
        Row: {
          id: string
          metric_data: Json | null
          metric_name: string
          metric_value: number | null
          period_type: string | null
          recorded_at: string | null
        }
        Insert: {
          id?: string
          metric_data?: Json | null
          metric_name: string
          metric_value?: number | null
          period_type?: string | null
          recorded_at?: string | null
        }
        Update: {
          id?: string
          metric_data?: Json | null
          metric_name?: string
          metric_value?: number | null
          period_type?: string | null
          recorded_at?: string | null
        }
        Relationships: []
      }
      user_profile: {
        Row: {
          bio: string | null
          completed_projects: string | null
          email: string | null
          id: string
          name: string | null
          philosophy: string | null
          phone: string | null
          profile_image_url: string | null
          specializations: string | null
          title: string | null
          updated_at: string | null
          years_experience: string | null
        }
        Insert: {
          bio?: string | null
          completed_projects?: string | null
          email?: string | null
          id?: string
          name?: string | null
          philosophy?: string | null
          phone?: string | null
          profile_image_url?: string | null
          specializations?: string | null
          title?: string | null
          updated_at?: string | null
          years_experience?: string | null
        }
        Update: {
          bio?: string | null
          completed_projects?: string | null
          email?: string | null
          id?: string
          name?: string | null
          philosophy?: string | null
          phone?: string | null
          profile_image_url?: string | null
          specializations?: string | null
          title?: string | null
          updated_at?: string | null
          years_experience?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          id: string
          password: string
          role: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          password: string
          role?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          password?: string
          role?: string | null
          username?: string
        }
        Relationships: []
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
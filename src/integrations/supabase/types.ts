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
      daily_table_params: {
        Row: {
          combinations: Json | null
          generated_at: string | null
          global_params: Json | null
          id: string
          market_data: Json | null
          results: Json | null
          updated_at: string | null
        }
        Insert: {
          combinations?: Json | null
          generated_at?: string | null
          global_params?: Json | null
          id: string
          market_data?: Json | null
          results?: Json | null
          updated_at?: string | null
        }
        Update: {
          combinations?: Json | null
          generated_at?: string | null
          global_params?: Json | null
          id?: string
          market_data?: Json | null
          results?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      insurance_profiles: {
        Row: {
          created_at: string | null
          id: string
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      operations: {
        Row: {
          account: string | null
          breakeven_basis_brl: number | null
          broker: string | null
          commodity: string | null
          costs_snapshot: Json | null
          created_at: string | null
          display_name: string | null
          exchange_rate: number | null
          futures_price: number | null
          gross_price_brl: number | null
          id: string
          insurance_premium_brl: number | null
          insurance_strategy: string | null
          insurance_strike: number | null
          legs: string | null
          maturity: string | null
          notes: string | null
          operation_date: string | null
          origination_price_brl: number | null
          payment_date: string | null
          pricing_snapshot: Json | null
          purchased_basis_brl: number | null
          sale_date: string | null
          status: string | null
          ticker: string | null
          updated_at: string | null
          volume: number | null
          warehouse: string | null
        }
        Insert: {
          account?: string | null
          breakeven_basis_brl?: number | null
          broker?: string | null
          commodity?: string | null
          costs_snapshot?: Json | null
          created_at?: string | null
          display_name?: string | null
          exchange_rate?: number | null
          futures_price?: number | null
          gross_price_brl?: number | null
          id?: string
          insurance_premium_brl?: number | null
          insurance_strategy?: string | null
          insurance_strike?: number | null
          legs?: string | null
          maturity?: string | null
          notes?: string | null
          operation_date?: string | null
          origination_price_brl?: number | null
          payment_date?: string | null
          pricing_snapshot?: Json | null
          purchased_basis_brl?: number | null
          sale_date?: string | null
          status?: string | null
          ticker?: string | null
          updated_at?: string | null
          volume?: number | null
          warehouse?: string | null
        }
        Update: {
          account?: string | null
          breakeven_basis_brl?: number | null
          broker?: string | null
          commodity?: string | null
          costs_snapshot?: Json | null
          created_at?: string | null
          display_name?: string | null
          exchange_rate?: number | null
          futures_price?: number | null
          gross_price_brl?: number | null
          id?: string
          insurance_premium_brl?: number | null
          insurance_strategy?: string | null
          insurance_strike?: number | null
          legs?: string | null
          maturity?: string | null
          notes?: string | null
          operation_date?: string | null
          origination_price_brl?: number | null
          payment_date?: string | null
          pricing_snapshot?: Json | null
          purchased_basis_brl?: number | null
          sale_date?: string | null
          status?: string | null
          ticker?: string | null
          updated_at?: string | null
          volume?: number | null
          warehouse?: string | null
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

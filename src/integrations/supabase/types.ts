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
      pricing_run_items: {
        Row: {
          breakeven_basis_brl: number | null
          combination_name: string | null
          commodity: string | null
          created_at: string | null
          error_message: string | null
          exchange_rate: number | null
          futures_price: number | null
          gross_price_brl: number | null
          id: string
          input_snapshot: Json
          insurance_cost_brl: number | null
          insurance_premium_brl: number | null
          insurance_strategy: string | null
          insurance_strike: number | null
          is_promoted_to_operation: boolean
          item_index: number
          maturity: string | null
          ndf_forward_rate: number | null
          operation_id: string | null
          origination_price_brl: number | null
          payment_date: string | null
          pricing_run_id: string
          purchased_basis_brl: number | null
          reception_date: string | null
          result_snapshot: Json
          sale_date: string | null
          status: string
          target_basis_brl: number | null
          ticker: string | null
          updated_at: string | null
          volume: number | null
          warehouse: string | null
          warning_message: string | null
        }
        Insert: {
          breakeven_basis_brl?: number | null
          combination_name?: string | null
          commodity?: string | null
          created_at?: string | null
          error_message?: string | null
          exchange_rate?: number | null
          futures_price?: number | null
          gross_price_brl?: number | null
          id?: string
          input_snapshot?: Json
          insurance_cost_brl?: number | null
          insurance_premium_brl?: number | null
          insurance_strategy?: string | null
          insurance_strike?: number | null
          is_promoted_to_operation?: boolean
          item_index: number
          maturity?: string | null
          ndf_forward_rate?: number | null
          operation_id?: string | null
          origination_price_brl?: number | null
          payment_date?: string | null
          pricing_run_id: string
          purchased_basis_brl?: number | null
          reception_date?: string | null
          result_snapshot?: Json
          sale_date?: string | null
          status?: string
          target_basis_brl?: number | null
          ticker?: string | null
          updated_at?: string | null
          volume?: number | null
          warehouse?: string | null
          warning_message?: string | null
        }
        Update: {
          breakeven_basis_brl?: number | null
          combination_name?: string | null
          commodity?: string | null
          created_at?: string | null
          error_message?: string | null
          exchange_rate?: number | null
          futures_price?: number | null
          gross_price_brl?: number | null
          id?: string
          input_snapshot?: Json
          insurance_cost_brl?: number | null
          insurance_premium_brl?: number | null
          insurance_strategy?: string | null
          insurance_strike?: number | null
          is_promoted_to_operation?: boolean
          item_index?: number
          maturity?: string | null
          ndf_forward_rate?: number | null
          operation_id?: string | null
          origination_price_brl?: number | null
          payment_date?: string | null
          pricing_run_id?: string
          purchased_basis_brl?: number | null
          reception_date?: string | null
          result_snapshot?: Json
          sale_date?: string | null
          status?: string
          target_basis_brl?: number | null
          ticker?: string | null
          updated_at?: string | null
          volume?: number | null
          warehouse?: string | null
          warning_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_run_items_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "operations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_run_items_pricing_run_id_fkey"
            columns: ["pricing_run_id"]
            isOneToOne: false
            referencedRelation: "pricing_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_runs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          daily_table_param_id: string | null
          engine_name: string
          engine_version: string | null
          error_message: string | null
          id: string
          input_payload: Json
          notes: string | null
          output_summary: Json
          requested_by: string | null
          run_type: string
          started_at: string | null
          status: string
          updated_at: string | null
          warnings: Json
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          daily_table_param_id?: string | null
          engine_name?: string
          engine_version?: string | null
          error_message?: string | null
          id?: string
          input_payload?: Json
          notes?: string | null
          output_summary?: Json
          requested_by?: string | null
          run_type?: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
          warnings?: Json
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          daily_table_param_id?: string | null
          engine_name?: string
          engine_version?: string | null
          error_message?: string | null
          id?: string
          input_payload?: Json
          notes?: string | null
          output_summary?: Json
          requested_by?: string | null
          run_type?: string
          started_at?: string | null
          status?: string
          updated_at?: string | null
          warnings?: Json
        }
        Relationships: [
          {
            foreignKeyName: "pricing_runs_daily_table_param_id_fkey"
            columns: ["daily_table_param_id"]
            isOneToOne: false
            referencedRelation: "daily_table_params"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_pricing_run_from_daily_table: {
        Args: { p_daily_table_param_id: string }
        Returns: string
      }
      promote_pricing_run_item_to_operation: {
        Args: { p_item_id: string }
        Returns: string
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

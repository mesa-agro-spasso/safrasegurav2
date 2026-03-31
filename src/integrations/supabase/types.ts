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
      app_users: {
        Row: {
          access_level: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_admin: boolean
          status: string
          updated_at: string
        }
        Insert: {
          access_level?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_admin?: boolean
          status?: string
          updated_at?: string
        }
        Update: {
          access_level?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_admin?: boolean
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          after_data: Json | null
          before_data: Json | null
          changed_by: string | null
          created_at: string
          id: string
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          after_data?: Json | null
          before_data?: Json | null
          changed_by?: string | null
          created_at?: string
          id?: string
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          after_data?: Json | null
          before_data?: Json | null
          changed_by?: string | null
          created_at?: string
          id?: string
          record_id?: string | null
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      commodities: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name_pt: string
          unit: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name_pt: string
          unit?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name_pt?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      counterparties: {
        Row: {
          created_at: string
          document_number: string | null
          email: string | null
          id: string
          is_active: boolean
          metadata: Json
          name: string
          notes: string | null
          phone: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_number?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          name: string
          notes?: string | null
          phone?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_number?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json
          name?: string
          notes?: string | null
          phone?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_table_params: {
        Row: {
          combinations: Json | null
          created_at: string | null
          global_params: Json | null
          id: string
          market_data: Json | null
          results: Json | null
          updated_at: string | null
        }
        Insert: {
          combinations?: Json | null
          created_at?: string | null
          global_params?: Json | null
          id: string
          market_data?: Json | null
          results?: Json | null
          updated_at?: string | null
        }
        Update: {
          combinations?: Json | null
          created_at?: string | null
          global_params?: Json | null
          id?: string
          market_data?: Json | null
          results?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      insurance_quotes: {
        Row: {
          carry_brl: number | null
          created_at: string
          id: string
          payload: Json
          premium_brl: number | null
          run_id: string
          scenario_id: string
          strike_brl: number | null
          total_cost_brl: number | null
        }
        Insert: {
          carry_brl?: number | null
          created_at?: string
          id?: string
          payload?: Json
          premium_brl?: number | null
          run_id: string
          scenario_id: string
          strike_brl?: number | null
          total_cost_brl?: number | null
        }
        Update: {
          carry_brl?: number | null
          created_at?: string
          id?: string
          payload?: Json
          premium_brl?: number | null
          run_id?: string
          scenario_id?: string
          strike_brl?: number | null
          total_cost_brl?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_quotes_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "insurance_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_scenarios: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          label: string
          strike_pct: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          strike_pct: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          strike_pct?: number
          updated_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          city: string | null
          created_at: string
          id: string
          is_active: boolean
          metadata: Json
          name: string
          parent_location_id: string | null
          state_code: string | null
          type: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          name: string
          parent_location_id?: string | null
          state_code?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          name?: string
          parent_location_id?: string | null
          state_code?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_parent_location_id_fkey"
            columns: ["parent_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      market_quotes: {
        Row: {
          commodity_id: string | null
          contract_code: string | null
          created_at: string
          currency: string | null
          expiration_date: string | null
          id: string
          location_id: string | null
          payload: Json
          price: number | null
          quote_date: string
          quote_type: string
          source: string | null
          ticker: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          commodity_id?: string | null
          contract_code?: string | null
          created_at?: string
          currency?: string | null
          expiration_date?: string | null
          id?: string
          location_id?: string | null
          payload?: Json
          price?: number | null
          quote_date: string
          quote_type: string
          source?: string | null
          ticker?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          commodity_id?: string | null
          contract_code?: string | null
          created_at?: string
          currency?: string | null
          expiration_date?: string | null
          id?: string
          location_id?: string | null
          payload?: Json
          price?: number | null
          quote_date?: string
          quote_type?: string
          source?: string | null
          ticker?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_quotes_commodity_id_fkey"
            columns: ["commodity_id"]
            isOneToOne: false
            referencedRelation: "commodities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_quotes_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      model_parameters: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          parameter_group: string
          parameter_key: string
          unit: string | null
          updated_at: string
          valid_from: string | null
          valid_to: string | null
          value_json: Json | null
          value_num: number | null
          value_text: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          parameter_group: string
          parameter_key: string
          unit?: string | null
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          value_json?: Json | null
          value_num?: number | null
          value_text?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          parameter_group?: string
          parameter_key?: string
          unit?: string | null
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
          value_json?: Json | null
          value_num?: number | null
          value_text?: string | null
        }
        Relationships: []
      }
      ndf_curves: {
        Row: {
          created_at: string
          id: string
          payload: Json
          rate: number
          reference_date: string
          source: string | null
          tenor_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          rate: number
          reference_date: string
          source?: string | null
          tenor_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          rate?: number
          reference_date?: string
          source?: string | null
          tenor_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      operation_hedges: {
        Row: {
          created_at: string
          expiration_date: string | null
          hedge_type: string
          id: string
          instrument: string | null
          metadata: Json
          operation_id: string
          premium_brl: number | null
          quantity: number | null
          scenario_code: string | null
          strike_brl: number | null
          ticker: string | null
        }
        Insert: {
          created_at?: string
          expiration_date?: string | null
          hedge_type: string
          id?: string
          instrument?: string | null
          metadata?: Json
          operation_id: string
          premium_brl?: number | null
          quantity?: number | null
          scenario_code?: string | null
          strike_brl?: number | null
          ticker?: string | null
        }
        Update: {
          created_at?: string
          expiration_date?: string | null
          hedge_type?: string
          id?: string
          instrument?: string | null
          metadata?: Json
          operation_id?: string
          premium_brl?: number | null
          quantity?: number | null
          scenario_code?: string | null
          strike_brl?: number | null
          ticker?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operation_hedges_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "operations"
            referencedColumns: ["id"]
          },
        ]
      }
      operations: {
        Row: {
          armazem_id: string | null
          closed_price_brl: number | null
          commodity_id: string
          counterparty_id: string | null
          created_at: string
          created_by: string | null
          grain_reception_date: string | null
          id: string
          include_insurance: boolean
          metadata: Json
          notes: string | null
          operation_number: number
          payment_date: string | null
          praca_id: string | null
          pricing_run_id: string | null
          sale_date: string | null
          status: string
          unit: string
          updated_at: string
          volume: number | null
        }
        Insert: {
          armazem_id?: string | null
          closed_price_brl?: number | null
          commodity_id: string
          counterparty_id?: string | null
          created_at?: string
          created_by?: string | null
          grain_reception_date?: string | null
          id?: string
          include_insurance?: boolean
          metadata?: Json
          notes?: string | null
          operation_number?: number
          payment_date?: string | null
          praca_id?: string | null
          pricing_run_id?: string | null
          sale_date?: string | null
          status?: string
          unit?: string
          updated_at?: string
          volume?: number | null
        }
        Update: {
          armazem_id?: string | null
          closed_price_brl?: number | null
          commodity_id?: string
          counterparty_id?: string | null
          created_at?: string
          created_by?: string | null
          grain_reception_date?: string | null
          id?: string
          include_insurance?: boolean
          metadata?: Json
          notes?: string | null
          operation_number?: number
          payment_date?: string | null
          praca_id?: string | null
          pricing_run_id?: string | null
          sale_date?: string | null
          status?: string
          unit?: string
          updated_at?: string
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "operations_armazem_id_fkey"
            columns: ["armazem_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operations_commodity_id_fkey"
            columns: ["commodity_id"]
            isOneToOne: false
            referencedRelation: "commodities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operations_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operations_praca_id_fkey"
            columns: ["praca_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_inputs: {
        Row: {
          additional_discount_brl: number | null
          armazem_id: string | null
          b3_futures_brl: number | null
          brokerage_per_contract: number | null
          commodity_id: string
          counterparty_id: string | null
          created_at: string
          created_by: string | null
          desk_cost_pct: number | null
          forward_fx: number | null
          futures_expiration: string | null
          futures_market: string | null
          futures_price: number | null
          futures_ticker: string | null
          grain_reception_date: string | null
          id: string
          include_insurance: boolean
          interest_rate: number | null
          interest_rate_period: string | null
          manual_overrides: Json
          notes: string | null
          payment_date: string
          praca_id: string | null
          purchased_basis: number | null
          reception_cost: number | null
          rounding_increment: number | null
          sale_date: string
          shrinkage_rate_monthly: number | null
          simulation_date: string
          spot_fx: number | null
          storage_cost: number | null
          storage_cost_type: string | null
          target_basis: number | null
          target_price: number | null
          updated_at: string
        }
        Insert: {
          additional_discount_brl?: number | null
          armazem_id?: string | null
          b3_futures_brl?: number | null
          brokerage_per_contract?: number | null
          commodity_id: string
          counterparty_id?: string | null
          created_at?: string
          created_by?: string | null
          desk_cost_pct?: number | null
          forward_fx?: number | null
          futures_expiration?: string | null
          futures_market?: string | null
          futures_price?: number | null
          futures_ticker?: string | null
          grain_reception_date?: string | null
          id?: string
          include_insurance?: boolean
          interest_rate?: number | null
          interest_rate_period?: string | null
          manual_overrides?: Json
          notes?: string | null
          payment_date: string
          praca_id?: string | null
          purchased_basis?: number | null
          reception_cost?: number | null
          rounding_increment?: number | null
          sale_date: string
          shrinkage_rate_monthly?: number | null
          simulation_date?: string
          spot_fx?: number | null
          storage_cost?: number | null
          storage_cost_type?: string | null
          target_basis?: number | null
          target_price?: number | null
          updated_at?: string
        }
        Update: {
          additional_discount_brl?: number | null
          armazem_id?: string | null
          b3_futures_brl?: number | null
          brokerage_per_contract?: number | null
          commodity_id?: string
          counterparty_id?: string | null
          created_at?: string
          created_by?: string | null
          desk_cost_pct?: number | null
          forward_fx?: number | null
          futures_expiration?: string | null
          futures_market?: string | null
          futures_price?: number | null
          futures_ticker?: string | null
          grain_reception_date?: string | null
          id?: string
          include_insurance?: boolean
          interest_rate?: number | null
          interest_rate_period?: string | null
          manual_overrides?: Json
          notes?: string | null
          payment_date?: string
          praca_id?: string | null
          purchased_basis?: number | null
          reception_cost?: number | null
          rounding_increment?: number | null
          sale_date?: string
          shrinkage_rate_monthly?: number | null
          simulation_date?: string
          spot_fx?: number | null
          storage_cost?: number | null
          storage_cost_type?: string | null
          target_basis?: number | null
          target_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_inputs_armazem_id_fkey"
            columns: ["armazem_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_inputs_commodity_id_fkey"
            columns: ["commodity_id"]
            isOneToOne: false
            referencedRelation: "commodities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_inputs_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "counterparties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_inputs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_inputs_praca_id_fkey"
            columns: ["praca_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_results: {
        Row: {
          breakeven_basis_brl: number | null
          brokerage_brl: number | null
          calculated_at: string
          created_at: string
          desk_cost_brl: number | null
          financial_brl: number | null
          forward_fx: number | null
          futures_price_brl: number | null
          id: string
          insurance_atm_total_brl: number | null
          insurance_enabled: boolean
          insurance_otm_10_total_brl: number | null
          insurance_otm_5_total_brl: number | null
          origination_price_gross_brl: number | null
          origination_price_net_brl: number | null
          purchased_basis_brl: number | null
          result_payload: Json
          run_id: string
          spot_fx: number | null
          storage_brl: number | null
          target_basis_brl: number | null
          total_cost_brl: number | null
          updated_at: string
        }
        Insert: {
          breakeven_basis_brl?: number | null
          brokerage_brl?: number | null
          calculated_at?: string
          created_at?: string
          desk_cost_brl?: number | null
          financial_brl?: number | null
          forward_fx?: number | null
          futures_price_brl?: number | null
          id?: string
          insurance_atm_total_brl?: number | null
          insurance_enabled?: boolean
          insurance_otm_10_total_brl?: number | null
          insurance_otm_5_total_brl?: number | null
          origination_price_gross_brl?: number | null
          origination_price_net_brl?: number | null
          purchased_basis_brl?: number | null
          result_payload?: Json
          run_id: string
          spot_fx?: number | null
          storage_brl?: number | null
          target_basis_brl?: number | null
          total_cost_brl?: number | null
          updated_at?: string
        }
        Update: {
          breakeven_basis_brl?: number | null
          brokerage_brl?: number | null
          calculated_at?: string
          created_at?: string
          desk_cost_brl?: number | null
          financial_brl?: number | null
          forward_fx?: number | null
          futures_price_brl?: number | null
          id?: string
          insurance_atm_total_brl?: number | null
          insurance_enabled?: boolean
          insurance_otm_10_total_brl?: number | null
          insurance_otm_5_total_brl?: number | null
          origination_price_gross_brl?: number | null
          origination_price_net_brl?: number | null
          purchased_basis_brl?: number | null
          result_payload?: Json
          run_id?: string
          spot_fx?: number | null
          storage_brl?: number | null
          target_basis_brl?: number | null
          total_cost_brl?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      pricing_run_items: {
        Row: {
          breakeven_basis_brl: number | null
          combination_name: string | null
          commodity: string | null
          created_at: string | null
          exchange_rate: number | null
          futures_price: number | null
          gross_price_brl: number | null
          id: string
          input_snapshot: Json | null
          item_index: number | null
          origination_price_brl: number | null
          payment_date: string | null
          pricing_run_id: string | null
          purchased_basis_brl: number | null
          reception_date: string | null
          result_snapshot: Json | null
          sale_date: string | null
          status: string | null
          target_basis_brl: number | null
          ticker: string | null
          warehouse: string | null
        }
        Insert: {
          breakeven_basis_brl?: number | null
          combination_name?: string | null
          commodity?: string | null
          created_at?: string | null
          exchange_rate?: number | null
          futures_price?: number | null
          gross_price_brl?: number | null
          id?: string
          input_snapshot?: Json | null
          item_index?: number | null
          origination_price_brl?: number | null
          payment_date?: string | null
          pricing_run_id?: string | null
          purchased_basis_brl?: number | null
          reception_date?: string | null
          result_snapshot?: Json | null
          sale_date?: string | null
          status?: string | null
          target_basis_brl?: number | null
          ticker?: string | null
          warehouse?: string | null
        }
        Update: {
          breakeven_basis_brl?: number | null
          combination_name?: string | null
          commodity?: string | null
          created_at?: string | null
          exchange_rate?: number | null
          futures_price?: number | null
          gross_price_brl?: number | null
          id?: string
          input_snapshot?: Json | null
          item_index?: number | null
          origination_price_brl?: number | null
          payment_date?: string | null
          pricing_run_id?: string | null
          purchased_basis_brl?: number | null
          reception_date?: string | null
          result_snapshot?: Json | null
          sale_date?: string | null
          status?: string | null
          target_basis_brl?: number | null
          ticker?: string | null
          warehouse?: string | null
        }
        Relationships: [
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
          daily_table_param_id: string | null
          engine_name: string | null
          engine_version: string | null
          id: string
          input_payload: Json | null
          output_summary: Json | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          daily_table_param_id?: string | null
          engine_name?: string | null
          engine_version?: string | null
          id?: string
          input_payload?: Json | null
          output_summary?: Json | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          daily_table_param_id?: string | null
          engine_name?: string | null
          engine_version?: string | null
          id?: string
          input_payload?: Json | null
          output_summary?: Json | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean
          role: string
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean
          role?: string
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_set_user_access: {
        Args: {
          p_access_level: string
          p_is_admin?: boolean
          p_status: string
          p_user_id: string
        }
        Returns: undefined
      }
      create_pricing_run_from_daily_table: {
        Args: { p_daily_table_param_id: string }
        Returns: string
      }
      current_user_has_full_access: { Args: never; Returns: boolean }
      current_user_is_active: { Args: never; Returns: boolean }
      current_user_is_admin: { Args: never; Returns: boolean }
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

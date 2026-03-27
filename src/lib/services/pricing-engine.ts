import { supabase } from "@/integrations/supabase/client";

// Recursively preserve numeric types when saving JSONB
function preserveNumericTypes(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(preserveNumericTypes);
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = preserveNumericTypes(value);
    }
    return result;
  }
  if (typeof obj === "string") {
    const trimmed = obj.trim();
    if (trimmed !== "" && !isNaN(Number(trimmed))) {
      return Number(trimmed);
    }
  }
  return obj;
}

// === Response types ===

export interface ExecutePricingResponse {
  success: boolean;
  pricing_run_id?: string;
  calculated_items?: number;
  warning_count?: number;
  engine_version?: string;
  output_unit?: string;
  error?: string;
}

export interface PromoteToOperationResponse {
  success: boolean;
  operation_id?: string;
  already_promoted?: boolean;
  error?: string;
}

// === Service functions ===

export async function fetchDailyTableParams() {
  const { data, error } = await supabase
    .from("daily_table_params")
    .select("*")
    .eq("id", "default")
    .single();
  if (error) throw error;
  return data;
}

export async function updateDailyTableParams(
  market_data: Record<string, unknown>,
  global_params: Record<string, unknown>,
  combinations: unknown[]
) {
  const { error } = await supabase
    .from("daily_table_params")
    .update({
      market_data: preserveNumericTypes(market_data) as any,
      global_params: preserveNumericTypes(global_params) as any,
      combinations: preserveNumericTypes(combinations) as any,
      updated_at: new Date().toISOString(),
    })
    .eq("id", "default");
  if (error) throw error;
}

export async function executePricing(): Promise<ExecutePricingResponse> {
  const { data, error } = await supabase.functions.invoke("run-daily-table", {
    body: { daily_table_param_id: "default" },
  });
  if (error) throw error;
  return data as ExecutePricingResponse;
}

export async function fetchPricingRuns() {
  const { data, error } = await supabase
    .from("pricing_runs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchRunItems(runId: string) {
  const { data, error } = await supabase
    .from("pricing_run_items")
    .select("*")
    .eq("pricing_run_id", runId)
    .order("item_index", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function promoteItem(itemId: string): Promise<PromoteToOperationResponse> {
  const { data, error } = await supabase.functions.invoke("promote-to-operation", {
    body: { pricing_run_item_id: itemId },
  });
  if (error) throw error;
  return data as PromoteToOperationResponse;
}

export async function fetchOperations() {
  const { data, error } = await supabase
    .from("operations")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

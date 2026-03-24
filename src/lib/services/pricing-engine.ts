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

export async function executePricing(): Promise<{ success: boolean; pricing_run_id?: string; error?: string }> {
  const { data, error } = await supabase.functions.invoke("run-daily-table", {
    body: { daily_table_param_id: "default" },
  });
  if (error) throw error;
  return data as { success: boolean; pricing_run_id?: string; error?: string };
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

export async function promoteItem(itemId: string): Promise<string> {
  const { data, error } = await supabase.rpc("promote_pricing_run_item_to_operation", {
    p_item_id: itemId,
  });
  if (error) throw error;
  return data as string;
}

export async function fetchOperations() {
  const { data, error } = await supabase
    .from("operations")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

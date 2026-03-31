import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

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
    if (trimmed !== "" && !isNaN(Number(trimmed))) return Number(trimmed);
  }
  return obj;
}

export interface ExecutePricingResponse {
  success: boolean;
  pricing_run_id?: string;
  calculated_items?: number;
  warning_count?: number;
  engine_version?: string;
  output_unit?: string;
  error?: string;
}

export interface FetchMarketDataResponse {
  success: boolean;
  commodity: string;
  usd_brl: number | null;
  futures: Array<{ ticker: string; price: number | null; exp_date: string | null }>;
  fetched_at: string;
  source: string;
  persisted: boolean;
  daily_table_param_id: string | null;
}

export interface PromoteToOperationResponse {
  success: boolean;
  operation_id?: string;
  already_promoted?: boolean;
  error?: string;
}

// ===== DAILY TABLE PARAMS =====

export async function fetchDailyTableParams() {
  const { data, error } = await db.from("daily_table_params").select("*").eq("id", "default").single();
  if (error) throw error;
  return data;
}

export async function updateDailyTableParams(
  market_data: Record<string, unknown>,
  global_params: Record<string, unknown>,
  combinations: unknown[]
) {
  const { error } = await db.from("daily_table_params").update({
    market_data: preserveNumericTypes(market_data),
    global_params: preserveNumericTypes(global_params),
    combinations: preserveNumericTypes(combinations),
    updated_at: new Date().toISOString(),
  }).eq("id", "default");
  if (error) throw error;
}

export async function saveDailyTableField(
  field: "market_data" | "global_params" | "combinations",
  value: unknown
) {
  const { error } = await db.from("daily_table_params").update({
    [field]: preserveNumericTypes(value),
    updated_at: new Date().toISOString(),
  }).eq("id", "default");
  if (error) throw error;
}

// ===== FETCH MARKET DATA (Edge Function) =====

export async function fetchMarketDataFromEdge(
  commodity: string,
  quantity = 6,
  includeUsdBrl = true,
  dailyTableParamId = "default"
): Promise<FetchMarketDataResponse> {
  const { data, error } = await supabase.functions.invoke("fetch-market-data", {
    body: {
      commodity,
      quantity,
      include_usd_brl: includeUsdBrl,
      daily_table_param_id: dailyTableParamId,
    },
  });
  if (error) throw error;
  return data as FetchMarketDataResponse;
}

// ===== EXECUTE PRICING =====

export async function executePricing(): Promise<ExecutePricingResponse> {
  const { data, error } = await supabase.functions.invoke("run-daily-table", {
    body: { daily_table_param_id: "default" },
  });
  if (error) throw error;
  return data as ExecutePricingResponse;
}

// ===== PRICING RUNS =====

export async function fetchPricingRuns() {
  const { data, error } = await supabase.from("pricing_runs").select("*").order("started_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchPricingRunById(id: string) {
  const { data, error } = await supabase.from("pricing_runs").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

// ===== PRICING RUN ITEMS =====

export async function fetchRunItems(runId: string) {
  const { data, error } = await db.from("pricing_run_items").select("*").eq("pricing_run_id", runId).order("item_index", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ===== PROMOTE =====

export async function promoteItem(itemId: string): Promise<PromoteToOperationResponse> {
  const { data, error } = await supabase.functions.invoke("promote-to-operation", {
    body: { pricing_run_item_id: itemId },
  });
  if (error) throw error;
  return data as PromoteToOperationResponse;
}

// ===== OPERATIONS =====

export async function fetchOperations() {
  const { data, error } = await supabase.from("operations").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

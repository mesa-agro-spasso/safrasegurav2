import { supabase } from "@/integrations/supabase/client";

// Helper to bypass strict typing for tables not in generated types
const db = supabase as any;

// ===== PRICING INPUTS =====
export async function fetchPricingInputs() {
  const { data, error } = await supabase
    .from("pricing_inputs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createPricingInput(input: Record<string, unknown>) {
  const { data, error } = await supabase
    .from("pricing_inputs")
    .insert(input as any)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ===== DAILY TABLE PARAMS =====
export async function fetchDailyTableParamsApi() {
  const { data, error } = await db
    .from("daily_table_params")
    .select("*")
    .eq("id", "default")
    .single();
  if (error) throw error;
  return data;
}

export async function updateDailyTableParamsApi(updates: Record<string, unknown>) {
  const { error } = await db
    .from("daily_table_params")
    .update(updates)
    .eq("id", "default");
  if (error) throw error;
}

// ===== PRICING RUNS =====
export async function fetchAllPricingRuns() {
  const { data, error } = await supabase
    .from("pricing_runs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchPricingRunById(id: string) {
  const { data, error } = await supabase
    .from("pricing_runs")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

// ===== PRICING RUN ITEMS =====
export async function fetchPricingRunItems(runId: string) {
  const { data, error } = await db
    .from("pricing_run_items")
    .select("*")
    .eq("pricing_run_id", runId)
    .order("item_index", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ===== PRICING RESULTS =====
export async function fetchPricingResultByRunId(runId: string) {
  const { data, error } = await supabase
    .from("pricing_results")
    .select("*")
    .eq("run_id", runId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ===== INSURANCE QUOTES =====
export async function fetchInsuranceQuotesByRunId(runId: string) {
  const { data, error } = await supabase
    .from("insurance_quotes")
    .select("*, insurance_scenarios(code, label)")
    .eq("run_id", runId);
  if (error) throw error;
  return data ?? [];
}

// ===== OPERATIONS =====
export async function fetchAllOperations() {
  const { data, error } = await supabase
    .from("operations")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateOperationStatus(id: string, status: string) {
  const { error } = await supabase.from("operations").update({ status } as any).eq("id", id);
  if (error) throw error;
}

// ===== OPERATION HEDGES =====
export async function fetchAllHedges() {
  const { data, error } = await supabase
    .from("operation_hedges")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ===== COMMODITIES =====
export async function fetchCommodities() {
  const { data, error } = await supabase.from("commodities").select("*").eq("is_active", true).order("name_pt");
  if (error) throw error;
  return data ?? [];
}
export async function upsertCommodity(row: Record<string, unknown>) {
  const { data, error } = await supabase.from("commodities").upsert(row as any).select().single();
  if (error) throw error;
  return data;
}

// ===== LOCATIONS =====
export async function fetchLocations() {
  const { data, error } = await supabase.from("locations").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}
export async function upsertLocation(row: Record<string, unknown>) {
  const { data, error } = await supabase.from("locations").upsert(row as any).select().single();
  if (error) throw error;
  return data;
}

// ===== COUNTERPARTIES =====
export async function fetchCounterparties() {
  const { data, error } = await supabase.from("counterparties").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}
export async function upsertCounterparty(row: Record<string, unknown>) {
  const { data, error } = await supabase.from("counterparties").upsert(row as any).select().single();
  if (error) throw error;
  return data;
}

// ===== MARKET QUOTES =====
export async function fetchMarketQuotes() {
  const { data, error } = await supabase.from("market_quotes").select("*").order("quote_date", { ascending: false }).limit(200);
  if (error) throw error;
  return data ?? [];
}

// ===== MODEL PARAMETERS =====
export async function fetchModelParameters() {
  const { data, error } = await supabase.from("model_parameters").select("*").order("parameter_group");
  if (error) throw error;
  return data ?? [];
}
export async function upsertModelParameter(row: Record<string, unknown>) {
  const { data, error } = await supabase.from("model_parameters").upsert(row as any).select().single();
  if (error) throw error;
  return data;
}

// ===== NDF CURVES =====
export async function fetchNdfCurves() {
  const { data, error } = await supabase.from("ndf_curves").select("*").order("reference_date", { ascending: false }).limit(200);
  if (error) throw error;
  return data ?? [];
}

// ===== INSURANCE SCENARIOS =====
export async function fetchInsuranceScenarios() {
  const { data, error } = await supabase.from("insurance_scenarios").select("*").order("code");
  if (error) throw error;
  return data ?? [];
}

// ===== RUN ENGINE =====
export async function runPricingEngine() {
  const { data, error } = await supabase.functions.invoke("run-daily-table", {
    body: { daily_table_param_id: "default" },
  });
  if (error) throw error;
  return data as { success: boolean; pricing_run_id?: string; calculated_items?: number; warning_count?: number; engine_version?: string; error?: string };
}

// ===== PROMOTE TO OPERATION =====
export async function promoteToOperation(pricingRunItemId: string) {
  const { data, error } = await supabase.functions.invoke("promote-to-operation", {
    body: { pricing_run_item_id: pricingRunItemId },
  });
  if (error) throw error;
  return data as { success: boolean; operation_id?: string; already_promoted?: boolean; error?: string };
}

// ===== DASHBOARD STATS =====
export async function fetchDashboardStats() {
  const [runsRes, opsRes, inputsRes] = await Promise.all([
    supabase.from("pricing_runs").select("id", { count: "exact", head: true }),
    supabase.from("operations").select("id, include_insurance", { count: "exact" }),
    supabase.from("pricing_inputs").select("id, include_insurance, spot_fx, forward_fx").order("created_at", { ascending: false }).limit(1),
  ]);

  const ops = opsRes.data ?? [];
  const lastInput = inputsRes.data?.[0];

  return {
    totalRuns: runsRes.count ?? 0,
    totalOperations: opsRes.count ?? 0,
    withInsurance: ops.filter((o) => o.include_insurance).length,
    withoutInsurance: ops.filter((o) => !o.include_insurance).length,
    lastSpotFx: lastInput?.spot_fx ?? null,
    lastForwardFx: lastInput?.forward_fx ?? null,
  };
}

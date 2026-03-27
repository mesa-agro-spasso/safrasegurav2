import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { daily_table_param_id } = await req.json();

    if (!daily_table_param_id) {
      return new Response(
        JSON.stringify({ success: false, error: "daily_table_param_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: runId, error } = await supabase.rpc(
      "create_pricing_run_from_daily_table",
      { p_daily_table_param_id: daily_table_param_id }
    );

    if (error) {
      console.error("RPC error:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch run details for enriched response
    const { data: run } = await supabase
      .from("pricing_runs")
      .select("engine_version, output_summary, warnings")
      .eq("id", runId)
      .single();

    const outputSummary = (run?.output_summary as Record<string, unknown>) ?? {};
    const warnings = (run?.warnings as unknown[]) ?? [];

    return new Response(
      JSON.stringify({
        success: true,
        pricing_run_id: runId,
        calculated_items: outputSummary.items_created ?? 0,
        warning_count: warnings.length,
        engine_version: run?.engine_version ?? "unknown",
        output_unit: "R$/sc",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

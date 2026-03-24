import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import DailyTableTab from "@/components/pricing/DailyTableTab";
import PricingRunsTab from "@/components/pricing/PricingRunsTab";
import OperationsTab from "@/components/pricing/OperationsTab";
import {
  fetchDailyTableParams,
  fetchPricingRuns,
  fetchOperations,
} from "@/lib/services/pricing-engine";

export default function DailyTable() {
  const [activeTab, setActiveTab] = useState("daily-table");
  const [loading, setLoading] = useState(true);

  // Daily table params state
  const [marketData, setMarketData] = useState<Record<string, unknown>>({});
  const [globalParams, setGlobalParams] = useState<Record<string, unknown>>({});
  const [combinations, setCombinations] = useState<Record<string, unknown>[]>([]);

  // Pricing runs state
  const [runs, setRuns] = useState<Record<string, unknown>[]>([]);
  const [initialRunId, setInitialRunId] = useState<string | null>(null);

  // Operations state
  const [operations, setOperations] = useState<Record<string, unknown>[]>([]);

  const loadParams = useCallback(async () => {
    try {
      const data = await fetchDailyTableParams();
      setMarketData((data.market_data as Record<string, unknown>) ?? {});
      setGlobalParams((data.global_params as Record<string, unknown>) ?? {});
      setCombinations(Array.isArray(data.combinations) ? (data.combinations as Record<string, unknown>[]) : []);
    } catch { /* empty */ }
  }, []);

  const loadRuns = useCallback(async () => {
    try {
      const data = await fetchPricingRuns();
      setRuns(data as Record<string, unknown>[]);
    } catch { /* empty */ }
  }, []);

  const loadOperations = useCallback(async () => {
    try {
      const data = await fetchOperations();
      setOperations(data as Record<string, unknown>[]);
    } catch { /* empty */ }
  }, []);

  useEffect(() => {
    Promise.all([loadParams(), loadRuns(), loadOperations()]).finally(() => setLoading(false));
  }, [loadParams, loadRuns, loadOperations]);

  const handlePricingExecuted = async (runId: string) => {
    await loadRuns();
    setInitialRunId(runId);
    setActiveTab("pricing-runs");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Daily Table</h1>
        <p className="text-muted-foreground text-sm mt-1">Precificação agrícola — parâmetros, execução e operações</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="daily-table">Daily Table</TabsTrigger>
          <TabsTrigger value="pricing-runs">Pricing Runs</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="daily-table">
          <DailyTableTab
            marketData={marketData}
            globalParams={globalParams}
            combinations={combinations}
            onMarketDataChange={setMarketData}
            onGlobalParamsChange={setGlobalParams}
            onCombinationsChange={setCombinations}
            onPricingExecuted={handlePricingExecuted}
          />
        </TabsContent>

        <TabsContent value="pricing-runs">
          <PricingRunsTab runs={runs} initialRunId={initialRunId} onRefreshOperations={loadOperations} />
        </TabsContent>

        <TabsContent value="operations">
          <OperationsTab operations={operations} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

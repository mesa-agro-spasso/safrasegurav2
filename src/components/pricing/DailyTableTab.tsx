import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import MarketDataSection from "./MarketDataSection";
import GlobalParamsSection from "./GlobalParamsSection";
import CombinationsGrid from "./CombinationsGrid";
import { updateDailyTableParams, executePricing } from "@/lib/services/pricing-engine";

interface Props {
  marketData: Record<string, unknown>;
  globalParams: Record<string, unknown>;
  combinations: Record<string, unknown>[];
  onMarketDataChange: (d: Record<string, unknown>) => void;
  onGlobalParamsChange: (d: Record<string, unknown>) => void;
  onCombinationsChange: (d: Record<string, unknown>[]) => void;
  onPricingExecuted: (runId: string) => void;
}

export default function DailyTableTab({
  marketData, globalParams, combinations,
  onMarketDataChange, onGlobalParamsChange, onCombinationsChange,
  onPricingExecuted,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDailyTableParams(marketData, globalParams, combinations);
      toast.success("Parâmetros salvos com sucesso!");
    } catch (err: unknown) {
      toast.error("Erro ao salvar: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  const handleExecute = async () => {
    setExecuting(true);
    try {
      // Save first
      await updateDailyTableParams(marketData, globalParams, combinations);
      const result = await executePricing();
      if (result.success && result.pricing_run_id) {
        const items = result.calculated_items ?? 0;
        const warns = result.warning_count ?? 0;
        let msg = `Pricing executado! ${items} itens calculados.`;
        if (warns > 0) msg += ` (${warns} avisos)`;
        toast.success(msg);
        onPricingExecuted(result.pricing_run_id);
      } else {
        toast.error("Erro no pricing: " + (result.error ?? "Erro desconhecido"));
      }
    } catch (err: unknown) {
      toast.error("Erro ao executar: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          Salvar Parâmetros
        </Button>
        <Button size="sm" onClick={handleExecute} disabled={executing}>
          {executing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Play className="h-4 w-4 mr-1" />}
          Executar Pricing
        </Button>
      </div>

      <MarketDataSection data={marketData} onChange={onMarketDataChange} />
      <GlobalParamsSection data={globalParams} onChange={onGlobalParamsChange} />
      <CombinationsGrid data={combinations} onChange={onCombinationsChange} />
    </div>
  );
}

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { KpiCard } from "@/components/shared/KpiCard";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw, Play, Loader2, DollarSign, TrendingUp, Clock, Save,
  ChevronDown, ChevronRight, Edit2, Check, X,
} from "lucide-react";
import {
  fetchDailyTableParams,
  saveDailyTableField,
  fetchMarketDataFromEdge,
  executePricing,
} from "@/lib/services/pricing-engine";
import { fmtBRL, fmtNum, fmtFx, fmtDateTime, fmtDate } from "@/lib/formatters";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// ── Combination columns base list ────────────────────────────────────
const BASE_COMBINATION_COLUMNS = [
  "combination_name", "commodity", "warehouse", "ticker", "maturity",
  "payment_date", "sale_date", "reception_date", "volume",
  "futures_price", "exchange_rate", "ndf_forward_rate",
  "target_basis_brl", "purchased_basis_brl",
  "insurance_strategy", "insurance_premium_brl", "insurance_strike",
];

// ── Editable JSON Section ────────────────────────────────────────────
function JsonSection({
  title,
  data,
  onSave,
  icon,
}: {
  title: string;
  data: Record<string, unknown>;
  onSave: (updated: Record<string, unknown>) => Promise<void>;
  icon?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDraft({ ...data }); }, [data]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
      toast.success(`${title} salvo com sucesso`);
    } catch (e: any) {
      toast.error(`Erro ao salvar: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, rawValue: string) => {
    const numVal = Number(rawValue);
    setDraft((prev) => ({
      ...prev,
      [key]: rawValue === "" ? "" : isNaN(numVal) ? rawValue : numVal,
    }));
  };

  const entries = Object.entries(draft).filter(
    ([k]) => !["updated_at", "source"].includes(k)
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-left"
          >
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            {icon}
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
            <Badge variant="outline" className="text-[10px]">{entries.length} campos</Badge>
          </button>
          <div className="flex gap-1.5">
            {editing ? (
              <>
                <Button size="sm" variant="ghost" onClick={() => { setDraft({ ...data }); setEditing(false); }}>
                  <X className="h-3.5 w-3.5 mr-1" /> Cancelar
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                  Salvar
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                <Edit2 className="h-3.5 w-3.5 mr-1" /> Editar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {entries.map(([key, value]) => {
              const isObject = typeof value === "object" && value !== null;
              if (isObject) {
                return (
                  <div key={key} className="col-span-full">
                    <p className="text-[11px] font-medium text-muted-foreground mb-1 uppercase tracking-wide">{key}</p>
                    <pre className="text-xs font-mono bg-muted/50 rounded p-2 overflow-x-auto max-h-32">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  </div>
                );
              }
              return (
                <div key={key}>
                  <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{key}</label>
                  {editing ? (
                    <Input
                      value={String(draft[key] ?? "")}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className="h-8 text-sm font-mono mt-0.5"
                    />
                  ) : (
                    <p className="text-sm font-mono mt-0.5">
                      {typeof value === "number" ? fmtNum(value, 4) : String(value ?? "—")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ── Combinations Grid ────────────────────────────────────────────────
function CombinationsGrid({
  combinations,
  onSave,
}: {
  combinations: Record<string, unknown>[];
  onSave: (updated: Record<string, unknown>[]) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown>[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDraft(combinations.map((c) => ({ ...c }))); }, [combinations]);

  // Compute columns: base + any extra keys from data
  const extraKeys = new Set<string>();
  combinations.forEach((c) => {
    Object.keys(c).forEach((k) => {
      if (!BASE_COMBINATION_COLUMNS.includes(k)) extraKeys.add(k);
    });
  });
  const columns = [...BASE_COMBINATION_COLUMNS, ...Array.from(extraKeys)];

  const handleCellChange = (rowIdx: number, col: string, rawValue: string) => {
    setDraft((prev) => {
      const next = [...prev];
      const numVal = Number(rawValue);
      next[rowIdx] = {
        ...next[rowIdx],
        [col]: rawValue === "" ? "" : isNaN(numVal) ? rawValue : numVal,
      };
      return next;
    });
  };

  const handleSaveGrid = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
      toast.success("Combinações salvas com sucesso");
    } catch (e: any) {
      toast.error("Erro ao salvar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">
            Combinações <Badge variant="outline" className="text-[10px] ml-2">{combinations.length} itens</Badge>
          </CardTitle>
          <div className="flex gap-1.5">
            {editing ? (
              <>
                <Button size="sm" variant="ghost" onClick={() => { setDraft(combinations.map((c) => ({ ...c }))); setEditing(false); }}>
                  <X className="h-3.5 w-3.5 mr-1" /> Cancelar
                </Button>
                <Button size="sm" onClick={handleSaveGrid} disabled={saving}>
                  {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                  Salvar
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                <Edit2 className="h-3.5 w-3.5 mr-1" /> Editar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {combinations.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            Nenhuma combinação configurada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] w-8">#</TableHead>
                  {columns.map((col) => (
                    <TableHead key={col} className="text-[10px] whitespace-nowrap uppercase">{col}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {draft.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{idx + 1}</TableCell>
                    {columns.map((col) => (
                      <TableCell key={col} className="p-1">
                        {editing ? (
                          <Input
                            value={String(row[col] ?? "")}
                            onChange={(e) => handleCellChange(idx, col, e.target.value)}
                            className="h-7 text-xs font-mono min-w-[80px]"
                          />
                        ) : (
                          <span className="text-xs font-mono whitespace-nowrap">
                            {typeof row[col] === "number" ? fmtNum(row[col] as number, 4) : String(row[col] ?? "—")}
                          </span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Last Run Summary ─────────────────────────────────────────────────
function LastRunSummary({ results }: { results: Record<string, unknown> | null }) {
  if (!results) return null;
  const summary = results as any;
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4" /> Último Resultado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-[11px] text-muted-foreground">Pricing Run ID</p>
            <p className="font-mono text-xs truncate">{summary.pricing_run_id ?? "—"}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Itens Calculados</p>
            <p className="font-mono">{summary.calculated_items ?? summary.items_count ?? "—"}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Engine Version</p>
            <p className="font-mono text-xs">{summary.engine_version ?? "—"}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Gerado em</p>
            <p className="font-mono text-xs">{summary.generated_at ? fmtDateTime(summary.generated_at) : "—"}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════════════════

export default function DailyTable() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [marketData, setMarketData] = useState<Record<string, unknown>>({});
  const [globalParams, setGlobalParams] = useState<Record<string, unknown>>({});
  const [combinations, setCombinations] = useState<Record<string, unknown>[]>([]);
  const [results, setResults] = useState<Record<string, unknown> | null>(null);

  const [refreshingMarket, setRefreshingMarket] = useState(false);
  const [runningPricing, setRunningPricing] = useState(false);
  const [marketCommodity, setMarketCommodity] = useState("soybean");

  const loadParams = useCallback(async () => {
    const data = await fetchDailyTableParams();
    setMarketData(data?.market_data ?? {});
    setGlobalParams(data?.global_params ?? {});
    setCombinations(Array.isArray(data?.combinations) ? data.combinations : []);
    setResults(data?.results ?? null);
  }, []);

  useEffect(() => {
    loadParams().catch(() => toast.error("Erro ao carregar parâmetros")).finally(() => setLoading(false));
  }, [loadParams]);

  const handleRefreshMarket = async () => {
    setRefreshingMarket(true);
    try {
      const result = await fetchMarketDataFromEdge(marketCommodity, 6, true, "default");
      if (result.success) {
        toast.success(`Mercado atualizado — ${result.commodity} — USD/BRL: ${fmtFx(result.usd_brl)}`);
        await loadParams();
      } else {
        toast.error("Erro ao atualizar mercado");
      }
    } catch (e: any) {
      toast.error("Falha: " + e.message);
    } finally {
      setRefreshingMarket(false);
    }
  };

  const handleRunPricing = async () => {
    setRunningPricing(true);
    try {
      const result = await executePricing();
      if (result.success) {
        toast.success(`Pricing executado — ${result.calculated_items ?? 0} itens`);
        await loadParams();
        if (result.pricing_run_id) {
          navigate(`/pricing-runs/${result.pricing_run_id}`);
        }
      } else {
        toast.error("Erro: " + (result.error ?? "desconhecido"));
      }
    } catch (e: any) {
      toast.error("Falha ao executar pricing: " + e.message);
    } finally {
      setRunningPricing(false);
    }
  };

  if (loading) return <LoadingState message="Carregando Daily Table..." />;

  const usdBrl = (marketData as any)?.usd_brl ?? (marketData as any)?.usd_brl_spot;
  const updatedAt = (marketData as any)?.updated_at;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Daily Table"
        description="Parâmetros de precificação e execução do motor"
        actions={
          <div className="flex items-center gap-2">
            <Select value={marketCommodity} onValueChange={setMarketCommodity}>
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="soybean">Soja</SelectItem>
                <SelectItem value="corn">Milho</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleRefreshMarket} disabled={refreshingMarket}>
              {refreshingMarket ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1.5" />}
              Atualizar Mercado
            </Button>
            <Button onClick={handleRunPricing} disabled={runningPricing}>
              {runningPricing ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Play className="h-4 w-4 mr-1.5" />}
              Rodar Pricing
            </Button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="USD/BRL"
          value={usdBrl ? fmtFx(usdBrl) : "—"}
          icon={DollarSign}
          subtitle={updatedAt ? `Atualizado ${fmtDateTime(updatedAt)}` : undefined}
        />
        <KpiCard
          title="Combinações"
          value={combinations.length}
          icon={TrendingUp}
        />
        <KpiCard
          title="Último Run"
          value={results ? "✓" : "—"}
          icon={Clock}
          subtitle={results ? `${(results as any).calculated_items ?? (results as any).items_count ?? "?"} itens` : "Nenhum"}
        />
        <KpiCard
          title="Engine"
          value={(results as any)?.engine_version ?? "—"}
          icon={Play}
        />
      </div>

      {/* Last run summary */}
      <LastRunSummary results={results} />

      {/* Sections */}
      <Tabs defaultValue="params">
        <TabsList>
          <TabsTrigger value="params">Parâmetros</TabsTrigger>
          <TabsTrigger value="combinations">Combinações</TabsTrigger>
        </TabsList>

        <TabsContent value="params" className="space-y-4 mt-4">
          <JsonSection
            title="Dados de Mercado"
            data={marketData}
            onSave={async (updated) => {
              await saveDailyTableField("market_data", updated);
              setMarketData(updated);
            }}
            icon={<DollarSign className="h-4 w-4 text-primary" />}
          />
          <JsonSection
            title="Parâmetros Globais"
            data={globalParams}
            onSave={async (updated) => {
              await saveDailyTableField("global_params", updated);
              setGlobalParams(updated);
            }}
            icon={<TrendingUp className="h-4 w-4 text-primary" />}
          />
        </TabsContent>

        <TabsContent value="combinations" className="mt-4">
          <CombinationsGrid
            combinations={combinations}
            onSave={async (updated) => {
              await saveDailyTableField("combinations", updated);
              setCombinations(updated);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

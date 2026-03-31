import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  ArrowLeft, ChevronRight, Search, Filter, Loader2, ArrowUpRight,
} from "lucide-react";
import {
  fetchPricingRunById,
  fetchRunItems,
  promoteItem,
  fetchOperations,
} from "@/lib/services/pricing-engine";
import { fmtBRL, fmtNum, fmtFx, fmtDate, fmtDateTime } from "@/lib/formatters";
import { toast } from "sonner";

export default function PricingRunDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [run, setRun] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [filterCommodity, setFilterCommodity] = useState("all");
  const [promoting, setPromoting] = useState<string | null>(null);

  const loadData = useCallback(async (withRetry = false) => {
    if (!id) return;

    let runData: any = null;
    const maxAttempts = withRetry ? 6 : 1;
    for (let i = 0; i < maxAttempts; i++) {
      try {
        runData = await fetchPricingRunById(id);
        if (runData) break;
      } catch { /* not ready */ }
      if (i < maxAttempts - 1) await new Promise((r) => setTimeout(r, 500));
    }

    const itemsData = runData ? await fetchRunItems(id) : [];
    setRun(runData);
    setItems(itemsData);
  }, [id]);

  useEffect(() => {
    loadData(true)
      .catch(() => toast.error("Erro ao carregar run"))
      .finally(() => setLoading(false));
  }, [loadData]);

  const handlePromote = async (itemId: string) => {
    setPromoting(itemId);
    try {
      const result = await promoteItem(itemId);
      if (result.success || result.already_promoted) {
        toast.success(result.already_promoted ? "Item já promovido" : "Operação criada com sucesso");
        await loadData();
      } else {
        toast.error("Erro: " + (result.error ?? "desconhecido"));
      }
    } catch (e: any) {
      toast.error("Falha: " + e.message);
    } finally {
      setPromoting(null);
    }
  };

  if (loading) return <LoadingState message="Carregando run..." />;
  if (!run) return (
    <div className="text-center py-20 space-y-3">
      <p className="text-muted-foreground">Run ainda sendo processado ou não encontrado.</p>
      <Button variant="outline" size="sm" onClick={() => { setLoading(true); loadData(true).finally(() => setLoading(false)); }}>
        <RefreshCw className="h-4 w-4 mr-1" /> Tentar novamente
      </Button>
    </div>
  );

  // Filter items
  const commodities = [...new Set(items.map((i) => i.commodity).filter(Boolean))];
  const filtered = items.filter((item) => {
    if (filterCommodity !== "all" && item.commodity !== filterCommodity) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (item.combination_name || "").toLowerCase().includes(q) ||
        (item.ticker || "").toLowerCase().includes(q) ||
        (item.warehouse || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const summary = run.output_summary as any;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Pricing Run`}
        description={`ID: ${run.id}`}
        actions={
          <Button variant="outline" onClick={() => navigate("/pricing-runs")}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Voltar
          </Button>
        }
      />

      {/* Run info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <InfoCard label="Status"><StatusBadge status={run.status} /></InfoCard>
        <InfoCard label="Engine">{run.engine_name ?? "—"}</InfoCard>
        <InfoCard label="Versão">{run.engine_version ?? "—"}</InfoCard>
        <InfoCard label="Itens">{summary?.items_created ?? summary?.calculated_items ?? items.length}</InfoCard>
        <InfoCard label="Início">{fmtDateTime(run.started_at)}</InfoCard>
        <InfoCard label="Fim">{fmtDateTime(run.completed_at)}</InfoCard>
      </div>

      {/* Items table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-sm font-semibold">
              Run Items <Badge variant="outline" className="ml-2 text-[10px]">{filtered.length} / {items.length}</Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="h-8 pl-8 text-xs w-[180px]"
                />
              </div>
              <Select value={filterCommodity} onValueChange={setFilterCommodity}>
                <SelectTrigger className="h-8 w-[120px] text-xs">
                  <Filter className="h-3 w-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {commodities.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">Nenhum item encontrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px]">#</TableHead>
                    <TableHead className="text-[10px]">Nome</TableHead>
                    <TableHead className="text-[10px]">Commodity</TableHead>
                    <TableHead className="text-[10px]">Armazém</TableHead>
                    <TableHead className="text-[10px]">Ticker</TableHead>
                    <TableHead className="text-[10px]">Pagamento</TableHead>
                    <TableHead className="text-[10px]">Venda</TableHead>
                    <TableHead className="text-[10px] text-right">Preço Bruto</TableHead>
                    <TableHead className="text-[10px] text-right">Originação</TableHead>
                    <TableHead className="text-[10px] text-right">Basis Comprado</TableHead>
                    <TableHead className="text-[10px] text-right">Breakeven</TableHead>
                    <TableHead className="text-[10px]">Status</TableHead>
                    <TableHead className="text-[10px] w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => setSelectedItem(item)}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">{item.item_index}</TableCell>
                      <TableCell className="text-xs font-medium truncate max-w-[150px]">{item.combination_name ?? "—"}</TableCell>
                      <TableCell><CommodityBadge value={item.commodity} /></TableCell>
                      <TableCell className="text-xs">{item.warehouse ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{item.ticker ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{fmtDate(item.payment_date)}</TableCell>
                      <TableCell className="font-mono text-xs">{fmtDate(item.sale_date)}</TableCell>
                      <TableCell className="font-mono text-xs text-right">{fmtNum(item.gross_price_brl, 2)}</TableCell>
                      <TableCell className="font-mono text-xs text-right font-semibold">{fmtNum(item.origination_price_brl, 2)}</TableCell>
                      <TableCell className="font-mono text-xs text-right">{fmtNum(item.purchased_basis_brl, 2)}</TableCell>
                      <TableCell className="font-mono text-xs text-right">{fmtNum(item.breakeven_basis_brl, 2)}</TableCell>
                      <TableCell><StatusBadge status={item.status} /></TableCell>
                      <TableCell>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[10px]"
                            onClick={() => setSelectedItem(item)}
                          >
                            Detalhe
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px]"
                            disabled={promoting === item.id || item.is_promoted_to_operation}
                            onClick={() => handlePromote(item.id)}
                          >
                            {promoting === item.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : item.is_promoted_to_operation ? (
                              "Promovido"
                            ) : (
                              <><ArrowUpRight className="h-3 w-3 mr-0.5" /> Promover</>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetailPanel item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────

function InfoCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <div className="mt-0.5 text-sm font-mono">{children}</div>
      </CardContent>
    </Card>
  );
}

function CommodityBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-xs">—</span>;
  const colors: Record<string, string> = {
    soybean: "bg-emerald-100 text-emerald-800",
    corn: "bg-amber-100 text-amber-800",
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${colors[value] ?? ""}`}>
      {value === "soybean" ? "Soja" : value === "corn" ? "Milho" : value}
    </Badge>
  );
}

// ── Item Detail Panel ────────────────────────────────────────────────

function ItemDetailPanel({ item, onClose }: { item: any; onClose: () => void }) {
  const inputSnapshot = item.input_snapshot ?? {};
  const resultSnapshot = item.result_snapshot ?? {};

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="ml-auto w-full max-w-2xl bg-card border-l shadow-2xl overflow-y-auto relative z-10">
        <div className="sticky top-0 bg-card border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold">{item.combination_name ?? "Item Detail"}</h3>
            <p className="text-xs text-muted-foreground font-mono">{item.id}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Main data */}
          <Section title="Dados Principais">
            <Grid>
              <Field label="Commodity" value={item.commodity} />
              <Field label="Armazém" value={item.warehouse} />
              <Field label="Ticker" value={item.ticker} mono />
              <Field label="Pagamento" value={fmtDate(item.payment_date)} />
              <Field label="Venda" value={fmtDate(item.sale_date)} />
              <Field label="Recebimento" value={fmtDate(item.reception_date)} />
            </Grid>
          </Section>

          {/* Prices */}
          <Section title="Preços">
            <Grid>
              <Field label="Futures Price" value={fmtNum(item.futures_price, 4)} mono />
              <Field label="Exchange Rate" value={fmtFx(item.exchange_rate)} mono />
              <Field label="Preço Bruto (BRL)" value={fmtNum(item.gross_price_brl, 2)} mono />
              <Field label="Preço Originação (BRL)" value={fmtNum(item.origination_price_brl, 2)} mono highlight />
              <Field label="Basis Comprado" value={fmtNum(item.purchased_basis_brl, 2)} mono />
              <Field label="Target Basis" value={fmtNum(item.target_basis_brl, 2)} mono />
              <Field label="Breakeven Basis" value={fmtNum(item.breakeven_basis_brl, 2)} mono />
            </Grid>
          </Section>

          {/* Costs from result_snapshot */}
          {resultSnapshot.costs && (
            <Section title="Custos">
              <Grid>
                {Object.entries(resultSnapshot.costs).map(([k, v]) => (
                  <Field key={k} label={k} value={fmtNum(v as number, 4)} mono />
                ))}
              </Grid>
            </Section>
          )}

          {/* Insurance from result_snapshot */}
          {resultSnapshot.insurance && (
            <Section title="Seguro">
              {Array.isArray(resultSnapshot.insurance) ? (
                resultSnapshot.insurance.map((ins: any, i: number) => (
                  <div key={i} className="mb-3 p-3 rounded bg-muted/30">
                    <p className="text-xs font-semibold mb-1">{ins.scenario ?? ins.label ?? `Cenário ${i + 1}`}</p>
                    <Grid>
                      {Object.entries(ins).filter(([k]) => k !== "scenario" && k !== "label").map(([k, v]) => (
                        <Field key={k} label={k} value={typeof v === "number" ? fmtNum(v, 4) : String(v)} mono />
                      ))}
                    </Grid>
                  </div>
                ))
              ) : (
                <Grid>
                  {Object.entries(resultSnapshot.insurance).map(([k, v]) => (
                    <Field key={k} label={k} value={typeof v === "number" ? fmtNum(v as number, 4) : String(v)} mono />
                  ))}
                </Grid>
              )}
            </Section>
          )}

          {/* Input Snapshot */}
          <Section title="Input Snapshot">
            <pre className="text-[11px] font-mono bg-muted/50 rounded p-3 overflow-x-auto max-h-60">
              {JSON.stringify(inputSnapshot, null, 2)}
            </pre>
          </Section>

          {/* Result Snapshot */}
          <Section title="Result Snapshot">
            <pre className="text-[11px] font-mono bg-muted/50 rounded p-3 overflow-x-auto max-h-60">
              {JSON.stringify(resultSnapshot, null, 2)}
            </pre>
          </Section>

          {/* Engine Data */}
          <Section title="Engine Data">
            <Grid>
              <Field label="Status" value={item.status} />
              <Field label="Item Index" value={String(item.item_index)} mono />
              <Field label="Criado em" value={fmtDateTime(item.created_at)} />
            </Grid>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 border-b pb-1">{title}</h4>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{children}</div>;
}

function Field({
  label, value, mono, highlight,
}: {
  label: string; value: string | null | undefined; mono?: boolean; highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-sm mt-0.5 ${mono ? "font-mono" : ""} ${highlight ? "font-bold text-primary" : ""}`}>
        {value ?? "—"}
      </p>
    </div>
  );
}

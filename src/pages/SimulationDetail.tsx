import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { JsonViewer } from "@/components/shared/JsonViewer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Copy, ArrowRightCircle, Loader2 } from "lucide-react";
import {
  fetchPricingRunById,
  fetchPricingResultByRunId,
  fetchPricingRunItems,
  fetchInsuranceQuotesByRunId,
  promoteToOperation,
} from "@/lib/services/api";
import { fmtBRL, fmtNum, fmtFx, fmtDateTime, fmtDate } from "@/lib/formatters";
import { toast } from "sonner";

export default function SimulationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [run, setRun] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [promoting, setPromoting] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetchPricingRunById(id),
      fetchPricingResultByRunId(id),
      fetchPricingRunItems(id),
      fetchInsuranceQuotesByRunId(id),
    ]).then(([r, res, it, q]) => {
      setRun(r);
      setResult(res);
      setItems(it);
      setQuotes(q);
    }).catch(() => toast.error("Erro ao carregar detalhes"))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePromote = async (itemId: string) => {
    setPromoting(itemId);
    try {
      const resp = await promoteToOperation(itemId);
      if (resp.already_promoted) {
        toast.info("Este item já foi promovido anteriormente");
      } else if (resp.success) {
        toast.success("Promovido para operação com sucesso!");
      } else {
        toast.error("Erro: " + (resp.error ?? "desconhecido"));
      }
      // Refresh items
      if (id) {
        const refreshed = await fetchPricingRunItems(id);
        setItems(refreshed);
      }
    } catch (e: any) {
      toast.error("Falha ao promover: " + e.message);
    } finally {
      setPromoting(null);
    }
  };

  if (loading) return <LoadingState />;
  if (!run) return <div className="text-center py-20 text-muted-foreground">Simulação não encontrada</div>;

  const kv = (label: string, value: any) => (
    <div className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-mono font-medium">{value ?? "—"}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Detalhe da Simulação"
        description={`Run ID: ${run.id}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/simulacoes")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
            <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(run.id); toast.success("ID copiado"); }}>
              <Copy className="h-4 w-4 mr-1" /> Copiar ID
            </Button>
          </div>
        }
      />

      {/* Resumo do Run */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Informações do Run</CardTitle></CardHeader>
          <CardContent className="space-y-0">
            {kv("Status", run.status)}
            {kv("Engine", run.engine_name)}
            {kv("Versão", run.engine_version)}
            {kv("Criado em", fmtDateTime(run.created_at))}
            {kv("Erro", run.error_message ?? "Nenhum")}
          </CardContent>
        </Card>

        {result && (
          <>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Resultado - Preços</CardTitle></CardHeader>
              <CardContent className="space-y-0">
                {kv("Câmbio Spot", fmtFx(result.spot_fx))}
                {kv("Câmbio Forward", fmtFx(result.forward_fx))}
                {kv("Preço Futuro (BRL)", fmtBRL(result.futures_price_brl))}
                {kv("Preço Bruto", fmtBRL(result.origination_price_gross_brl))}
                {kv("Preço Líquido", fmtBRL(result.origination_price_net_brl))}
                {kv("Basis Alvo", fmtBRL(result.target_basis_brl))}
                {kv("Breakeven Basis", fmtBRL(result.breakeven_basis_brl))}
                {kv("Purchased Basis", fmtBRL(result.purchased_basis_brl))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Resultado - Custos</CardTitle></CardHeader>
              <CardContent className="space-y-0">
                {kv("Financeiro", fmtBRL(result.financial_brl))}
                {kv("Armazenagem", fmtBRL(result.storage_brl))}
                {kv("Corretagem", fmtBRL(result.brokerage_brl))}
                {kv("Desk Cost", fmtBRL(result.desk_cost_brl))}
                {kv("Total Custos", fmtBRL(result.total_cost_brl))}
                {kv("Seguro ATM", fmtBRL(result.insurance_atm_total_brl))}
                {kv("Seguro OTM 5%", fmtBRL(result.insurance_otm_5_total_brl))}
                {kv("Seguro OTM 10%", fmtBRL(result.insurance_otm_10_total_brl))}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Pricing Run Items */}
      {items.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Itens do Run ({items.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Combinação</TableHead>
                    <TableHead>Commodity</TableHead>
                    <TableHead>Ticker</TableHead>
                    <TableHead className="text-right">Futures</TableHead>
                    <TableHead className="text-right">FX</TableHead>
                    <TableHead className="text-right">Preço Bruto</TableHead>
                    <TableHead className="text-right">Preço Orig.</TableHead>
                    <TableHead className="text-right">Basis</TableHead>
                    <TableHead>Seguro</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-xs">{item.item_index}</TableCell>
                      <TableCell className="font-medium text-sm">{item.combination_name ?? "—"}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{item.commodity ?? "—"}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">{item.ticker ?? "—"}</TableCell>
                      <TableCell className="font-mono text-sm text-right">{fmtNum(item.futures_price)}</TableCell>
                      <TableCell className="font-mono text-sm text-right">{fmtFx(item.exchange_rate)}</TableCell>
                      <TableCell className="font-mono text-sm text-right">{fmtBRL(item.gross_price_brl)}</TableCell>
                      <TableCell className="font-mono text-sm text-right font-semibold">{fmtBRL(item.origination_price_brl)}</TableCell>
                      <TableCell className="font-mono text-sm text-right">{fmtBRL(item.target_basis_brl)}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{item.insurance_strategy ?? "none"}</Badge></TableCell>
                      <TableCell>
                        {item.is_promoted_to_operation ? (
                          <Badge variant="default" className="text-xs">Promovido</Badge>
                        ) : (
                          <StatusBadge status={item.status} />
                        )}
                      </TableCell>
                      <TableCell>
                        {!item.is_promoted_to_operation && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={promoting === item.id}
                            onClick={() => handlePromote(item.id)}
                          >
                            {promoting === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRightCircle className="h-3.5 w-3.5 mr-1" />}
                            Promover
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insurance Quotes */}
      {quotes.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Cotações de Seguro</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cenário</TableHead>
                    <TableHead className="text-right">Strike</TableHead>
                    <TableHead className="text-right">Prêmio</TableHead>
                    <TableHead className="text-right">Carry</TableHead>
                    <TableHead className="text-right">Custo Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotes.map((q: any) => (
                    <TableRow key={q.id}>
                      <TableCell>{(q.insurance_scenarios as any)?.label ?? q.scenario_id}</TableCell>
                      <TableCell className="font-mono text-right">{fmtBRL(q.strike_brl)}</TableCell>
                      <TableCell className="font-mono text-right">{fmtBRL(q.premium_brl)}</TableCell>
                      <TableCell className="font-mono text-right">{fmtBRL(q.carry_brl)}</TableCell>
                      <TableCell className="font-mono text-right font-semibold">{fmtBRL(q.total_cost_brl)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Snapshots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <JsonViewer data={run.input_snapshot} title="Input Snapshot" />
        <JsonViewer data={run.market_snapshot} title="Market Snapshot" />
        <JsonViewer data={run.parameters_snapshot} title="Parameters Snapshot" />
        <JsonViewer data={run.engine_result} title="Engine Result" />
      </div>

      {/* Auditoria */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Auditoria</CardTitle></CardHeader>
        <CardContent className="space-y-0">
          {kv("Run ID", run.id)}
          {kv("Input ID", run.input_id)}
          {kv("Engine Name", run.engine_name)}
          {kv("Engine Version", run.engine_version)}
          {kv("Created At", fmtDateTime(run.created_at))}
          {kv("Created By", run.created_by ?? "Sistema")}
        </CardContent>
      </Card>
    </div>
  );
}

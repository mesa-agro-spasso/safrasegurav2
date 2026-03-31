import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ChevronRight, RefreshCw, Loader2 } from "lucide-react";
import { fetchPricingRuns } from "@/lib/services/pricing-engine";
import { fmtDateTime } from "@/lib/formatters";
import { toast } from "sonner";

export default function PricingRuns() {
  const navigate = useNavigate();
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await fetchPricingRuns();
      setRuns(data);
    } catch {
      toast.error("Erro ao carregar pricing runs");
    }
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) return <LoadingState message="Carregando Pricing Runs..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pricing Runs"
        description="Histórico de execuções do motor de precificação"
        actions={
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1.5" />}
            Atualizar
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {runs.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-sm">Nenhum pricing run encontrado.</p>
              <p className="text-xs mt-1">Execute o pricing na Daily Table para gerar resultados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Data</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Engine</TableHead>
                    <TableHead className="text-xs">Versão</TableHead>
                    <TableHead className="text-xs">Itens</TableHead>
                    <TableHead className="text-xs">Início</TableHead>
                    <TableHead className="text-xs">Fim</TableHead>
                    <TableHead className="text-xs w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((run) => {
                    const summary = run.output_summary as any;
                    return (
                      <TableRow
                        key={run.id}
                        className="cursor-pointer hover:bg-muted/40 transition-colors"
                        onClick={() => navigate(`/pricing-runs/${run.id}`)}
                      >
                        <TableCell className="font-mono text-xs">{fmtDateTime(run.started_at)}</TableCell>
                        <TableCell><StatusBadge status={run.status} /></TableCell>
                        <TableCell className="text-xs">{run.engine_name ?? "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{run.engine_version ?? "—"}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {summary?.items_created ?? summary?.calculated_items ?? "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{fmtDateTime(run.started_at)}</TableCell>
                        <TableCell className="font-mono text-xs">{fmtDateTime(run.completed_at)}</TableCell>
                        <TableCell>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

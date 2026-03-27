import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { KpiCard } from "@/components/shared/KpiCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingState } from "@/components/shared/LoadingState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, ClipboardList, LineChart, TrendingUp, DollarSign, BarChart3, Play, Loader2 } from "lucide-react";
import { fetchDashboardStats, fetchAllPricingRuns, runPricingEngine } from "@/lib/services/api";
import { fmtFx, fmtDateTime, fmtNum } from "@/lib/formatters";
import { toast } from "sonner";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [recentRuns, setRecentRuns] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetchDashboardStats(),
      fetchAllPricingRuns(),
    ]).then(([s, runs]) => {
      setStats(s);
      setRecentRuns(runs.slice(0, 8));
    }).catch(() => toast.error("Erro ao carregar dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const handleRunEngine = async () => {
    setRunning(true);
    try {
      const result = await runPricingEngine();
      if (result.success) {
        toast.success(`Pricing executado: ${result.calculated_items ?? 0} itens calculados`);
        const runs = await fetchAllPricingRuns();
        setRecentRuns(runs.slice(0, 8));
        const newStats = await fetchDashboardStats();
        setStats(newStats);
      } else {
        toast.error("Erro: " + (result.error ?? "desconhecido"));
      }
    } catch (e: any) {
      toast.error("Falha ao executar engine: " + e.message);
    } finally {
      setRunning(false);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visão executiva do sistema de originação e hedge"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/nova-simulacao")}>
              <PlusCircle className="h-4 w-4 mr-1.5" /> Nova Simulação
            </Button>
            <Button variant="outline" onClick={() => navigate("/operacoes")}>
              <ClipboardList className="h-4 w-4 mr-1.5" /> Operações
            </Button>
            <Button onClick={handleRunEngine} disabled={running}>
              {running ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Play className="h-4 w-4 mr-1.5" />}
              Executar Pricing
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <KpiCard title="Simulações" value={stats?.totalRuns ?? 0} icon={LineChart} />
        <KpiCard title="Operações" value={stats?.totalOperations ?? 0} icon={ClipboardList} />
        <KpiCard title="Com Seguro" value={stats?.withInsurance ?? 0} icon={BarChart3} />
        <KpiCard title="Sem Seguro" value={stats?.withoutInsurance ?? 0} icon={BarChart3} />
        <KpiCard title="Câmbio Spot" value={stats?.lastSpotFx ? fmtFx(stats.lastSpotFx) : "—"} icon={DollarSign} />
        <KpiCard title="Câmbio Forward" value={stats?.lastForwardFx ? fmtFx(stats.lastForwardFx) : "—"} icon={TrendingUp} />
      </div>

      {/* Recent Runs */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Últimas Simulações (Pricing Runs)</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/simulacoes")}>Ver todas</Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentRuns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhuma simulação encontrada.</p>
              <p className="text-xs mt-1">Execute o pricing engine para gerar resultados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Engine</TableHead>
                    <TableHead>Versão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Erro</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRuns.map((run: any) => (
                    <TableRow key={run.id} className="cursor-pointer hover:bg-muted/40" onClick={() => navigate(`/simulacoes/${run.id}`)}>
                      <TableCell className="font-mono text-sm">{fmtDateTime(run.created_at)}</TableCell>
                      <TableCell className="text-sm">{run.engine_name ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{run.engine_version ?? "—"}</TableCell>
                      <TableCell><StatusBadge status={run.status} /></TableCell>
                      <TableCell className="text-xs text-destructive max-w-[200px] truncate">{run.error_message ?? ""}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/simulacoes/${run.id}`); }}>Detalhe</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

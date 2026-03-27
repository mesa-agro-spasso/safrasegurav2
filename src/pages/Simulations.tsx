import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, RefreshCw, Eye } from "lucide-react";
import { fetchAllPricingRuns } from "@/lib/services/api";
import { fmtDateTime } from "@/lib/formatters";
import { toast } from "sonner";

export default function Simulations() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [runs, setRuns] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    fetchAllPricingRuns()
      .then(setRuns)
      .catch(() => toast.error("Erro ao carregar simulações"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = runs.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.engine_name?.toLowerCase().includes(q) ||
      r.engine_version?.toLowerCase().includes(q) ||
      r.status?.toLowerCase().includes(q) ||
      r.id?.toLowerCase().includes(q)
    );
  });

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Simulações"
        description="Histórico de pricing runs executados"
        actions={
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4 mr-1.5" /> Atualizar
          </Button>
        }
      />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por engine, versão, status..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Badge variant="outline" className="font-mono">{filtered.length} runs</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Engine</TableHead>
                  <TableHead>Versão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Erro</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Nenhuma simulação encontrada</TableCell></TableRow>
                ) : (
                  filtered.map((run: any) => (
                    <TableRow key={run.id} className="cursor-pointer hover:bg-muted/40" onClick={() => navigate(`/simulacoes/${run.id}`)}>
                      <TableCell className="font-mono text-sm">{fmtDateTime(run.created_at)}</TableCell>
                      <TableCell className="text-sm">{run.engine_name ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{run.engine_version ?? "—"}</TableCell>
                      <TableCell><StatusBadge status={run.status} /></TableCell>
                      <TableCell className="text-xs text-destructive max-w-[250px] truncate">{run.error_message ?? ""}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm"><Eye className="h-4 w-4 mr-1" /> Detalhe</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

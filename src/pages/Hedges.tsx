import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw } from "lucide-react";
import { fetchAllHedges } from "@/lib/services/api";
import { fmtBRL, fmtNum, fmtDate } from "@/lib/formatters";
import { toast } from "sonner";

export default function Hedges() {
  const [loading, setLoading] = useState(true);
  const [hedges, setHedges] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    fetchAllHedges()
      .then(setHedges)
      .catch(() => toast.error("Erro ao carregar hedges"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = hedges.filter((h) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      h.hedge_type?.toLowerCase().includes(q) ||
      h.instrument?.toLowerCase().includes(q) ||
      h.ticker?.toLowerCase().includes(q) ||
      h.scenario_code?.toLowerCase().includes(q)
    );
  });

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hedges"
        description="Instrumentos de hedge vinculados a operações"
        actions={<Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-1.5" /> Atualizar</Button>}
      />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por tipo, instrumento, ticker..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Badge variant="outline" className="font-mono">{filtered.length} hedges</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operação</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cenário</TableHead>
                  <TableHead>Instrumento</TableHead>
                  <TableHead>Ticker</TableHead>
                  <TableHead className="text-right">Strike</TableHead>
                  <TableHead className="text-right">Prêmio</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead>Vencimento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground">Nenhum hedge encontrado</TableCell></TableRow>
                ) : (
                  filtered.map((h: any) => (
                    <TableRow key={h.id}>
                      <TableCell className="font-mono text-xs">{h.operation_id?.substring(0, 8) ?? "—"}</TableCell>
                      <TableCell><Badge variant="outline">{h.hedge_type}</Badge></TableCell>
                      <TableCell className="text-sm">{h.scenario_code ?? "—"}</TableCell>
                      <TableCell className="text-sm">{h.instrument ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{h.ticker ?? "—"}</TableCell>
                      <TableCell className="font-mono text-right">{fmtBRL(h.strike_brl)}</TableCell>
                      <TableCell className="font-mono text-right">{fmtBRL(h.premium_brl)}</TableCell>
                      <TableCell className="font-mono text-right">{h.quantity != null ? fmtNum(h.quantity, 0) : "—"}</TableCell>
                      <TableCell className="font-mono text-sm">{fmtDate(h.expiration_date)}</TableCell>
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

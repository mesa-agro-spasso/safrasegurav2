import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingState } from "@/components/shared/LoadingState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, RefreshCw } from "lucide-react";
import { fetchAllOperations } from "@/lib/services/api";
import { fmtBRL, fmtNum, fmtDate } from "@/lib/formatters";
import { toast } from "sonner";

export default function OperationsPage() {
  const [loading, setLoading] = useState(true);
  const [operations, setOperations] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    fetchAllOperations()
      .then(setOperations)
      .catch(() => toast.error("Erro ao carregar operações"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = operations.filter((op) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(op.operation_number).includes(q) ||
      op.status?.toLowerCase().includes(q) ||
      op.unit?.toLowerCase().includes(q)
    );
  });

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operações"
        description="Operações registradas a partir de simulações promovidas"
        actions={
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4 mr-1.5" /> Atualizar</Button>
        }
      />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por número, status..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Badge variant="outline" className="font-mono">{filtered.length} operações</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Commodity</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Seguro</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Venda</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={10} className="text-center py-12 text-muted-foreground">Nenhuma operação encontrada</TableCell></TableRow>
                ) : (
                  filtered.map((op: any) => (
                    <TableRow key={op.id}>
                      <TableCell className="font-mono font-bold">{op.operation_number}</TableCell>
                      <TableCell className="font-mono text-sm">{fmtDate(op.created_at)}</TableCell>
                      <TableCell className="text-sm">{op.commodity_id?.substring(0, 8) ?? "—"}</TableCell>
                      <TableCell className="font-mono text-right">{op.volume != null ? fmtNum(op.volume, 0) : "—"}</TableCell>
                      <TableCell className="text-sm">{op.unit ?? "sc"}</TableCell>
                      <TableCell>{op.include_insurance ? <Badge variant="default" className="text-xs">Sim</Badge> : <Badge variant="outline" className="text-xs">Não</Badge>}</TableCell>
                      <TableCell className="font-mono text-sm">{fmtDate(op.payment_date)}</TableCell>
                      <TableCell className="font-mono text-sm">{fmtDate(op.sale_date)}</TableCell>
                      <TableCell><StatusBadge status={op.status} /></TableCell>
                      <TableCell className="text-xs max-w-[150px] truncate">{op.notes ?? ""}</TableCell>
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

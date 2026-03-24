import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import RunItemsTable from "./RunItemsTable";
import { fetchRunItems } from "@/lib/services/pricing-engine";

interface Props {
  runs: Record<string, unknown>[];
  initialRunId?: string | null;
  onRefreshOperations: () => void;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  completed: "default",
  running: "secondary",
  pending: "outline",
  failed: "destructive",
};

export default function PricingRunsTab({ runs, initialRunId, onRefreshOperations }: Props) {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(initialRunId ?? null);
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  useEffect(() => {
    if (initialRunId) setSelectedRunId(initialRunId);
  }, [initialRunId]);

  useEffect(() => {
    if (!selectedRunId) { setItems([]); return; }
    loadItems(selectedRunId);
  }, [selectedRunId]);

  const loadItems = async (runId: string) => {
    setLoadingItems(true);
    try {
      const data = await fetchRunItems(runId);
      setItems(data as Record<string, unknown>[]);
    } catch { setItems([]); }
    finally { setLoadingItems(false); }
  };

  const handlePromoted = () => {
    if (selectedRunId) loadItems(selectedRunId);
    onRefreshOperations();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Pricing Runs ({runs.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[250px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Data</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Engine</TableHead>
                  <TableHead className="text-xs">Version</TableHead>
                  <TableHead className="text-xs">Param ID</TableHead>
                  <TableHead className="text-xs">Resumo</TableHead>
                  <TableHead className="text-xs">Erro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground text-xs py-6">Nenhum run executado.</TableCell></TableRow>
                ) : runs.map((r) => {
                  const id = String(r.id);
                  const status = String(r.status ?? "pending");
                  const selected = id === selectedRunId;
                  return (
                    <TableRow
                      key={id}
                      className={`cursor-pointer ${selected ? "bg-accent" : ""}`}
                      onClick={() => setSelectedRunId(id)}
                    >
                      <TableCell className="text-xs font-mono">
                        {r.created_at ? new Date(String(r.created_at)).toLocaleString("pt-BR") : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[status] ?? "outline"} className="text-[10px]">{status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{String(r.engine_name ?? "—")}</TableCell>
                      <TableCell className="text-xs">{String(r.engine_version ?? "—")}</TableCell>
                      <TableCell className="text-xs font-mono">{String(r.daily_table_param_id ?? "—")}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">
                        {r.output_summary ? JSON.stringify(r.output_summary).slice(0, 60) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-destructive max-w-[150px] truncate">
                        {r.error_message ? String(r.error_message) : ""}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">
            Itens do Run
            {selectedRunId && <span className="text-xs text-muted-foreground font-normal ml-2">({items.length} itens)</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingItems ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <RunItemsTable items={items} onPromoted={handlePromoted} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

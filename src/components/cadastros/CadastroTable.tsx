import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, RefreshCw } from "lucide-react";
import { LoadingState } from "@/components/shared/LoadingState";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate, fmtNum } from "@/lib/formatters";
import { toast } from "sonner";

interface CadastroTableProps {
  tableName: string;
  columns: string[];
}

export function CadastroTable({ tableName, columns }: CadastroTableProps) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    (supabase as any)
      .from(tableName)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500)
      .then(({ data, error }: any) => {
        if (error) throw error;
        setRows(data ?? []);
      })
      .catch(() => toast.error(`Erro ao carregar ${tableName}`))
      .finally(() => setLoading(false));
  }, [tableName]);

  useEffect(() => { load(); }, [load]);

  const filtered = rows.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return columns.some((col) => String(r[col] ?? "").toLowerCase().includes(q));
  });

  const formatCell = (value: any) => {
    if (value == null) return "—";
    if (typeof value === "boolean") return value ? "Sim" : "Não";
    if (typeof value === "number") return fmtNum(value);
    if (typeof value === "object") return JSON.stringify(value).substring(0, 60);
    const str = String(value);
    if (/^\d{4}-\d{2}-\d{2}/.test(str) && str.length <= 10) return fmtDate(str);
    return str;
  };

  if (loading) return <LoadingState message={`Carregando ${tableName}...`} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Badge variant="outline" className="font-mono">{filtered.length} registros</Badge>
        <Button variant="outline" size="sm" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col} className="text-xs uppercase">{col.replace(/_/g, " ")}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={columns.length} className="text-center py-12 text-muted-foreground">Nenhum registro</TableCell></TableRow>
                ) : (
                  filtered.map((row, i) => (
                    <TableRow key={row.id ?? i}>
                      {columns.map((col) => (
                        <TableCell key={col} className="text-sm font-mono">
                          {typeof row[col] === "boolean" ? (
                            row[col] ? <Badge variant="default" className="text-xs">Sim</Badge> : <Badge variant="outline" className="text-xs">Não</Badge>
                          ) : (
                            formatCell(row[col])
                          )}
                        </TableCell>
                      ))}
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
